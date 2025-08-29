"""
Core utilities and helpers for the LLM proxy server
"""
from typing import Any, Dict, Optional
from datetime import datetime, timezone
from loguru import logger


def utc_now() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)


class ResponseFormatter:
    """Standard response formatter for API endpoints"""
    
    @staticmethod
    def success(data: Any, message: str = "Success") -> Dict[str, Any]:
        """Format successful response"""
        return {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": utc_now().isoformat(),
        }
    
    @staticmethod
    def error(message: str, error_code: Optional[str] = None, details: Optional[Dict] = None) -> Dict[str, Any]:
        """Format error response"""
        response = {
            "success": False,
            "message": message,
            "timestamp": utc_now().isoformat(),
        }
        
        if error_code:
            response["error_code"] = error_code
        
        if details:
            response["details"] = details
            
        return response


class AppError(Exception):
    """Base exception for application-related errors"""
    
    def __init__(self, message: str, error_code: Optional[str] = None, status_code: int = 500):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(message)


class ValidationError(AppError):
    """Validation error"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(message, "VALIDATION_ERROR", 400)
        self.field = field


class LLMError(AppError):
    """LLM service error"""
    
    def __init__(self, message: str, provider: str = "gemini"):
        super().__init__(message, f"LLM_ERROR_{provider.upper()}", 500)
        self.provider = provider
