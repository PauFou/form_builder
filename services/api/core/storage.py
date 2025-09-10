"""
Local storage backend for VPS deployment
Replaces S3 for file uploads and GDPR exports
"""
import os
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.crypto import get_random_string
from django.urls import reverse


class SecureLocalStorage(FileSystemStorage):
    """
    Secure local storage with signed URLs and expiration
    """
    
    def __init__(self, location=None, base_url=None):
        location = location or settings.SECURE_STORAGE_ROOT
        base_url = base_url or settings.SECURE_STORAGE_URL
        super().__init__(location=location, base_url=base_url)
    
    def get_available_name(self, name, max_length=None):
        """
        Generate a unique filename using UUID
        """
        ext = os.path.splitext(name)[1]
        filename = f"{uuid.uuid4()}{ext}"
        return super().get_available_name(filename, max_length)
    
    def _save(self, name, content):
        """
        Save file with proper permissions
        """
        full_path = super()._save(name, content)
        
        # Set restrictive permissions (owner read/write only)
        if os.path.exists(full_path):
            os.chmod(full_path, 0o600)
        
        return full_path
    
    def generate_signed_url(self, name: str, expires_in: int = 3600) -> str:
        """
        Generate a signed URL for temporary access
        
        Args:
            name: File name/path
            expires_in: Expiration time in seconds
            
        Returns:
            Signed URL string
        """
        expiry = int((datetime.utcnow() + timedelta(seconds=expires_in)).timestamp())
        
        # Create signature
        secret = settings.SECRET_KEY
        message = f"{name}:{expiry}"
        signature = hashlib.sha256(f"{secret}:{message}".encode()).hexdigest()
        
        # Build URL
        base_url = settings.SITE_URL.rstrip('/')
        return f"{base_url}/api/v1/storage/download/?file={name}&expires={expiry}&signature={signature}"
    
    def verify_signed_url(self, name: str, expires: str, signature: str) -> bool:
        """
        Verify a signed URL is valid
        """
        try:
            expiry = int(expires)
            
            # Check if expired
            if expiry < datetime.utcnow().timestamp():
                return False
            
            # Verify signature
            secret = settings.SECRET_KEY
            message = f"{name}:{expiry}"
            expected_signature = hashlib.sha256(f"{secret}:{message}".encode()).hexdigest()
            
            return signature == expected_signature
        except (ValueError, TypeError):
            return False
    
    def cleanup_expired_files(self, directory: str, days: int = 7):
        """
        Remove files older than specified days
        """
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        
        for root, dirs, files in os.walk(os.path.join(self.location, directory)):
            for file in files:
                file_path = os.path.join(root, file)
                file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                if file_time < cutoff_time:
                    try:
                        os.remove(file_path)
                    except OSError:
                        pass


class FormUploadStorage(SecureLocalStorage):
    """Storage for form file uploads"""
    
    def __init__(self):
        location = os.path.join(settings.MEDIA_ROOT, 'uploads')
        super().__init__(location=location)
        
        # Ensure directory exists
        os.makedirs(location, exist_ok=True)
    
    def get_upload_path(self, form_id: str, submission_id: str) -> str:
        """Get organized upload path"""
        date_path = datetime.utcnow().strftime("%Y/%m/%d")
        return f"forms/{form_id}/{date_path}/{submission_id}"


class GDPRExportStorage(SecureLocalStorage):
    """Storage for GDPR data exports"""
    
    def __init__(self):
        location = os.path.join(settings.SECURE_STORAGE_ROOT, 'gdpr-exports')
        super().__init__(location=location)
        
        # Ensure directory exists with restricted permissions
        os.makedirs(location, mode=0o700, exist_ok=True)
    
    def save_export(self, organization_id: str, export_data: bytes, export_format: str = 'json') -> Tuple[str, str]:
        """
        Save GDPR export file
        
        Returns:
            Tuple of (file_path, signed_url)
        """
        filename = f"gdpr-export-{organization_id}-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.{export_format}"
        path = f"{organization_id}/{filename}"
        
        # Save file
        from django.core.files.base import ContentFile
        saved_path = self.save(path, ContentFile(export_data))
        
        # Generate 7-day expiring URL
        signed_url = self.generate_signed_url(saved_path, expires_in=7 * 24 * 3600)
        
        return saved_path, signed_url


# Singleton instances
form_upload_storage = FormUploadStorage()
gdpr_export_storage = GDPRExportStorage()