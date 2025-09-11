"""
Google Forms importer with native support
"""

import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import uuid

from forms.models import Form


class GoogleFormsImporter:
    """Import Google Forms JSON exports"""
    
    # Google Forms to our block type mapping
    TYPE_MAPPING = {
        0: "text",           # Short answer
        1: "long_text",      # Paragraph
        2: "single_select",  # Multiple choice
        3: "dropdown",       # Dropdown
        4: "multi_select",   # Checkboxes
        5: "scale",          # Linear scale
        7: "single_select",  # Multiple choice grid -> simplified
        8: "multi_select",   # Checkbox grid -> simplified
        9: "date",           # Date
        10: "time",          # Time
        11: "file_upload",   # File upload
    }
    
    # Features that need adaptation
    ADAPTATION_NOTES = {
        7: "Multiple choice grid simplified to single select",
        8: "Checkbox grid simplified to multi select",
        6: "Section header converted to statement block",
    }
    
    def __init__(self, organization):
        self.organization = organization
        self.import_report = {
            "total_questions": 0,
            "imported": 0,
            "adapted": [],
            "warnings": [],
            "sections": 0,
        }
    
    def import_form(self, gforms_data: Dict[str, Any], created_by) -> Tuple[Form, Dict]:
        """Import a Google Forms definition and return Form instance with report"""
        
        # Create form
        form = Form.objects.create(
            organization=self.organization,
            title=gforms_data.get("info", {}).get("title", "Imported Google Form"),
            description=gforms_data.get("info", {}).get("description", ""),
            created_by=created_by,
            metadata={
                "imported_from": "google_forms",
                "original_id": gforms_data.get("info", {}).get("documentTitle"),
                "import_date": datetime.now().isoformat(),
            }
        )
        
        # Process items (questions)
        items = gforms_data.get("items", [])
        self.import_report["total_questions"] = len(items)
        
        # Group by sections
        pages = self._group_by_sections(items)
        self.import_report["sections"] = len(pages)
        
        for page_idx, (page_title, page_items) in enumerate(pages):
            form_page = FormPage.objects.create(
                form=form,
                order=page_idx,
                title=page_title or f"Section {page_idx + 1}",
            )
            
            for item_idx, item in enumerate(page_items):
                self._import_item(item, form_page, item_idx)
        
        # Import form settings
        self._import_settings(gforms_data, form)
        
        return form, self.import_report
    
    def _group_by_sections(self, items: List[Dict]) -> List[Tuple[str, List[Dict]]]:
        """Group items by page break sections"""
        pages = []
        current_section = []
        current_title = None
        
        for item in items:
            if item.get("type") == 6:  # Page break
                if current_section:
                    pages.append((current_title, current_section))
                current_section = []
                current_title = item.get("title", "")
            else:
                current_section.append(item)
        
        # Add final section
        if current_section:
            pages.append((current_title, current_section))
        
        # If no sections, create single page
        if not pages:
            pages = [(None, items)]
        
        return pages
    
    def _import_item(self, item: Dict, page: FormPage, order: int) -> Optional[FormBlock]:
        """Import a single Google Forms item"""
        item_type = item.get("type", 0)
        item_id = item.get("id") or str(uuid.uuid4())
        
        # Skip section headers (already used for pages)
        if item_type == 6:
            return None
        
        # Get our block type
        our_type = self.TYPE_MAPPING.get(item_type)
        if not our_type:
            self.import_report["warnings"].append({
                "item": item.get("title", "Unknown"),
                "type": item_type,
                "reason": "Unsupported question type",
            })
            return None
        
        # Note adaptations
        if item_type in self.ADAPTATION_NOTES:
            self.import_report["adapted"].append({
                "item": item.get("title", "Unknown"),
                "adaptation": self.ADAPTATION_NOTES[item_type],
            })
        
        # Create block data
        block_data = {
            "id": item_id,
            "type": our_type,
            "question": item.get("title", ""),
            "description": item.get("helpText", ""),
            "required": item.get("required", False),
        }
        
        # Handle type-specific properties
        if item_type in [2, 3, 4]:  # Multiple choice, dropdown, checkboxes
            choices = item.get("choices", [])
            block_data["options"] = [
                {
                    "id": str(idx),
                    "text": choice.get("value", ""),
                    "value": choice.get("value", ""),
                }
                for idx, choice in enumerate(choices)
            ]
            
            # Handle "Other" option
            if item.get("hasOtherOption"):
                block_data["options"].append({
                    "id": "other",
                    "text": "Other",
                    "value": "other",
                })
                self.import_report["warnings"].append({
                    "item": item.get("title", "Unknown"),
                    "warning": "'Other' option converted to regular option",
                })
        
        elif item_type == 5:  # Linear scale
            scale_data = item.get("scaleData", {})
            block_data["properties"] = {
                "min": scale_data.get("low", 1),
                "max": scale_data.get("high", 5),
                "min_label": scale_data.get("lowLabel", ""),
                "max_label": scale_data.get("highLabel", ""),
            }
        
        elif item_type in [7, 8]:  # Grid types
            # Simplified to single/multi select with first row as options
            rows = item.get("rows", [])
            if rows:
                block_data["options"] = [
                    {
                        "id": str(idx),
                        "text": row,
                        "value": row,
                    }
                    for idx, row in enumerate(rows)
                ]
        
        elif item_type == 0:  # Short text
            validation = item.get("textValidation", {})
            if validation:
                block_data["validation"] = []
                
                if validation.get("type") == "NUMBER":
                    block_data["type"] = "number"
                elif validation.get("type") == "EMAIL":
                    block_data["type"] = "email"
                
                if "minLength" in validation:
                    block_data["validation"].append({
                        "type": "min",
                        "value": validation["minLength"],
                        "message": validation.get("minErrorText", ""),
                    })
                
                if "maxLength" in validation:
                    block_data["validation"].append({
                        "type": "max",
                        "value": validation["maxLength"],
                        "message": validation.get("maxErrorText", ""),
                    })
        
        elif item_type == 11:  # File upload
            block_data["properties"] = {
                "max_files": item.get("maxFiles", 1),
                "max_size": item.get("maxFileSize", 10) * 1024 * 1024,  # Convert MB to bytes
                "allowed_types": self._map_file_types(item.get("types", [])),
            }
        
        # Create block
        block = FormBlock.objects.create(
            page=page,
            order=order,
            data=block_data,
        )
        
        self.import_report["imported"] += 1
        
        return block
    
    def _map_file_types(self, gforms_types: List[str]) -> List[str]:
        """Map Google Forms file types to our format"""
        type_mapping = {
            "ANY": ["*"],
            "DOCUMENT": ["pdf", "doc", "docx", "txt"],
            "PRESENTATION": ["ppt", "pptx"],
            "SPREADSHEET": ["xls", "xlsx", "csv"],
            "DRAWING": ["svg", "png", "jpg"],
            "PDF": ["pdf"],
            "IMAGE": ["jpg", "jpeg", "png", "gif", "webp"],
            "VIDEO": ["mp4", "avi", "mov", "webm"],
            "AUDIO": ["mp3", "wav", "ogg"],
        }
        
        allowed = []
        for gtype in gforms_types:
            allowed.extend(type_mapping.get(gtype, []))
        
        return list(set(allowed)) or ["*"]
    
    def _import_settings(self, gforms_data: Dict, form: Form) -> None:
        """Import Google Forms settings"""
        settings = gforms_data.get("settings", {})
        info = gforms_data.get("info", {})
        
        form.data["settings"] = {
            "submitText": settings.get("submitText", "Submit"),
            "showProgressBar": settings.get("showProgressBar", False),
            "shuffleQuestions": settings.get("shuffleQuestionOrder", False),
            "confirmationMessage": settings.get("confirmationMessage", "Your response has been recorded."),
            "allowResponseEditing": settings.get("allowResponseEdits", False),
            "requireSignIn": settings.get("requireSignIn", False),
            "collectEmail": settings.get("collectEmail", False),
        }
        
        # Map quiz settings if present
        if settings.get("isQuiz"):
            form.data["quiz_settings"] = {
                "enabled": True,
                "showCorrectAnswers": settings.get("showCorrectAnswers", False),
                "showPoints": settings.get("showPointValues", False),
                "passingScore": None,  # Google Forms doesn't have this
            }
            
            self.import_report["warnings"].append({
                "feature": "Quiz mode",
                "note": "Quiz imported but correct answers need to be reconfigured",
            })
        
        form.save()
    
    @staticmethod
    def parse_google_forms_url(url: str) -> Optional[str]:
        """Extract form ID from Google Forms URL"""
        import re
        
        # Match various Google Forms URL patterns
        patterns = [
            r"forms\.google\.com/[^/]+/forms/d/([a-zA-Z0-9_-]+)",
            r"docs\.google\.com/forms/d/([a-zA-Z0-9_-]+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None