"""
Simplified chat API endpoints for stateless LLM proxy
"""
import time
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..services.llm_service import llm_service
from ..core.utils import ResponseFormatter, ValidationError, LLMError, logger


class ChatRequest(BaseModel):
    """Simple chat request model"""
    message: str = Field(..., min_length=1, max_length=10000, description="User message")
    system_prompt: str = Field(default="", max_length=1000, description="Optional system prompt")


class ChatResponse(BaseModel):
    """Simple chat response model"""
    response: str = Field(..., description="AI response text")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")


router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """
    Simple chat endpoint - sends message to LLM and returns response
    
    This is a stateless endpoint that simply proxies requests to the LLM service.
    No conversation history is maintained on the backend.
    """
    start_time = time.time()
    
    try:
        # Validate request
        if not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )
        
        logger.info(f"Processing chat request, message_length={len(request.message)}")
        
        # Get AI response
        ai_response = await llm_service.generate_response(
            user_message=request.message.strip(),
            system_prompt=request.system_prompt.strip() if request.system_prompt else None
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(
            f"Chat request processed successfully in {processing_time}ms, "
            f"response_length={len(ai_response)}"
        )
        
        return ChatResponse(
            response=ai_response,
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        # Re-raise HTTPExceptions as-is (they have the correct status codes)
        raise
        
    except ValidationError as e:
        logger.warning(f"Validation error in chat endpoint: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    
    except LLMError as e:
        logger.error(f"LLM error in chat endpoint: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {e.message}"
        )
    
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
