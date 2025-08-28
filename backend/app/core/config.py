"""
Core configuration for the simplified FastAPI LLM proxy server
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    app_name: str = "ChatBot9000 LLM Proxy"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False
    
    # CORS Configuration
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    allowed_methods: list[str] = ["GET", "POST", "PUT", "DELETE"]
    allowed_headers: list[str] = ["*"]
    
    # Google AI Configuration
    google_api_key: Optional[str] = None
    gemini_model: str = "gemini-1.5-flash"
    
    # Database Configuration (for future use)
    database_url: Optional[str] = None
    
    # Redis Configuration (for future use)
    redis_url: str = "redis://localhost:6379/0"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "{time} | {level} | {message}"
    
    # LLM Configuration
    max_conversation_length: int = 100
    max_message_length: int = 10000
    rate_limit_requests: int = 60  # requests per minute
    rate_limit_window: int = 60    # seconds
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Environment-specific configurations
def get_google_api_key() -> str:
    """Get Google API key from environment"""
    api_key = os.getenv("GOOGLE_API_KEY") or get_settings().google_api_key
    if not api_key:
        raise ValueError(
            "Google API key not found. Set GOOGLE_API_KEY environment variable "
            "or configure google_api_key in settings."
        )
    return api_key


# Constants
class LLMConstants:
    """LLM-specific constants"""
    
    # API Endpoints
    CHAT_ENDPOINT = "/api/v1/chat"
    CONVERSATIONS_ENDPOINT = "/api/v1/conversations"
    HEALTH_ENDPOINT = "/health"
    
    # Response Status Codes
    SUCCESS = 200
    CREATED = 201
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    NOT_FOUND = 404
    INTERNAL_ERROR = 500
    
    # Message Types
    USER_MESSAGE = "user"
    ASSISTANT_MESSAGE = "assistant"
    SYSTEM_MESSAGE = "system"
    
    # Default Values
    DEFAULT_CONVERSATION_TITLE = "New Chat"
    DEFAULT_SYSTEM_PROMPT = """You are a helpful AI assistant designed to automate developer workflows. 
You can help with coding, debugging, documentation, project planning, and other development tasks. 
Keep responses practical and actionable."""
