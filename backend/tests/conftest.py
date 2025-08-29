"""
Test configuration and fixtures
"""
import pytest
import os
from unittest.mock import patch, AsyncMock, MagicMock

# Set environment variables before any imports that might use them
os.environ.setdefault("GOOGLE_API_KEY", "test-api-key")

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import get_settings
from app.services.llm_service import llm_service


@pytest.fixture
def client():
    """Create test client with mocked environment"""
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "test-api-key"}):
        with TestClient(app) as test_client:
            yield test_client


@pytest.fixture
def mock_llm_service():
    """Mock LLM service for testing"""
    with patch.object(llm_service, 'generate_response') as mock_generate:
        with patch.object(llm_service, 'health_check') as mock_health:
            # Configure default mock responses
            mock_generate.return_value = "This is a test response from the AI."
            mock_health.return_value = {
                "status": "healthy",
                "model": "gemini-2.5-flash",
                "response_received": True,
                "test_response_length": 35,
            }
            
            yield {
                "generate_response": mock_generate,
                "health_check": mock_health
            }


@pytest.fixture
def mock_settings():
    """Mock settings for testing"""
    with patch('app.core.config.get_settings') as mock_get_settings:
        settings = get_settings()
        settings.google_api_key = "test-api-key"
        settings.debug = True
        mock_get_settings.return_value = settings
        yield settings


@pytest.fixture(autouse=True)
def mock_env_vars():
    """Automatically mock required environment variables"""
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "test-api-key"}):
        yield
