from typing import Dict, Any, Optional
import logging
from django.db import transaction

from .typeform import TypeformImporter
from .google_forms import GoogleFormsImporter
from .base import ImportResult, ImportStatus
from forms.models import Form
from forms.serializers import FormSerializer

logger = logging.getLogger(__name__)


class ImportService:
    """Service for importing forms from external sources"""
    
    IMPORTERS = {
        'typeform': TypeformImporter,
        'google_forms': GoogleFormsImporter,
    }
    
    def get_importer(self, source_type: str):
        """Get importer for the specified source type"""
        importer_class = self.IMPORTERS.get(source_type)
        if not importer_class:
            raise ValueError(f"Unsupported import source: {source_type}")
        return importer_class()
    
    def import_form(self, source_type: str, source: str, 
                   credentials: Optional[Dict[str, Any]] = None,
                   organization=None, user=None) -> Dict[str, Any]:
        """Import a form from an external source"""
        
        # Get importer
        importer = self.get_importer(source_type)
        
        # Perform import
        result = importer.import_form(source, credentials)
        
        # Check if import was successful
        if not result.success:
            return {
                'success': False,
                'errors': result.errors,
                'warnings': result.warnings,
                'mapping_report': result.mapping_report
            }
        
        # Create form in database
        form = None
        if result.form_data and organization:
            try:
                with transaction.atomic():
                    # Add organization and user info
                    result.form_data['organization'] = organization.id
                    if user:
                        result.form_data['created_by'] = user.id
                    
                    # Create form
                    serializer = FormSerializer(data=result.form_data)
                    if serializer.is_valid():
                        form = serializer.save()
                        logger.info(f"Successfully imported form {form.id} from {source_type}")
                    else:
                        result.errors.extend([
                            f"{field}: {'; '.join(errors)}" 
                            for field, errors in serializer.errors.items()
                        ])
                        result.status = ImportStatus.FAILED
            except Exception as e:
                logger.error(f"Failed to create form from import: {str(e)}")
                result.errors.append(f"Failed to create form: {str(e)}")
                result.status = ImportStatus.FAILED
        
        # Return result
        return {
            'success': result.status != ImportStatus.FAILED,
            'form_id': str(form.id) if form else None,
            'status': result.status.value,
            'errors': result.errors,
            'warnings': result.warnings,
            'mapping_report': result.mapping_report,
            'form_data': result.form_data if not form else None
        }
    
    def validate_source(self, source_type: str, source: str) -> Dict[str, Any]:
        """Validate import source without performing import"""
        importer = self.get_importer(source_type)
        
        try:
            if source_type == 'typeform':
                form_id = importer._extract_form_id(source)
                return {
                    'valid': True,
                    'form_id': form_id,
                    'message': f'Valid Typeform ID: {form_id}'
                }
            elif source_type == 'google_forms':
                form_id = importer._extract_form_id(source)
                return {
                    'valid': True,
                    'form_id': form_id,
                    'message': f'Valid Google Forms ID: {form_id}'
                }
        except ValueError as e:
            return {
                'valid': False,
                'error': str(e)
            }
        
        return {
            'valid': True,
            'message': 'Source appears to be valid'
        }
    
    def get_import_requirements(self, source_type: str) -> Dict[str, Any]:
        """Get requirements for importing from a specific source"""
        requirements = {
            'typeform': {
                'credentials_required': True,
                'credential_fields': [
                    {
                        'name': 'access_token',
                        'label': 'Typeform Access Token',
                        'type': 'password',
                        'required': True,
                        'help_text': 'Get your personal access token from Typeform account settings'
                    }
                ],
                'supported_features': [
                    'All question types',
                    'Logic jumps',
                    'Design customization',
                    'Validation rules',
                    'Hidden fields'
                ],
                'limitations': [
                    'Webhooks need to be reconfigured',
                    'Response data is not imported',
                    'Integrations need to be reconfigured',
                    'Custom thank you screens may need adjustment'
                ]
            },
            'google_forms': {
                'credentials_required': True,
                'credential_fields': [],  # OAuth handled separately
                'oauth_required': True,
                'supported_features': [
                    'Basic question types',
                    'Required fields',
                    'Multiple sections',
                    'File uploads',
                    'Response validation (limited)'
                ],
                'limitations': [
                    'Logic and branching not available via API',
                    'Advanced validation rules not exposed',
                    'Quiz scoring not imported',
                    'Collaborator permissions not imported',
                    'Response data is not imported'
                ]
            }
        }
        
        return requirements.get(source_type, {})
    
    def preview_import(self, source_type: str, source: str, 
                      credentials: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Preview what will be imported without creating the form"""
        
        # Get importer
        importer = self.get_importer(source_type)
        
        try:
            # Fetch form data
            source_data = importer.fetch_form_data(source, credentials)
            
            # Transform to internal format
            form_data = importer.transform_to_internal_format(source_data)
            
            # Generate preview
            preview = {
                'title': form_data.get('title'),
                'description': form_data.get('description'),
                'page_count': len(form_data.get('pages', [])),
                'field_count': sum(len(page.get('blocks', [])) for page in form_data.get('pages', [])),
                'has_logic': bool(form_data.get('logic', {}).get('rules')),
                'field_types': {},
                'warnings': importer.warnings,
                'mapping_report': importer.generate_mapping_report()
            }
            
            # Count field types
            for page in form_data.get('pages', []):
                for block in page.get('blocks', []):
                    field_type = block.get('type')
                    preview['field_types'][field_type] = preview['field_types'].get(field_type, 0) + 1
            
            return {
                'success': True,
                'preview': preview
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }