import requests
from typing import Dict, Any, List, Optional
import uuid
from urllib.parse import urlparse
import re

from .base import BaseImporter


class TypeformImporter(BaseImporter):
    """Import forms from Typeform"""
    
    API_BASE = "https://api.typeform.com"
    
    # Typeform field type mappings
    FIELD_TYPE_MAPPING = {
        "short_text": "text",
        "long_text": "long_text",
        "email": "email",
        "phone_number": "phone",
        "number": "number",
        "date": "date",
        "dropdown": "dropdown",
        "multiple_choice": "single_select",
        "picture_choice": "single_select",
        "yes_no": "single_select",
        "legal": "single_select",
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
    
    def fetch_form_data(self, source: str, credentials: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fetch form data from Typeform API"""
        # Extract form ID from URL or use as-is
        form_id = self._extract_form_id(source)
        
        if not credentials or not credentials.get("access_token"):
            raise ValueError("Typeform access token is required")
        
        # Fetch form definition
        headers = {
            "Authorization": f"Bearer {credentials['access_token']}"
        }
        
        response = requests.get(
            f"{self.API_BASE}/forms/{form_id}",
            headers=headers
        )
        
        if response.status_code == 404:
            raise ValueError(f"Form not found: {form_id}")
        elif response.status_code == 401:
            raise ValueError("Invalid access token")
        elif response.status_code != 200:
            raise ValueError(f"Failed to fetch form: {response.text}")
        
        return response.json()
    
    def transform_to_internal_format(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Typeform data to our internal format"""
        form_data = {
            "title": source_data.get("title", "Imported Typeform"),
            "description": source_data.get("settings", {}).get("meta", {}).get("description", ""),
            "settings": self._transform_settings(source_data.get("settings", {})),
            "theme": self._transform_theme(source_data.get("theme", {})),
            "pages": self._transform_fields_to_pages(source_data.get("fields", [])),
            "logic": self._transform_logic(source_data.get("logic", {})),
            "metadata": {
                "imported_from": "typeform",
                "original_id": source_data.get("id"),
                "original_url": source_data.get("_links", {}).get("display", "")
            }
        }
        
        return form_data
    
    def _extract_form_id(self, source: str) -> str:
        """Extract form ID from Typeform URL"""
        # Handle direct ID
        if not source.startswith("http"):
            return source
        
        # Parse URL
        parsed = urlparse(source)
        
        # Check for form ID in path
        # Formats: 
        # - https://form.typeform.com/to/ABC123
        # - https://typeform.com/forms/ABC123
        path_match = re.search(r'/(?:to|forms)/([a-zA-Z0-9]+)', parsed.path)
        if path_match:
            return path_match.group(1)
        
        raise ValueError(f"Could not extract form ID from URL: {source}")
    
    def _transform_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Typeform settings"""
        return {
            "show_progress_bar": settings.get("show_progress_bar", True),
            "show_typeform_branding": settings.get("show_typeform_branding", True),
            "language": settings.get("language", "en"),
            "redirect_after_submit_url": settings.get("redirect_after_submit_url"),
            "google_analytics": settings.get("google_analytics"),
            "facebook_pixel": settings.get("facebook_pixel"),
            "meta_title": settings.get("meta", {}).get("title"),
            "meta_description": settings.get("meta", {}).get("description"),
        }
    
    def _transform_theme(self, theme: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Typeform theme"""
        return {
            "primary_color": theme.get("colors", {}).get("question", "#3D3D3D"),
            "background_color": theme.get("colors", {}).get("background", "#FFFFFF"),
            "button_color": theme.get("colors", {}).get("button", "#4FB0AE"),
            "answer_color": theme.get("colors", {}).get("answer", "#4FB0AE"),
            "font_family": theme.get("font", "Arial"),
        }
    
    def _transform_fields_to_pages(self, fields: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Typeform fields to pages with blocks"""
        pages = []
        current_page = None
        
        for field in fields:
            field_type = field.get("type")
            
            # Handle group (creates a new page)
            if field_type == "group":
                if current_page:
                    pages.append(current_page)
                
                current_page = {
                    "id": str(uuid.uuid4()),
                    "title": field.get("title", ""),
                    "blocks": []
                }
                
                # Process fields within group
                for group_field in field.get("properties", {}).get("fields", []):
                    block = self._transform_field_to_block(group_field)
                    if block:
                        current_page["blocks"].append(block)
            else:
                # Regular field
                if current_page is None:
                    current_page = {
                        "id": str(uuid.uuid4()),
                        "title": "",
                        "blocks": []
                    }
                
                block = self._transform_field_to_block(field)
                if block:
                    current_page["blocks"].append(block)
        
        # Add last page
        if current_page and current_page["blocks"]:
            pages.append(current_page)
        
        # If no pages created, create a single page with all blocks
        if not pages and current_page:
            pages = [current_page]
        
        return pages
    
    def _transform_field_to_block(self, field: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Transform a Typeform field to our block format"""
        field_type = field.get("type")
        field_id = field.get("id") or field.get("ref") or str(uuid.uuid4())
        
        # Skip groups as they're handled separately
        if field_type == "group":
            return None
        
        # Map field type
        target_type, notes = self.map_field_type(field_type)
        
        # Create field mapping
        self.create_field_mapping(
            source_type=field_type,
            source_id=field_id,
            target_type=target_type,
            target_id=field_id,
            notes=notes
        )
        
        # Build block
        block = {
            "id": field_id,
            "type": target_type,
            "question": field.get("title", ""),
            "description": field.get("properties", {}).get("description"),
            "required": field.get("validations", {}).get("required", False),
        }
        
        # Add type-specific properties
        properties = field.get("properties", {})
        
        # Handle choices
        if target_type in ["single_select", "multi_select", "dropdown"]:
            choices = properties.get("choices", [])
            block["options"] = [choice.get("label") for choice in choices if choice.get("label")]
            
            # Add shuffle option
            if properties.get("randomize"):
                block["shuffle_options"] = True
        
        # Handle scale/rating
        elif target_type in ["scale", "rating", "nps"]:
            block["min"] = properties.get("start_at_one", False) and 1 or 0
            block["max"] = properties.get("steps", 5)
            
            if target_type == "nps":
                block["min"] = 0
                block["max"] = 10
            
            # Labels
            if properties.get("labels"):
                block["min_label"] = properties["labels"].get("left")
                block["max_label"] = properties["labels"].get("right")
                block["center_label"] = properties["labels"].get("center")
        
        # Handle matrix
        elif target_type == "matrix":
            block["rows"] = properties.get("fields", [])
            block["columns"] = properties.get("columns", [])
            self.add_warning(f"Matrix field '{field.get('title')}' may require manual configuration")
        
        # Handle file upload
        elif target_type == "file_upload":
            block["accept"] = properties.get("allow", [])
            block["max_size"] = properties.get("max_size", 10 * 1024 * 1024)  # 10MB default
        
        # Handle payment
        elif target_type == "payment":
            price = properties.get("price", {})
            block["amount"] = price.get("value", 0) / 100  # Convert from cents
            block["currency"] = price.get("currency", "USD")
            self.add_warning(f"Payment field '{field.get('title')}' will need Stripe configuration")
        
        # Handle validation
        validations = field.get("validations", {})
        block["validation"] = []
        
        if validations.get("max_length"):
            block["validation"].append({
                "type": "max",
                "value": validations["max_length"],
                "message": f"Maximum {validations['max_length']} characters"
            })
        
        if validations.get("min_value") is not None:
            block["validation"].append({
                "type": "min",
                "value": validations["min_value"],
                "message": f"Minimum value is {validations['min_value']}"
            })
        
        if validations.get("max_value") is not None:
            block["validation"].append({
                "type": "max",
                "value": validations["max_value"],
                "message": f"Maximum value is {validations['max_value']}"
            })
        
        return block
    
    def _transform_logic(self, logic: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Typeform logic jumps"""
        rules = []
        
        # Transform logic jumps
        for jump in logic.get("jumps", []):
            for condition in jump.get("conditions", []):
                rule = {
                    "id": str(uuid.uuid4()),
                    "condition": self._transform_condition(condition),
                    "action": self._transform_action(jump.get("action", {}))
                }
                rules.append(rule)
                
                # Check if condition is fully supported
                if condition.get("op") not in ["equal", "not_equal", "greater_than", "less_than", "contains"]:
                    self.add_warning(f"Logic condition '{condition.get('op')}' may not be fully supported")
        
        return {"rules": rules}
    
    def _transform_condition(self, condition: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a logic condition"""
        op_mapping = {
            "equal": "equals",
            "not_equal": "not_equals",
            "greater_than": "greater_than",
            "less_than": "less_than",
            "greater_equal": "greater_equal",
            "less_equal": "less_equal",
            "contains": "contains",
            "not_contains": "not_contains",
            "begins_with": "starts_with",
            "ends_with": "ends_with",
            "is": "equals",
            "is_not": "not_equals",
        }
        
        return {
            "field": condition.get("field"),
            "operator": op_mapping.get(condition.get("op"), "equals"),
            "value": condition.get("value")
        }
    
    def _transform_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a logic action"""
        action_type = action.get("action")
        
        if action_type == "jump":
            return {
                "type": "jump_to",
                "target": action.get("details", {}).get("to", {}).get("value")
            }
        elif action_type == "add":
            return {
                "type": "add_score",
                "value": action.get("details", {}).get("value", 0)
            }
        else:
            self.add_warning(f"Logic action '{action_type}' is not supported")
            return {
                "type": "continue"
            }