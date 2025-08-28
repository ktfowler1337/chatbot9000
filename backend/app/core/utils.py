"""
Core utilities and helpers for the LLM proxy server
"""
import logging
import time
import hashlib
from typing import Any, Dict, Optional
from datetime import datetime, timezone
from loguru import logger


def setup_logging(log_level: str = "INFO") -> None:
    """Configure logging for the application"""
    logger.remove()  # Remove default handler
    logger.add(
        "logs/llm_proxy.log",
        rotation="1 day",
        retention="30 days",
        level=log_level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        backtrace=True,
        diagnose=True,
    )
    logger.add(
        lambda msg: print(msg, end=""),
        level=log_level,
        format="{time:HH:mm:ss} | {level} | {message}",
        colorize=True,
    )


def generate_correlation_id() -> str:
    """Generate a unique correlation ID for request tracking"""
    timestamp = str(time.time())
    return hashlib.md5(timestamp.encode()).hexdigest()[:8]


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


class RateLimitError(AppError):
    """Rate limiting error"""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, "RATE_LIMIT_EXCEEDED", 429)
