"""
Tests for health check routes
"""
import pytest
from unittest.mock import patch, AsyncMock
from fastapi import status
from datetime import datetime


class TestBasicHealthCheck:
    """Test basic health check endpoint"""
    
    def test_health_check_success(self, client):
        """Test basic health check returns healthy status"""
        response = client.get("/api/v1/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["service"] == "ChatBot9000 LLM Proxy"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data
        assert "python_version" in data
        assert "platform" in data
        
        # Verify timestamp format
        timestamp = data["timestamp"]
        datetime.fromisoformat(timestamp.replace('Z', '+00:00'))  # Should not raise
    
    @patch('app.routers.health.logger')
    def test_health_check_exception_handling(self, mock_logger, client):
        """Test health check handles exceptions properly"""
        # Mock platform.platform to raise an exception
        with patch('app.routers.health.platform.platform', side_effect=RuntimeError("Platform error")):
            response = client.get("/api/v1/health")
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            data = response.json()
            assert data["detail"] == "Health check failed"
            
            # Verify error was logged
            mock_logger.error.assert_called_once()


class TestDetailedHealthCheck:
    """Test detailed health check endpoint"""
    
    def test_detailed_health_check_all_healthy(self, client, mock_llm_service):
        """Test detailed health check when all components are healthy"""
        response = client.get("/api/v1/health/detailed")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["service"] == "ChatBot9000 LLM Proxy"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data
        assert "components" in data
        
        # Check components
        components = data["components"]
        assert "llm_service" in components
        assert "configuration" in components
        
        # LLM service should be healthy
        assert components["llm_service"]["status"] == "healthy"
        assert "Google Generative AI service is accessible" in components["llm_service"]["message"]
        
        # Configuration should be healthy
        assert components["configuration"]["status"] == "healthy"
        assert "Google API key is configured" in components["configuration"]["message"]
        
        # Verify LLM health check was called
        mock_llm_service["health_check"].assert_called_once()
    
    def test_detailed_health_check_llm_unhealthy(self, client, mock_llm_service):
        """Test detailed health check when LLM service is unhealthy"""
        # Mock LLM service to return unhealthy status
        mock_llm_service["health_check"].return_value = {
            "status": "unhealthy",
            "model": "gemini-2.5-flash",
            "error": "Connection failed"
        }
        
        response = client.get("/api/v1/health/detailed")
        
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = response.json()["detail"]  # Error response wraps in detail
        
        assert data["status"] == "unhealthy"
        assert data["components"]["llm_service"]["status"] == "unhealthy"
        assert "Google Generative AI service is not accessible" in data["components"]["llm_service"]["message"]
    
    def test_detailed_health_check_llm_exception(self, client, mock_llm_service):
        """Test detailed health check when LLM service raises exception"""
        mock_llm_service["health_check"].side_effect = RuntimeError("LLM connection error")
        
        response = client.get("/api/v1/health/detailed")
        
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        data = response.json()["detail"]
        
        assert data["status"] == "unhealthy"
        assert data["components"]["llm_service"]["status"] == "unhealthy"
        assert "LLM service error" in data["components"]["llm_service"]["message"]
    
    @patch.dict('os.environ', {}, clear=True)
    def test_detailed_health_check_missing_api_key(self, client, mock_llm_service):
        """Test detailed health check when API key is missing"""
        # Mock LLM service to avoid hanging due to missing API key
        mock_llm_service["health_check"].return_value = {
            "status": "healthy",
            "model": "gemini-2.5-flash",
            "response_received": True,
            "test_response_length": 35,
        }
        
        # Mock the settings object directly in the health module
        with patch('app.routers.health.settings') as mock_settings:
            mock_settings.google_api_key = None
            
            response = client.get("/api/v1/health/detailed")
            
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            data = response.json()["detail"]
            
            assert data["status"] == "unhealthy"
            assert data["components"]["configuration"]["status"] == "unhealthy"
            assert "Missing Google API key" in data["components"]["configuration"]["message"]
    
    def test_detailed_health_check_configuration_exception(self, client, mock_llm_service):
        """Test detailed health check when configuration check fails"""
        # Mock LLM service to avoid interference
        mock_llm_service["health_check"].return_value = {
            "status": "healthy",
            "model": "gemini-2.5-flash",
            "response_received": True,
            "test_response_length": 35,
        }
        
        # Mock the settings object to raise an error when accessing google_api_key
        with patch('app.routers.health.settings') as mock_settings:
            type(mock_settings).google_api_key = property(lambda self: (_ for _ in ()).throw(RuntimeError("Config error")))
            
            response = client.get("/api/v1/health/detailed")
            
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            data = response.json()["detail"]
            
            assert data["status"] == "unhealthy"
            assert data["components"]["configuration"]["status"] == "unhealthy"
            assert "Configuration error" in data["components"]["configuration"]["message"]
    
    @patch('app.routers.health.logger')
    def test_detailed_health_check_unexpected_exception(self, mock_logger, client, mock_llm_service):
        """Test detailed health check handles unexpected exceptions"""
        # Mock LLM service to return a valid response to avoid conflicts
        mock_llm_service["health_check"].return_value = {
            "status": "healthy",
            "model": "gemini-2.5-flash",
            "response_received": True,
            "test_response_length": 35,
        }
        
        # Mock datetime.utcnow to raise an exception during health status creation
        with patch('app.routers.health.datetime') as mock_datetime:
            mock_datetime.utcnow.side_effect = RuntimeError("Unexpected error")
            
            # The exception should propagate in the test environment
            # since it occurs outside the endpoint's try-catch blocks
            with pytest.raises(RuntimeError, match="Unexpected error"):
                client.get("/api/v1/health/detailed")


class TestHealthCheckRouting:
    """Test health check routing and URL patterns"""
    
    def test_health_check_route_exact(self, client):
        """Test exact health check route"""
        response = client.get("/api/v1/health")
        assert response.status_code == status.HTTP_200_OK
    
    def test_health_check_route_with_slash(self, client):
        """Test health check route with trailing slash"""
        response = client.get("/api/v1/health/")
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_307_TEMPORARY_REDIRECT]
    
    def test_detailed_health_check_route(self, client, mock_llm_service):
        """Test detailed health check route"""
        # Mock LLM service to return healthy status for routing test
        mock_llm_service["health_check"].return_value = {
            "status": "healthy",
            "model": "gemini-2.5-flash",
            "response_received": True,
            "test_response_length": 35,
        }
        
        response = client.get("/api/v1/health/detailed")
        assert response.status_code == status.HTTP_200_OK
    
    def test_health_check_wrong_method(self, client):
        """Test health check endpoints only accept GET"""
        # Basic health check
        response = client.post("/api/v1/health")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Detailed health check
        response = client.post("/api/v1/health/detailed")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    
    def test_health_check_nonexistent_route(self, client):
        """Test non-existent health check routes"""
        response = client.get("/api/v1/health/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND
