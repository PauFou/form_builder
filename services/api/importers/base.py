from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class ImportStatus(Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


@dataclass
class ImportResult:
    """Result of a form import"""
    status: ImportStatus
    form_data: Optional[Dict[str, Any]]
    warnings: List[str]
    errors: List[str]
    mapping_report: Dict[str, Any]
    
    @property
    def success(self) -> bool:
        return self.status != ImportStatus.FAILED


@dataclass
class FieldMapping:
    """Mapping from source field to target field"""
    source_type: str
    target_type: str
    source_id: str
    target_id: str
    conversion_notes: Optional[str] = None
    data_transformer: Optional[str] = None


class BaseImporter(ABC):
    """Base class for form importers"""
    
    # Mapping of source field types to our field types
    FIELD_TYPE_MAPPING: Dict[str, str] = {}
    
    def __init__(self):
        self.warnings: List[str] = []
        self.errors: List[str] = []
        self.field_mappings: List[FieldMapping] = []
    
    @abstractmethod
    def fetch_form_data(self, source: str, credentials: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fetch form data from the source"""
        pass
    
    @abstractmethod
    def transform_to_internal_format(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform source data to our internal format"""
        pass
    
    def import_form(self, source: str, credentials: Optional[Dict[str, Any]] = None) -> ImportResult:
        """Main import method"""
        try:
            # Fetch data from source
            source_data = self.fetch_form_data(source, credentials)
            
            # Transform to internal format
            form_data = self.transform_to_internal_format(source_data)
            
            # Generate mapping report
            mapping_report = self.generate_mapping_report()
            
            # Determine status
            if self.errors:
                status = ImportStatus.FAILED
            elif self.warnings:
                status = ImportStatus.PARTIAL
            else:
                status = ImportStatus.SUCCESS
            
            return ImportResult(
                status=status,
                form_data=form_data,
                warnings=self.warnings,
                errors=self.errors,
                mapping_report=mapping_report
            )
            
        except Exception as e:
            self.errors.append(f"Import failed: {str(e)}")
            return ImportResult(
                status=ImportStatus.FAILED,
                form_data=None,
                warnings=self.warnings,
                errors=self.errors,
                mapping_report={}
            )
    
    def map_field_type(self, source_type: str) -> Tuple[str, Optional[str]]:
        """Map source field type to our field type"""
        if source_type in self.FIELD_TYPE_MAPPING:
            return self.FIELD_TYPE_MAPPING[source_type], None
        
        # Try to find a close match
        suggested_type = self.suggest_field_type(source_type)
        if suggested_type:
            note = f"Auto-mapped {source_type} to {suggested_type}"
            self.warnings.append(note)
            return suggested_type, note
        
        # Default to text field
        self.warnings.append(f"Unknown field type '{source_type}', defaulting to text field")
        return "text", f"Unknown type {source_type}"
    
    def suggest_field_type(self, source_type: str) -> Optional[str]:
        """Suggest a field type based on source type name"""
        source_lower = source_type.lower()
        
        # Common patterns
        if any(term in source_lower for term in ["email", "mail"]):
            return "email"
        elif any(term in source_lower for term in ["phone", "tel", "mobile"]):
            return "phone"
        elif any(term in source_lower for term in ["number", "numeric", "int", "float"]):
            return "number"
        elif any(term in source_lower for term in ["date", "time", "datetime"]):
            return "date"
        elif any(term in source_lower for term in ["url", "link", "website"]):
            return "text"
        elif any(term in source_lower for term in ["paragraph", "textarea", "long"]):
            return "long_text"
        elif any(term in source_lower for term in ["select", "choice", "option"]):
            return "single_select"
        elif any(term in source_lower for term in ["multiselect", "checkbox", "multiple"]):
            return "multi_select"
        elif any(term in source_lower for term in ["radio"]):
            return "single_select"
        elif any(term in source_lower for term in ["dropdown", "list"]):
            return "dropdown"
        elif any(term in source_lower for term in ["rating", "star"]):
            return "rating"
        elif any(term in source_lower for term in ["scale", "slider"]):
            return "scale"
        elif any(term in source_lower for term in ["file", "upload", "attachment"]):
            return "file_upload"
        elif any(term in source_lower for term in ["payment", "price", "amount"]):
            return "payment"
        elif any(term in source_lower for term in ["signature", "sign"]):
            return "signature"
        
        return None
    
    def generate_mapping_report(self) -> Dict[str, Any]:
        """Generate a report of field mappings"""
        return {
            "total_fields": len(self.field_mappings),
            "successful_mappings": len([m for m in self.field_mappings if not m.conversion_notes]),
            "mappings_with_notes": len([m for m in self.field_mappings if m.conversion_notes]),
            "field_mappings": [
                {
                    "source": {
                        "type": m.source_type,
                        "id": m.source_id
                    },
                    "target": {
                        "type": m.target_type,
                        "id": m.target_id
                    },
                    "notes": m.conversion_notes
                }
                for m in self.field_mappings
            ],
            "warnings": self.warnings,
            "errors": self.errors
        }
    
    def add_warning(self, message: str):
        """Add a warning message"""
        self.warnings.append(message)
    
    def add_error(self, message: str):
        """Add an error message"""
        self.errors.append(message)
    
    def create_field_mapping(self, source_type: str, source_id: str, 
                           target_type: str, target_id: str, 
                           notes: Optional[str] = None):
        """Create and store a field mapping"""
        mapping = FieldMapping(
            source_type=source_type,
            target_type=target_type,
            source_id=source_id,
            target_id=target_id,
            conversion_notes=notes
        )
        self.field_mappings.append(mapping)
        return mapping