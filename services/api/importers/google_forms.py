import json
import re
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs
import uuid

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

from .base import BaseImporter


class GoogleFormsImporter(BaseImporter):
    """Import forms from Google Forms"""
    
    # Google Forms field type mappings
    FIELD_TYPE_MAPPING = {
        "TEXT": "text",
        "PARAGRAPH_TEXT": "long_text",
        "MULTIPLE_CHOICE": "single_select",
        "CHECKBOX": "multi_select",
        "DROPDOWN": "dropdown",
        "SCALE": "scale",
        "GRID": "matrix",
        "CHECKBOX_GRID": "matrix",
        "DATE": "date",
        "TIME": "text",  # We'll format time as text
        "FILE_UPLOAD": "file_upload",
    }
    
    def fetch_form_data(self, source: str, credentials: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fetch form data from Google Forms API"""
        form_id = self._extract_form_id(source)
        
        if not credentials:
            raise ValueError("Google OAuth credentials are required")
        
        # Create credentials object
        creds = Credentials(
            token=credentials.get("access_token"),
            refresh_token=credentials.get("refresh_token"),
            token_uri='https://oauth2.googleapis.com/token',
            client_id=credentials.get("client_id"),
            client_secret=credentials.get("client_secret")
        )
        
        # Build service
        service = build('forms', 'v1', credentials=creds)
        
        try:
            # Get form
            form = service.forms().get(formId=form_id).execute()
            return form
        except Exception as e:
            if "404" in str(e):
                raise ValueError(f"Form not found: {form_id}")
            elif "403" in str(e):
                raise ValueError("Access denied. Make sure you have permission to access this form.")
            else:
                raise ValueError(f"Failed to fetch form: {str(e)}")
    
    def transform_to_internal_format(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Google Forms data to our internal format"""
        info = source_data.get("info", {})
        
        form_data = {
            "title": info.get("title", "Imported Google Form"),
            "description": info.get("description", ""),
            "settings": self._transform_settings(source_data.get("settings", {})),
            "theme": self._transform_theme(source_data),
            "pages": self._transform_items_to_pages(source_data.get("items", [])),
            "logic": {"rules": []},  # Google Forms doesn't expose logic via API
            "metadata": {
                "imported_from": "google_forms",
                "original_id": source_data.get("formId"),
                "original_url": source_data.get("responderUri", "")
            }
        }
        
        # Add warning about features not available via API
        self.add_warning("Google Forms logic, response validation, and some advanced features cannot be imported via API")
        
        return form_data
    
    def _extract_form_id(self, source: str) -> str:
        """Extract form ID from Google Forms URL"""
        # Handle direct ID
        if not source.startswith("http"):
            return source
        
        # Parse URL
        parsed = urlparse(source)
        
        # Extract from path
        # Format: https://docs.google.com/forms/d/FORM_ID/edit
        # or: https://docs.google.com/forms/d/e/FORM_ID/viewform
        path_match = re.search(r'/forms/d/(?:e/)?([a-zA-Z0-9_-]+)', parsed.path)
        if path_match:
            return path_match.group(1)
        
        raise ValueError(f"Could not extract form ID from URL: {source}")
    
    def _transform_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Google Forms settings"""
        quiz_settings = settings.get("quizSettings", {})
        
        return {
            "collect_email": settings.get("collectEmail", False),
            "allow_response_edits": settings.get("allowResponseEdits", False),
            "limit_one_response": settings.get("limitOneResponsePerUser", False),
            "show_progress_bar": settings.get("showProgressBar", False),
            "shuffle_questions": settings.get("shuffleQuestions", False),
            "confirmation_message": settings.get("confirmationMessage", "Your response has been recorded."),
            "is_quiz": quiz_settings.get("isQuiz", False),
        }
    
    def _transform_theme(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Google Forms theme (limited info available)"""
        # Google Forms API doesn't expose theme details
        return {
            "primary_color": "#673AB7",  # Default Material Design purple
            "background_color": "#FFFFFF",
            "font_family": "Roboto, sans-serif",
        }
    
    def _transform_items_to_pages(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Google Forms items to pages with blocks"""
        pages = []
        current_page = None
        
        for item in items:
            item_id = item.get("itemId", str(uuid.uuid4()))
            
            # Check if this is a page break
            if item.get("pageBreakItem"):
                # Save current page if it has blocks
                if current_page and current_page["blocks"]:
                    pages.append(current_page)
                
                # Start new page
                current_page = {
                    "id": str(uuid.uuid4()),
                    "title": item.get("title", ""),
                    "description": item.get("description", ""),
                    "blocks": []
                }
            else:
                # Initialize page if needed
                if current_page is None:
                    current_page = {
                        "id": str(uuid.uuid4()),
                        "title": "",
                        "blocks": []
                    }
                
                # Transform question item to block
                block = self._transform_item_to_block(item)
                if block:
                    current_page["blocks"].append(block)
        
        # Add last page
        if current_page and current_page["blocks"]:
            pages.append(current_page)
        
        # Ensure at least one page exists
        if not pages:
            pages.append({
                "id": str(uuid.uuid4()),
                "title": "Page 1",
                "blocks": []
            })
        
        return pages
    
    def _transform_item_to_block(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Transform a Google Forms item to our block format"""
        # Skip non-question items
        question_item = item.get("questionItem")
        if not question_item:
            # Handle other item types
            if item.get("textItem"):
                return {
                    "id": item.get("itemId", str(uuid.uuid4())),
                    "type": "statement",
                    "question": item.get("title", ""),
                    "description": item.get("description", "")
                }
            elif item.get("imageItem"):
                self.add_warning(f"Image item '{item.get('title')}' cannot be imported")
            elif item.get("videoItem"):
                self.add_warning(f"Video item '{item.get('title')}' cannot be imported")
            
            return None
        
        question = question_item.get("question", {})
        item_id = item.get("itemId", str(uuid.uuid4()))
        
        # Determine field type
        field_type = None
        field_config = {}
        
        if question.get("textQuestion"):
            field_type = "PARAGRAPH_TEXT" if question["textQuestion"].get("paragraph") else "TEXT"
            
        elif question.get("choiceQuestion"):
            choice_q = question["choiceQuestion"]
            field_type = choice_q.get("type", "RADIO")
            
            # Get options
            options = [opt.get("value", "") for opt in choice_q.get("options", [])]
            field_config["options"] = options
            field_config["shuffle"] = choice_q.get("shuffle", False)
            
        elif question.get("scaleQuestion"):
            scale_q = question["scaleQuestion"]
            field_type = "SCALE"
            field_config["min"] = scale_q.get("low", 1)
            field_config["max"] = scale_q.get("high", 5)
            field_config["min_label"] = scale_q.get("lowLabel")
            field_config["max_label"] = scale_q.get("highLabel")
            
        elif question.get("dateQuestion"):
            field_type = "DATE"
            field_config["include_time"] = question["dateQuestion"].get("includeTime", False)
            field_config["include_year"] = question["dateQuestion"].get("includeYear", True)
            
        elif question.get("timeQuestion"):
            field_type = "TIME"
            
        elif question.get("rowQuestion"):
            field_type = "GRID" if question.get("gratingScale") else "TEXT"
            self.add_warning(f"Grid question '{item.get('title')}' may require manual configuration")
            
        elif question.get("fileUploadQuestion"):
            field_type = "FILE_UPLOAD"
            upload_q = question["fileUploadQuestion"]
            field_config["max_files"] = upload_q.get("maxFiles", 1)
            field_config["max_file_size"] = upload_q.get("maxFileSize", 10 * 1024 * 1024)  # 10MB default
            field_config["file_types"] = upload_q.get("fileTypes", [])
        
        if not field_type:
            self.add_warning(f"Unknown question type for '{item.get('title')}'")
            field_type = "TEXT"
        
        # Map field type
        target_type, notes = self.map_field_type(field_type)
        
        # Create field mapping
        self.create_field_mapping(
            source_type=field_type,
            source_id=item_id,
            target_type=target_type,
            target_id=item_id,
            notes=notes
        )
        
        # Build block
        block = {
            "id": item_id,
            "type": target_type,
            "question": item.get("title", ""),
            "description": item.get("description"),
            "required": question.get("required", False),
        }
        
        # Apply field-specific config
        if target_type in ["single_select", "multi_select", "dropdown"]:
            block["options"] = field_config.get("options", [])
            if field_config.get("shuffle"):
                block["shuffle_options"] = True
                
            # Handle "Other" option
            if field_config.get("has_other_option"):
                block["allow_other"] = True
                
        elif target_type in ["scale", "rating"]:
            block["min"] = field_config.get("min", 1)
            block["max"] = field_config.get("max", 5)
            block["min_label"] = field_config.get("min_label")
            block["max_label"] = field_config.get("max_label")
            
        elif target_type == "file_upload":
            block["max_files"] = field_config.get("max_files", 1)
            block["max_size"] = field_config.get("max_file_size")
            block["accept"] = field_config.get("file_types", [])
        
        # Handle validation (limited in API)
        if question.get("textQuestion"):
            text_q = question["textQuestion"]
            validations = []
            
            # Note: Google Forms API doesn't expose all validation rules
            self.add_warning(f"Text validation for '{item.get('title')}' may not be fully imported")
        
        return block
    
    def _map_choice_type(self, choice_type: str) -> str:
        """Map Google Forms choice type to our type"""
        mapping = {
            "RADIO": "single_select",
            "CHECKBOX": "multi_select",
            "DROP_DOWN": "dropdown",
        }
        return mapping.get(choice_type, "single_select")