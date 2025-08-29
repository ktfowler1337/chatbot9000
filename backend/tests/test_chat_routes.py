"""
Tests for chat API routes
"""
import pytest
from unittest.mock import patch, AsyncMock
from fastapi import status


class TestChatEndpoint:
    """Test chat endpoint functionality"""
    
    def test_chat_success(self, client, mock_llm_service):
        """Test successful chat request"""
        response = client.post("/api/v1/chat", json={
            "message": "Hello, how are you?"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "response" in data
        assert "processing_time_ms" in data
        assert data["response"] == "This is a test response from the AI."
        assert isinstance(data["processing_time_ms"], int)
        assert data["processing_time_ms"] >= 0
        
        # Verify LLM service was called
        mock_llm_service["generate_response"].assert_called_once()
    
    def test_chat_with_system_prompt(self, client, mock_llm_service):
        """Test chat request with custom system prompt"""
        response = client.post("/api/v1/chat", json={
            "message": "What is the weather?",
            "system_prompt": "You are a helpful weather assistant."
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "response" in data
        
        # Verify LLM service was called with system prompt
        call_args = mock_llm_service["generate_response"].call_args
        assert call_args[1]["system_prompt"] == "You are a helpful weather assistant."
    
    def test_chat_empty_message_error(self, client):
        """Test chat request with empty message"""
        response = client.post("/api/v1/chat", json={
            "message": ""
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_chat_whitespace_only_message_error(self, client):
        """Test chat request with whitespace-only message"""
        response = client.post("/api/v1/chat", json={
            "message": "   \n\t  "
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "Message cannot be empty" in data["detail"]
    
    def test_chat_message_too_long(self, client):
        """Test chat request with message exceeding max length"""
        long_message = "x" * 10001  # Exceeds 10000 char limit
        
        response = client.post("/api/v1/chat", json={
            "message": long_message
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_chat_system_prompt_too_long(self, client):
        """Test chat request with system prompt exceeding max length"""
        long_prompt = "x" * 1001  # Exceeds 1000 char limit
        
        response = client.post("/api/v1/chat", json={
            "message": "Hello",
            "system_prompt": long_prompt
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_chat_missing_message_field(self, client):
        """Test chat request without message field"""
        response = client.post("/api/v1/chat", json={
            "system_prompt": "Test prompt"
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_chat_invalid_json(self, client):
        """Test chat request with invalid JSON"""
        response = client.post("/api/v1/chat", 
                              data="invalid json",
                              headers={"Content-Type": "application/json"})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @patch('app.routers.chat.llm_service.generate_response')
    def test_chat_llm_service_error(self, mock_generate, client):
        """Test chat endpoint when LLM service fails"""
        from app.core.utils import LLMError
        
        mock_generate.side_effect = LLMError("LLM service unavailable")
        
        response = client.post("/api/v1/chat", json={
            "message": "Hello"
        })
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        data = response.json()
        assert "AI service error" in data["detail"]
    
    @patch('app.routers.chat.llm_service.generate_response')
    def test_chat_validation_error(self, mock_generate, client):
        """Test chat endpoint when validation error occurs"""
        from app.core.utils import ValidationError
        
        mock_generate.side_effect = ValidationError("Invalid input")
        
        response = client.post("/api/v1/chat", json={
            "message": "Hello"
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["detail"] == "Invalid input"
    
    @patch('app.routers.chat.llm_service.generate_response')
    def test_chat_unexpected_error(self, mock_generate, client):
        """Test chat endpoint when unexpected error occurs"""
        mock_generate.side_effect = RuntimeError("Unexpected error")
        
        response = client.post("/api/v1/chat", json={
            "message": "Hello"
        })
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        data = response.json()
        assert data["detail"] == "An unexpected error occurred"
    
    def test_chat_request_logging(self, client, mock_llm_service):
        """Test that chat requests are properly logged"""
        with patch('app.routers.chat.logger') as mock_logger:
            response = client.post("/api/v1/chat", json={
                "message": "Test message for logging"
            })
            
            assert response.status_code == status.HTTP_200_OK
            
            # Verify logging calls
            assert mock_logger.info.call_count >= 2  # Processing and success logs
            
            # Check log content
            log_calls = [call.args[0] for call in mock_logger.info.call_args_list]
            assert any("Processing chat request" in log for log in log_calls)
            assert any("Chat request processed successfully" in log for log in log_calls)


class TestChatModels:
    """Test chat request/response models"""
    
    def test_valid_chat_request_model(self, client):
        """Test that valid request models work correctly"""
        response = client.post("/api/v1/chat", json={
            "message": "Valid message",
            "system_prompt": "Valid system prompt"
        })
        
        # Should not fail due to model validation
        assert response.status_code != status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_chat_request_model_validation(self, client):
        """Test chat request model field validation"""
        # Test various invalid inputs
        invalid_requests = [
            {"message": ""},  # Empty message
            {"message": None},  # Null message
            {"message": 123},  # Wrong type
        ]
        
        for invalid_request in invalid_requests:
            response = client.post("/api/v1/chat", json=invalid_request)
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
