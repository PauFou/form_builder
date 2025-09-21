import requests
from typing import Dict, Any, List, Optional
import uuid
from urllib.parse import urlparse
import re
import json

from .base import BaseImporter


class TallyImporter(BaseImporter):
    """Import forms from Tally"""
    
    API_BASE = "https://api.tally.so/v1"
    
    # Tally field type mappings
    FIELD_TYPE_MAPPING = {
        "INPUT_TEXT": "text",
        "INPUT_EMAIL": "email",
        "INPUT_NUMBER": "number",
        "INPUT_PHONE_NUMBER": "phone",
        "INPUT_LINK": "url",
        "TEXTAREA": "long_text",
        "INPUT_DATE": "date",
        "INPUT_TIME": "time",
        "DROPDOWN": "dropdown",
        "MULTIPLE_CHOICE": "single_select",
        "CHECKBOXES": "multi_select",
        "LINEAR_SCALE": "scale",
        "RATING": "rating",
        "NPS": "nps",
        "FILE_UPLOAD": "file_upload",
        "PAYMENT": "payment",
        "SIGNATURE": "signature",
        "MATRIX": "matrix",
        "RANKING": "ranking",
        "CALCULATED_FIELDS": "number",
        "HIDDEN_FIELDS": "text"
    }
    
    def fetch_form_data(self, source: str, credentials: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fetch form data from Tally API"""
        # Extract form ID from URL or use as-is
        form_id = self._extract_form_id(source)
        
        if not credentials or not credentials.get("api_key"):
            raise ValueError("Tally API key is required")
        
        # Fetch form definition
        headers = {
            "Authorization": f"Bearer {credentials['api_key']}",
            "Content-Type": "application/json"
        }
        
        # First, get form details
        response = requests.get(
            f"{self.API_BASE}/forms/{form_id}",
            headers=headers
        )
        
        if response.status_code == 404:
            raise ValueError(f"Form not found: {form_id}")
        elif response.status_code == 401:
            raise ValueError("Invalid API key")
        elif response.status_code != 200:
            raise ValueError(f"Failed to fetch form: {response.text}")
        
        form_data = response.json()
        
        # Get form fields
        fields_response = requests.get(
            f"{self.API_BASE}/forms/{form_id}/fields",
            headers=headers
        )
        
        if fields_response.status_code == 200:
            form_data['fields'] = fields_response.json().get('data', [])
        
        return form_data
    
    def transform_to_internal_format(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Tally data to our internal format"""
        form_data = {
            "title": source_data.get("name", "Imported Tally Form"),
            "description": source_data.get("description", ""),
            "settings": self._transform_settings(source_data),
            "theme": self._transform_theme(source_data.get("customization", {})),
            "pages": self._transform_fields_to_pages(source_data.get("fields", [])),
            "logic": self._transform_logic(source_data.get("logic", [])),
            "metadata": {
                "imported_from": "tally",
                "original_id": source_data.get("id"),
                "original_url": source_data.get("url", "")
            }
        }
        
        return form_data
    
    def _extract_form_id(self, source: str) -> str:
        """Extract form ID from Tally URL"""
        # Handle direct ID
        if not source.startswith("http"):
            return source
        
        # Parse URL
        parsed = urlparse(source)
        
        # Tally URLs:
        # - https://tally.so/r/ABC123
        # - https://tally.so/embed/ABC123
        # - https://ABC123.tally.so
        
        # Check subdomain
        if parsed.hostname and parsed.hostname.endswith('.tally.so'):
            form_id = parsed.hostname.split('.')[0]
            if form_id and form_id != 'tally':
                return form_id
        
        # Check path
        path_match = re.search(r'/(?:r|embed)/([a-zA-Z0-9]+)', parsed.path)
        if path_match:
            return path_match.group(1)
        
        raise ValueError(f"Could not extract form ID from URL: {source}")
    
    def _transform_settings(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Tally settings"""
        settings = source_data.get("settings", {})
        return {
            "show_progress_bar": settings.get("showProgressBar", True),
            "progress_bar_position": settings.get("progressBarPosition", "top"),
            "language": settings.get("language", "en"),
            "redirect_after_submit_url": settings.get("redirectUrl"),
            "close_on_submit": settings.get("closeOnSubmit", False),
            "show_response_summary": settings.get("showResponseSummary", True),
            "google_analytics_id": settings.get("googleAnalyticsId"),
            "facebook_pixel_id": settings.get("facebookPixelId"),
            "notifications": {
                "email": settings.get("notificationEmail"),
                "slack_webhook": settings.get("slackWebhook")
            },
            "submission_limit": settings.get("responseLimit"),
            "close_date": settings.get("closeDate"),
            "password_protection": settings.get("password") is not None,
            "recaptcha_enabled": settings.get("recaptchaEnabled", False)
        }
    
    def _transform_theme(self, customization: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Tally theme customization"""
        return {
            "primary_color": customization.get("primaryColor", "#000000"),
            "background_color": customization.get("backgroundColor", "#FFFFFF"),
            "text_color": customization.get("textColor", "#000000"),
            "button_color": customization.get("buttonColor", "#000000"),
            "button_text_color": customization.get("buttonTextColor", "#FFFFFF"),
            "font_family": customization.get("fontFamily", "Inter"),
            "font_size": customization.get("fontSize", "16px"),
            "corner_radius": customization.get("borderRadius", "8px"),
            "custom_css": customization.get("customCss", ""),
            "logo_url": customization.get("logoUrl"),
            "cover_image_url": customization.get("coverImageUrl"),
            "favicon_url": customization.get("faviconUrl")
        }
    
    def _transform_fields_to_pages(self, fields: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform Tally fields to pages with blocks"""
        pages = []
        current_page = None
        page_counter = 1
        
        for field in fields:
            field_type = field.get("type")
            
            # Page breaks create new pages
            if field_type == "PAGE_BREAK":
                if current_page and current_page["blocks"]:
                    pages.append(current_page)
                
                current_page = {
                    "id": str(uuid.uuid4()),
                    "title": field.get("label", f"Page {page_counter}"),
                    "description": field.get("description", ""),
                    "blocks": []
                }
                page_counter += 1
            else:
                # Regular field
                if current_page is None:
                    current_page = {
                        "id": str(uuid.uuid4()),
                        "title": "Page 1",
                        "blocks": []
                    }
                
                block = self._transform_field_to_block(field)
                if block:
                    current_page["blocks"].append(block)
        
        # Add last page
        if current_page and current_page["blocks"]:
            pages.append(current_page)
        
        # Ensure at least one page exists
        if not pages:
            pages = [{
                "id": str(uuid.uuid4()),
                "title": "Page 1",
                "blocks": []
            }]
        
        return pages
    
    def _transform_field_to_block(self, field: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Transform a Tally field to our block format"""
        field_type = field.get("type")
        field_id = field.get("id", str(uuid.uuid4()))
        
        # Skip page breaks and sections
        if field_type in ["PAGE_BREAK", "SECTION"]:
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
            "question": field.get("label", ""),
            "description": field.get("description", ""),
            "placeholder": field.get("placeholder", ""),
            "required": field.get("required", False),
            "hidden": field.get("hidden", False)
        }
        
        # Add type-specific properties
        options = field.get("options", {})
        
        # Handle choices
        if target_type in ["single_select", "multi_select", "dropdown"]:
            choices = options.get("choices", [])
            block["options"] = [
                choice.get("text", "") for choice in choices 
                if choice.get("text")
            ]
            
            # Handle other option
            if options.get("hasOtherOption"):
                block["allow_other"] = True
                block["other_label"] = "Other"
            
            # Randomize options
            if options.get("randomize"):
                block["shuffle_options"] = True
        
        # Handle scale/rating/NPS
        elif target_type in ["scale", "rating", "nps"]:
            if target_type == "nps":
                block["min"] = 0
                block["max"] = 10
                block["min_label"] = "Not likely"
                block["max_label"] = "Very likely"
            else:
                block["min"] = options.get("minValue", 1)
                block["max"] = options.get("maxValue", 5)
                block["min_label"] = options.get("minLabel", "")
                block["max_label"] = options.get("maxLabel", "")
                
                # Rating specific
                if target_type == "rating" and options.get("icon"):
                    block["icon"] = options["icon"]  # star, heart, etc.
        
        # Handle matrix
        elif target_type == "matrix":
            block["rows"] = [
                {"id": str(uuid.uuid4()), "label": row}
                for row in options.get("rows", [])
            ]
            block["columns"] = [
                {"id": str(uuid.uuid4()), "label": col}
                for col in options.get("columns", [])
            ]
            block["multiple_selection"] = options.get("multipleSelection", False)
            
            self.add_warning(f"Matrix field '{field.get('label')}' imported - please verify configuration")
        
        # Handle file upload
        elif target_type == "file_upload":
            block["accept"] = options.get("allowedFileTypes", [])
            block["max_size"] = options.get("maxFileSize", 10) * 1024 * 1024  # Convert MB to bytes
            block["max_files"] = options.get("maxFiles", 1)
            block["multiple"] = options.get("multiple", False)
        
        # Handle payment
        elif target_type == "payment":
            payment = options.get("payment", {})
            block["amount"] = payment.get("amount", 0)
            block["currency"] = payment.get("currency", "USD")
            block["payment_type"] = payment.get("type", "one_time")  # one_time, subscription
            
            # Products/items for payment
            if payment.get("products"):
                block["products"] = [
                    {
                        "id": p.get("id"),
                        "name": p.get("name"),
                        "price": p.get("price"),
                        "description": p.get("description", "")
                    }
                    for p in payment["products"]
                ]
            
            self.add_warning(f"Payment field '{field.get('label')}' imported - Stripe configuration required")
        
        # Handle signature
        elif target_type == "signature":
            block["width"] = options.get("width", 400)
            block["height"] = options.get("height", 200)
            block["background_color"] = options.get("backgroundColor", "#FFFFFF")
            block["pen_color"] = options.get("penColor", "#000000")
        
        # Handle calculated fields
        elif field_type == "CALCULATED_FIELDS":
            block["formula"] = options.get("formula", "")
            block["decimal_places"] = options.get("decimalPlaces", 2)
            self.add_warning(f"Calculated field '{field.get('label')}' imported - verify formula syntax")
        
        # Handle validation
        validation = field.get("validation", {})
        block["validation"] = []
        
        # Text validation
        if validation.get("minLength"):
            block["validation"].append({
                "type": "min_length",
                "value": validation["minLength"],
                "message": validation.get("minLengthError", f"Minimum {validation['minLength']} characters")
            })
        
        if validation.get("maxLength"):
            block["validation"].append({
                "type": "max_length",
                "value": validation["maxLength"],
                "message": validation.get("maxLengthError", f"Maximum {validation['maxLength']} characters")
            })
        
        # Number validation
        if validation.get("min") is not None:
            block["validation"].append({
                "type": "min",
                "value": validation["min"],
                "message": validation.get("minError", f"Minimum value is {validation['min']}")
            })
        
        if validation.get("max") is not None:
            block["validation"].append({
                "type": "max", 
                "value": validation["max"],
                "message": validation.get("maxError", f"Maximum value is {validation['max']}")
            })
        
        # Pattern validation
        if validation.get("pattern"):
            block["validation"].append({
                "type": "pattern",
                "value": validation["pattern"],
                "message": validation.get("patternError", "Invalid format")
            })
        
        # Custom error messages
        if validation.get("customError"):
            block["error_message"] = validation["customError"]
        
        return block
    
    def _transform_logic(self, logic_rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Transform Tally conditional logic"""
        rules = []
        
        for tally_rule in logic_rules:
            # Each Tally rule can have multiple conditions (AND/OR)
            conditions = []
            for condition in tally_rule.get("conditions", []):
                conditions.append(self._transform_condition(condition))
            
            # Transform actions
            for action in tally_rule.get("actions", []):
                rule = {
                    "id": str(uuid.uuid4()),
                    "conditions": conditions,
                    "condition_operator": tally_rule.get("operator", "AND"),  # AND/OR
                    "action": self._transform_action(action)
                }
                rules.append(rule)
                
            # Check if all conditions are supported
            unsupported = [c for c in conditions if c.get("operator") == "unsupported"]
            if unsupported:
                self.add_warning(f"Some logic conditions may not be fully supported")
        
        return {"rules": rules}
    
    def _transform_condition(self, condition: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a logic condition"""
        operator_mapping = {
            "EQUALS": "equals",
            "NOT_EQUALS": "not_equals",
            "CONTAINS": "contains",
            "NOT_CONTAINS": "not_contains",
            "GREATER_THAN": "greater_than",
            "LESS_THAN": "less_than",
            "GREATER_THAN_OR_EQUAL": "greater_equal",
            "LESS_THAN_OR_EQUAL": "less_equal",
            "IS_EMPTY": "is_empty",
            "IS_NOT_EMPTY": "is_not_empty",
            "STARTS_WITH": "starts_with",
            "ENDS_WITH": "ends_with",
            "IS_BEFORE": "date_before",
            "IS_AFTER": "date_after"
        }
        
        return {
            "field": condition.get("fieldId"),
            "operator": operator_mapping.get(condition.get("operator"), "unsupported"),
            "value": condition.get("value")
        }
    
    def _transform_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Transform a logic action"""
        action_type = action.get("type")
        
        if action_type == "SHOW_FIELD":
            return {
                "type": "show_field",
                "target": action.get("fieldId")
            }
        elif action_type == "HIDE_FIELD":
            return {
                "type": "hide_field",
                "target": action.get("fieldId")
            }
        elif action_type == "JUMP_TO_PAGE":
            return {
                "type": "jump_to_page",
                "target": action.get("pageId")
            }
        elif action_type == "SKIP_TO_END":
            return {
                "type": "submit_form"
            }
        elif action_type == "CALCULATE":
            return {
                "type": "calculate",
                "formula": action.get("formula"),
                "target": action.get("fieldId")
            }
        elif action_type == "REDIRECT":
            return {
                "type": "redirect",
                "url": action.get("url")
            }
        else:
            self.add_warning(f"Logic action '{action_type}' is not fully supported")
            return {
                "type": "continue"
            }
    
    def generate_parity_report(self) -> Dict[str, Any]:
        """Generate detailed parity report for Tally import"""
        report = super().generate_parity_report()
        
        # Add Tally-specific details
        report["platform_specific"] = {
            "tally": {
                "features_preserved": [
                    "All basic field types",
                    "Field validation rules", 
                    "Required fields",
                    "Conditional logic (most cases)",
                    "Page structure",
                    "Basic theme customization",
                    "Payment fields (requires Stripe setup)",
                    "File uploads",
                    "Signature fields",
                    "Matrix questions",
                    "NPS surveys"
                ],
                "features_requiring_adjustment": [
                    "Calculated fields (formula syntax may differ)",
                    "Complex conditional logic with multiple operators",
                    "Custom CSS (needs manual migration)",
                    "Integrations (need reconfiguration)",
                    "Webhooks (need new endpoints)",
                    "Response limits and scheduling"
                ],
                "features_not_supported": [
                    "Tally's built-in analytics (use our analytics instead)",
                    "Partial submissions from Tally",
                    "Team collaboration history",
                    "Form templates library access"
                ]
            }
        }
        
        return report