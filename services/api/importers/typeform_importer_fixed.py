"""
Simplified Typeform importer without deprecated FormPage/FormBlock references
"""

from typing import Dict, Any
from forms.models import Form


class TypeformImporter:
    """Simplified Typeform importer compatible with JSON-based forms"""
    
    def __init__(self):
        self.import_report = {
            "total_questions": 0,
            "imported": 0,
            "unsupported": [],
            "warnings": []
        }
    
    def import_form(self, typeform_data: Dict[str, Any], organization_id: str) -> tuple[Form, Dict[str, Any]]:
        """Import a Typeform JSON export"""
        
        # Create basic form
        form_data = {
            "title": typeform_data.get("title", "Imported Form"),
            "description": typeform_data.get("description", ""),
            "pages": [
                {
                    "id": "page_1",
                    "title": "Page 1", 
                    "blocks": []
                }
            ]
        }
        
        # Create form (this would need proper organization setup in real usage)
        form = Form.objects.create(
            title=form_data["title"],
            description=form_data["description"],
            pages=form_data["pages"]
        )
        
        return form, self.import_report