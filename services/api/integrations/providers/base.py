from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class BaseProvider(ABC):
    """Base class for integration providers"""
    
    @abstractmethod
    def test_connection(self, integration, sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test if the integration is properly configured"""
        pass
    
    @abstractmethod
    def send_data(self, integration, data: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to the integration"""
        pass
    
    def get_available_fields(self, integration) -> List[Dict[str, Any]]:
        """Get list of available fields in the integration"""
        return []
    
    def get_oauth_url(self, integration) -> str:
        """Get OAuth authorization URL"""
        raise NotImplementedError("OAuth not supported for this provider")
    
    def exchange_oauth_code(self, integration, code: str, state: str) -> Dict[str, Any]:
        """Exchange OAuth code for tokens"""
        raise NotImplementedError("OAuth not supported for this provider")
    
    def refresh_oauth_token(self, integration) -> Dict[str, Any]:
        """Refresh OAuth access token"""
        raise NotImplementedError("OAuth not supported for this provider")
    
    def sync_metadata(self, integration):
        """Sync integration metadata (available options, etc.)"""
        pass
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate integration configuration"""
        return True