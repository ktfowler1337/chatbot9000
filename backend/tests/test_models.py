"""
Tests for Pydantic models and schemas
"""
import pytest
from pydantic import ValidationError

from app.models.schemas import ChatRequest, ChatResponse, ErrorResponse, HealthResponse


class TestChatRequest:
    """Test ChatRequest model"""
    
    def test_valid_chat_request(self):
        """Test valid chat request creation"""
        request = ChatRequest(
            message="Hello, world!",
            system_prompt="You are helpful"
        )
        
        assert request.message == "Hello, world!"
        assert request.system_prompt == "You are helpful"
    
    def test_chat_request_message_only(self):
        """Test chat request with message only"""
        request = ChatRequest(message="Hello, world!")
        
        assert request.message == "Hello, world!"
        assert request.system_prompt is None
    
    def test_chat_request_message_stripped(self):
        """Test that message is stripped of whitespace"""
        request = ChatRequest(message="  Hello, world!  \n\t")
        
        assert request.message == "Hello, world!"
    
    def test_chat_request_empty_message_error(self):
        """Test empty message validation"""
        with pytest.raises(ValidationError) as exc_info:
            ChatRequest(message="")
        
        assert "String should have at least 1 character" in str(exc_info.value)
    
    def test_chat_request_whitespace_only_message_error(self):
        """Test whitespace-only message validation"""
        with pytest.raises(ValidationError) as exc_info:
            ChatRequest(message="   \n\t  ")
        
        assert "Message cannot be empty or only whitespace" in str(exc_info.value)
    
    def test_chat_request_message_too_long(self):
        """Test message length validation"""
        long_message = "x" * 10001  # Exceeds max length
        
        with pytest.raises(ValidationError) as exc_info:
            ChatRequest(message=long_message)
        
        assert "String should have at most 10000 characters" in str(exc_info.value)
    
    def test_chat_request_system_prompt_too_long(self):
        """Test system prompt length validation"""
        long_prompt = "x" * 2001  # Exceeds max length
        
        with pytest.raises(ValidationError) as exc_info:
            ChatRequest(message="Hello", system_prompt=long_prompt)
        
        assert "String should have at most 2000 characters" in str(exc_info.value)
    
    def test_chat_request_missing_message(self):
        """Test missing message field"""
        with pytest.raises(ValidationError) as exc_info:
            ChatRequest()
        
        assert "Field required" in str(exc_info.value)
    
    def test_chat_request_invalid_types(self):
        """Test invalid field types"""
        with pytest.raises(ValidationError):
            ChatRequest(message=123)  # Should be string
        
        with pytest.raises(ValidationError):
            ChatRequest(message="Hello", system_prompt=123)  # Should be string


