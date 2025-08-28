"""
Pydantic models for simplified LLM proxy API
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime


class ChatRequest(BaseModel):
    """Simple chat request model"""
    message: str = Field(..., min_length=1, max_length=10000, description="User message")
    system_prompt: Optional[str] = Field(None, max_length=2000, description="Optional system prompt")
    
    @validator('message')
    def validate_message(cls, v):
        """Validate message content"""
        if not v.strip():
            raise ValueError("Message cannot be empty or only whitespace")
        return v.strip()


class ChatResponse(BaseModel):
    """Simple chat response model"""
    response: str = Field(..., description="AI response text")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")


class ErrorResponse(BaseModel):
    """Error response model"""
    detail: str = Field(..., description="Error message")
    type: Optional[str] = Field(None, description="Error type")


class HealthResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "unhealthy"] = Field(..., description="Service health status")
    timestamp: str = Field(..., description="Check timestamp")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    python_version: str = Field(..., description="Python version")
    platform: str = Field(..., description="Platform information")
