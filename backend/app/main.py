"""
Simplified FastAPI application for stateless LLM proxy
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from .routers import chat, health
from .core.config import get_settings
from .services.llm_service import llm_service
from .core.utils import ValidationError, LLMError, logger

# Get settings instance
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - initialization and cleanup"""
    logger.info("Starting up LLM proxy service...")
    
    try:
        # LLM service is automatically initialized on import
        logger.info("LLM service initialized successfully")
        
        logger.info("Application startup complete")
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        raise
    finally:
        logger.info("Shutting down application...")
        logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="ChatBot9000 LLM Proxy",
    description="Simple stateless proxy for Google Generative AI - conversation persistence handled by frontend",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.message, "type": "validation_error"}
    )


@app.exception_handler(LLMError)
async def llm_error_handler(request: Request, exc: LLMError):
    """Handle LLM service errors"""
    logger.error(f"LLM error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"AI service error: {exc.message}", "type": "llm_error"}
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors"""
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"}
    )


# Request/Response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and responses"""
    start_time = time.time()
    
    logger.info(f"Request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"Response: {response.status_code} for {request.method} {request.url.path} "
        f"in {process_time:.3f}s"
    )
    
    return response


# Include routers
app.include_router(chat.router)
app.include_router(health.router)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint with basic service info"""
    return {
        "service": "ChatBot9000 LLM Proxy",
        "version": "1.0.0",
        "status": "active",
        "description": "Stateless proxy for Google Generative AI",
        "docs": "/docs" if settings.debug else "disabled in production"
    }