class TestChatResponse:
    """Test ChatResponse model"""
    
    def test_valid_chat_response(self):
        """Test valid chat response creation"""
        response = ChatResponse(
            response="Hello from AI!",
            processing_time_ms=150
        )
        
        assert response.response == "Hello from AI!"
        assert response.processing_time_ms == 150
    
    def test_chat_response_missing_fields(self):
        """Test missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            ChatResponse()
        
        errors = str(exc_info.value)
        assert "Field required" in errors
    
    def test_chat_response_invalid_types(self):
        """Test invalid field types"""
        with pytest.raises(ValidationError):
            ChatResponse(response=123, processing_time_ms=150)
        
        with pytest.raises(ValidationError):
            ChatResponse(response="Hello", processing_time_ms="not_a_number")


class TestErrorResponse:
    """Test ErrorResponse model"""
    
    def test_valid_error_response(self):
        """Test valid error response creation"""
        response = ErrorResponse(
            detail="Something went wrong",
            type="validation_error"
        )
        
        assert response.detail == "Something went wrong"
        assert response.type == "validation_error"
    
    def test_error_response_detail_only(self):
        """Test error response with detail only"""
        response = ErrorResponse(detail="Error occurred")
        
        assert response.detail == "Error occurred"
        assert response.type is None
    
    def test_error_response_missing_detail(self):
        """Test missing detail field"""
        with pytest.raises(ValidationError) as exc_info:
            ErrorResponse()
        
        assert "Field required" in str(exc_info.value)


class TestHealthResponse:
    """Test HealthResponse model"""
    
    def test_valid_health_response(self):
        """Test valid health response creation"""
        response = HealthResponse(
            status="healthy",
            timestamp="2025-08-28T12:00:00",
            service="ChatBot9000 LLM Proxy",
            version="1.0.0",
            python_version="3.13.7",
            platform="Windows-10"
        )
        
        assert response.status == "healthy"
        assert response.timestamp == "2025-08-28T12:00:00"
        assert response.service == "ChatBot9000 LLM Proxy"
        assert response.version == "1.0.0"
        assert response.python_version == "3.13.7"
        assert response.platform == "Windows-10"
    
    def test_health_response_status_validation(self):
        """Test status field validation"""
        # Valid values
        response1 = HealthResponse(
            status="healthy",
            timestamp="2025-08-28T12:00:00",
            service="Test",
            version="1.0.0",
            python_version="3.13.7",
            platform="Windows"
        )
        assert response1.status == "healthy"
        
        response2 = HealthResponse(
            status="unhealthy",
            timestamp="2025-08-28T12:00:00",
            service="Test",
            version="1.0.0",
            python_version="3.13.7",
            platform="Windows"
        )
        assert response2.status == "unhealthy"
        
        # Invalid value
        with pytest.raises(ValidationError) as exc_info:
            HealthResponse(
                status="invalid_status",
                timestamp="2025-08-28T12:00:00",
                service="Test",
                version="1.0.0",
                python_version="3.13.7",
                platform="Windows"
            )
        
        assert "Input should be 'healthy' or 'unhealthy'" in str(exc_info.value)
    
    def test_health_response_missing_fields(self):
        """Test missing required fields"""
        with pytest.raises(ValidationError) as exc_info:
            HealthResponse()
        
        errors = str(exc_info.value)
        assert "Field required" in errors


class TestModelSerialization:
    """Test model serialization and deserialization"""
    
    def test_chat_request_serialization(self):
        """Test ChatRequest serialization"""
        request = ChatRequest(
            message="Hello",
            system_prompt="Be helpful"
        )
        
        # To dict
        data = request.model_dump()
        assert data["message"] == "Hello"
        assert data["system_prompt"] == "Be helpful"
        
        # To JSON
        json_str = request.model_dump_json()
        assert "Hello" in json_str
        assert "Be helpful" in json_str
    
    def test_chat_response_serialization(self):
        """Test ChatResponse serialization"""
        response = ChatResponse(
            response="AI response",
            processing_time_ms=250
        )
        
        # To dict
        data = response.model_dump()
        assert data["response"] == "AI response"
        assert data["processing_time_ms"] == 250
        
        # To JSON
        json_str = response.model_dump_json()
        assert "AI response" in json_str
        assert "250" in json_str
    
    def test_chat_request_deserialization(self):
        """Test ChatRequest deserialization"""
        data = {
            "message": "Test message",
            "system_prompt": "Test prompt"
        }
        
        request = ChatRequest(**data)
        assert request.message == "Test message"
        assert request.system_prompt == "Test prompt"
    
    def test_model_validation_on_construction(self):
        """Test that validation occurs on model construction"""
        # This should work
        valid_data = {
            "message": "Valid message",
            "system_prompt": "Valid prompt"
        }
        request = ChatRequest(**valid_data)
        assert request.message == "Valid message"
        
        # This should fail
        invalid_data = {
            "message": "",  # Empty message
            "system_prompt": "Valid prompt"
        }
        with pytest.raises(ValidationError):
            ChatRequest(**invalid_data)
