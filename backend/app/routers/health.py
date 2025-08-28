"""
Health check and system status endpoints for LLM proxy
"""
from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import sys
import platform

from ..services.llm_service import llm_service
from ..core.config import get_settings
from ..core.utils import logger

# Get settings instance
settings = get_settings()

router = APIRouter(prefix="/api/v1/health", tags=["health"])


@router.get("")
async def health_check():
    """
    Basic health check endpoint
    
    Returns server status and basic system information.
    This endpoint should be used by load balancers and monitoring systems.
    """
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "ChatBot9000 LLM Proxy",
            "version": "1.0.0",
            "python_version": sys.version,
            "platform": platform.platform()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Health check failed"
        )


@router.get("/detailed")
async def detailed_health_check():
    """
    Detailed health check with service dependencies
    
    Checks the health of the LLM service connectivity.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "ChatBot9000 LLM Proxy",
        "version": "1.0.0",
        "components": {}
    }
    
    overall_healthy = True
    
    try:
        # Check LLM service
        try:
            llm_healthy = await llm_service.health_check()
            health_status["components"]["llm_service"] = {
                "status": "healthy" if llm_healthy else "unhealthy",
                "message": "Google Generative AI service is accessible" if llm_healthy else "Google Generative AI service is not accessible"
            }
            if not llm_healthy:
                overall_healthy = False
        except Exception as e:
            health_status["components"]["llm_service"] = {
                "status": "unhealthy",
                "message": f"LLM service error: {str(e)}"
            }
            overall_healthy = False
        
        # Check configuration
        try:
            config_valid = bool(settings.google_api_key)
            health_status["components"]["configuration"] = {
                "status": "healthy" if config_valid else "unhealthy",
                "message": "Google API key is configured" if config_valid else "Missing Google API key"
            }
            if not config_valid:
                overall_healthy = False
        except Exception as e:
            health_status["components"]["configuration"] = {
                "status": "unhealthy",
                "message": f"Configuration error: {str(e)}"
            }
            overall_healthy = False
        
        # Update overall status
        health_status["status"] = "healthy" if overall_healthy else "unhealthy"
        
        # Return appropriate HTTP status
        if overall_healthy:
            return health_status
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=health_status
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Detailed health check failed"
        )
