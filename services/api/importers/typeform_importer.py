"""
Typeform importer with high parity support
"""

import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import uuid

from forms.models import Form


class TypeformImporter:
    """DEPRECATED: Typeform importer - needs refactor for JSON-based form structure"""
    """Import Typeform JSON exports with maximum parity"""
    
    # Typeform to our block type mapping
    TYPE_MAPPING = {
        "short_text": "text",
        "long_text": "long_text",
        "email": "email",
        "phone_number": "phone",
        "number": "number",
        "date": "date",
        "dropdown": "dropdown",
        "multiple_choice": "select",
        "picture_choice": "select",
        "yes_no": "select",
        "legal": "checkbox",
        "rating": "rating",
        "opinion_scale": "scale",
        "nps": "nps",
        "matrix": "matrix",
        "ranking": "ranking",
        "file_upload": "file_upload",
        "payment": "payment",
        "website": "text",
        "statement": "statement",
    }
    
    # Features that don't have direct mapping
    UNSUPPORTED_FEATURES = {
        "picture_choice": "Use select with image URLs in description",
        "legal": "Use checkbox with legal text in description",
        "website": "Use text field with URL validation",
        "group": "Flatten into individual questions",
        "contact_info": "Split into separate email/phone fields",
    }
    
    def __init__(self, organization):
        self.organization = organization
        self.import_report = {
            "total_questions": 0,
            "imported": 0,
            "unsupported": [],
            "warnings": [],
            "field_mapping": {},
        }
    
    def import_form(self, typeform_data: Dict[str, Any], created_by) -> Tuple[Form, Dict]:
        """Import a Typeform definition and return Form instance with report"""
        
        # Create form
        form = Form.objects.create(
            organization=self.organization,
            title=typeform_data.get("title", "Imported Typeform"),
            description=typeform_data.get("welcome_screens", [{}])[0].get("title", ""),
            created_by=created_by,
            metadata={
                "imported_from": "typeform",
                "original_id": typeform_data.get("id"),
                "import_date": datetime.now().isoformat(),
            }
        )
        
        # Process fields/questions
        fields = typeform_data.get("fields", [])
        self.import_report["total_questions"] = len(fields)
        
        # Group by screens if logic jumps exist, otherwise single page
        pages = self._group_into_pages(fields, typeform_data.get("logic", {}))
        
        for page_idx, page_fields in enumerate(pages):
            form_page = FormPage.objects.create(
                form=form,
                order=page_idx,
                title=f"Page {page_idx + 1}",
            )
            
            for field_idx, field in enumerate(page_fields):
                self._import_field(field, form_page, field_idx)
        
        # Import logic rules
        self._import_logic(typeform_data.get("logic", {}), form)
        
        # Import theme/settings
        self._import_theme(typeform_data.get("theme", {}), form)
        
        return form, self.import_report
    
    def _group_into_pages(self, fields: List[Dict], logic: Dict) -> List[List[Dict]]:
        """Group fields into pages based on logic jumps"""
        # For now, simple single page unless complex logic
        # TODO: Analyze jump logic to create smart page breaks
        return [fields]
    
    def _import_field(self, field: Dict, page: Dict, order: int) -> Optional[Dict]:
        """Import a single Typeform field"""
        field_type = field.get("type")
        field_id = field.get("id") or str(uuid.uuid4())
        
        # Check if supported
        our_type = self.TYPE_MAPPING.get(field_type)
        if not our_type:
            self.import_report["unsupported"].append({
                "field": field.get("title", "Unknown"),
                "type": field_type,
                "suggestion": self.UNSUPPORTED_FEATURES.get(field_type, "No direct equivalent"),
            })
            return None
        
        # Extract properties
        properties = field.get("properties", {})
        validations = field.get("validations", {})
        
        # Create block
        block_data = {
            "id": field_id,
            "type": our_type,
            "question": field.get("title", ""),
            "description": properties.get("description", ""),
            "required": validations.get("required", False),
            "placeholder": properties.get("placeholder", ""),
        }
        
        # Handle type-specific properties
        if field_type in ["multiple_choice", "picture_choice", "dropdown"]:
            choices = properties.get("choices", [])
            block_data["options"] = [
                {
                    "id": choice.get("id", str(uuid.uuid4())),
                    "text": choice.get("label", ""),
                    "value": choice.get("ref", choice.get("label", "")),
                }
                for choice in choices
            ]
        
        elif field_type == "yes_no":
            block_data["options"] = [
                {"id": "yes", "text": "Yes", "value": "yes"},
                {"id": "no", "text": "No", "value": "no"},
            ]
        
        elif field_type == "rating":
            block_data["properties"] = {
                "steps": properties.get("steps", 5),
                "shape": properties.get("shape", "star"),
            }
        
        elif field_type == "opinion_scale":
            block_data["properties"] = {
                "steps": properties.get("steps", 10),
                "start_at_one": properties.get("start_at_one", True),
                "labels": {
                    "left": properties.get("labels", {}).get("left", ""),
                    "right": properties.get("labels", {}).get("right", ""),
                },
            }
        
        elif field_type == "file_upload":
            block_data["properties"] = {
                "max_size": properties.get("max_size", 10485760),  # 10MB default
                "allowed_types": properties.get("file_types", ["image", "document"]),
            }
        
        # Handle validations
        if validations:
            block_data["validation"] = []
            
            if "max_length" in validations:
                block_data["validation"].append({
                    "type": "max",
                    "value": validations["max_length"],
                })
            
            if "min_value" in validations:
                block_data["validation"].append({
                    "type": "min",
                    "value": validations["min_value"],
                })
            
            if "max_value" in validations:
                block_data["validation"].append({
                    "type": "max",
                    "value": validations["max_value"],
                })
        
        # Create block
        block = FormBlock.objects.create(
            page=page,
            order=order,
            data=block_data,
        )
        
        self.import_report["imported"] += 1
        self.import_report["field_mapping"][field_id] = block.data["id"]
        
        return block
    
    def _import_logic(self, logic_data: Dict, form: Form) -> None:
        """Import Typeform logic/jump rules"""
        logic_rules = []
        
        for logic_block in logic_data:
            if logic_block.get("type") == "field":
                field_ref = logic_block.get("ref")
                
                for action in logic_block.get("actions", []):
                    condition = action.get("condition", {})
                    details = action.get("details", {})
                    
                    # Map to our logic format
                    if action.get("action") == "jump":
                        target_ref = details.get("to", {}).get("value")
                        
                        if field_ref in self.import_report["field_mapping"]:
                            rule = {
                                "id": f"rule-{uuid.uuid4()}",
                                "conditions": [
                                    self._map_condition(condition, field_ref)
                                ],
                                "actions": [
                                    {
                                        "type": "jump",
                                        "target": self.import_report["field_mapping"].get(
                                            target_ref, "next"
                                        ),
                                    }
                                ],
                            }
                            logic_rules.append(rule)
                        else:
                            self.import_report["warnings"].append(
                                f"Logic rule references unmapped field: {field_ref}"
                            )
        
        if logic_rules:
            form.data["logic"] = logic_rules
            form.save()
    
    def _map_condition(self, condition: Dict, field_ref: str) -> Dict:
        """Map Typeform condition to our format"""
        op_mapping = {
            "equal": "equals",
            "not_equal": "not_equals",
            "contains": "contains",
            "not_contains": "not_contains",
            "greater_than": "greater_than",
            "less_than": "less_than",
        }
        
        return {
            "field": self.import_report["field_mapping"].get(field_ref, field_ref),
            "operator": op_mapping.get(condition.get("op"), "equals"),
            "value": condition.get("value"),
        }
    
    def _import_theme(self, theme_data: Dict, form: Form) -> None:
        """Import Typeform theme settings"""
        if not theme_data:
            return
        
        colors = theme_data.get("colors", {})
        font = theme_data.get("font", "")
        
        form.data["theme"] = {
            "colors": {
                "primary": colors.get("answer", "#3B82F6"),
                "background": colors.get("background", "#FFFFFF"),
                "text": colors.get("question", "#111827"),
            },
            "typography": {
                "fontFamily": self._map_font(font),
            },
        }
        form.save()
    
    def _map_font(self, typeform_font: str) -> str:
        """Map Typeform fonts to web-safe equivalents"""
        font_mapping = {
            "Apercu": "Inter, sans-serif",
            "Bangers": "'Bangers', cursive",
            "Caveat": "'Caveat', cursive",
            "Courier": "'Courier New', monospace",
            "Dancing Script": "'Dancing Script', cursive",
            "Karla": "'Karla', sans-serif",
            "Lato": "'Lato', sans-serif",
            "Montserrat": "'Montserrat', sans-serif",
            "Open Sans": "'Open Sans', sans-serif",
            "Oswald": "'Oswald', sans-serif",
            "Playfair Display": "'Playfair Display', serif",
            "Quicksand": "'Quicksand', sans-serif",
            "Raleway": "'Raleway', sans-serif",
            "Roboto": "'Roboto', sans-serif",
            "Source Sans Pro": "'Source Sans Pro', sans-serif",
        }
        
        return font_mapping.get(typeform_font, "Inter, sans-serif")