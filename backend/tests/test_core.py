"""
Tests for core utilities and configuration
"""
import pytest
from datetime import datetime, timezone
from unittest.mock import patch
import os
from pydantic import ValidationError as PydanticValidationError

from app.core.utils import ResponseFormatter, AppError, ValidationError, LLMError, utc_now
from app.core.config import get_settings, get_google_api_key, Settings


class TestResponseFormatter:
    """Test ResponseFormatter utility"""
    
    def test_success_response(self):
        """Test success response formatting"""
        data = {"key": "value"}
        response = ResponseFormatter.success(data, "Operation successful")
        
        assert response["success"] is True
        assert response["message"] == "Operation successful"
        assert response["data"] == data
        assert "timestamp" in response
        
        # Verify timestamp format
        timestamp = response["timestamp"]
        datetime.fromisoformat(timestamp.replace('Z', '+00:00'))  # Should not raise
    
    def test_success_response_default_message(self):
        """Test success response with default message"""
        data = {"test": True}
        response = ResponseFormatter.success(data)
        
        assert response["success"] is True
        assert response["message"] == "Success"
        assert response["data"] == data
    
    def test_error_response(self):
        """Test error response formatting"""
        response = ResponseFormatter.error("Something went wrong", "ERROR_CODE", {"field": "value"})
        
        assert response["success"] is False
        assert response["message"] == "Something went wrong"
        assert response["error_code"] == "ERROR_CODE"
        assert response["details"] == {"field": "value"}
        assert "timestamp" in response
    
    def test_error_response_minimal(self):
        """Test error response with minimal parameters"""
        response = ResponseFormatter.error("Error occurred")
        
        assert response["success"] is False
        assert response["message"] == "Error occurred"
        assert "error_code" not in response
        assert "details" not in response
        assert "timestamp" in response


class TestCustomExceptions:
    """Test custom exception classes"""
    
    def test_app_error(self):
        """Test AppError exception"""
        error = AppError("Test error", "TEST_CODE", 400)
        
        assert str(error) == "Test error"
        assert error.message == "Test error"
        assert error.error_code == "TEST_CODE"
        assert error.status_code == 400
    
    def test_app_error_defaults(self):
        """Test AppError with defaults"""
        error = AppError("Test error")
        
        assert error.message == "Test error"
        assert error.error_code is None
        assert error.status_code == 500
    
    def test_validation_error(self):
        """Test ValidationError exception"""
        error = ValidationError("Invalid input", "email")
        
        assert str(error) == "Invalid input"
        assert error.message == "Invalid input"
        assert error.field == "email"
        assert error.error_code == "VALIDATION_ERROR"
        assert error.status_code == 400
    
    def test_validation_error_no_field(self):
        """Test ValidationError without field"""
        error = ValidationError("Invalid input")
        
        assert error.field is None
    
    def test_llm_error(self):
        """Test LLMError exception"""
        error = LLMError("Service unavailable", "openai")
        
        assert str(error) == "Service unavailable"
        assert error.message == "Service unavailable"
        assert error.provider == "openai"
        assert error.error_code == "LLM_ERROR_OPENAI"
        assert error.status_code == 500
    
    def test_llm_error_default_provider(self):
        """Test LLMError with default provider"""
        error = LLMError("Service error")
        
        assert error.provider == "gemini"
        assert error.error_code == "LLM_ERROR_GEMINI"


class TestUtilityFunctions:
    """Test utility functions"""
    
    def test_utc_now(self):
        """Test utc_now function"""
        now = utc_now()
        
        assert isinstance(now, datetime)
        assert now.tzinfo == timezone.utc
        
        # Should be close to current time (within 1 second)
        current = datetime.now(timezone.utc)
        diff = abs((current - now).total_seconds())
        assert diff < 1.0


class TestSettings:
    """Test application settings"""
    
    def test_default_settings(self):
        """Test default settings values"""
        settings = Settings()
        
        assert settings.app_name == "ChatBot9000 LLM Proxy"
        assert settings.app_version == "1.0.0"
        assert settings.debug is False
        assert settings.host == "0.0.0.0"
        assert settings.port == 8000
        assert settings.gemini_model == "gemini-2.5-flash"
        assert settings.log_level == "INFO"
        assert settings.max_conversation_length == 100
        assert settings.max_message_length == 10000
    
    def test_settings_allowed_origins(self):
        """Test default allowed origins"""
        settings = Settings()
        
        expected_origins = ["http://localhost:5173", "http://localhost:3000"]
        assert settings.allowed_origins == expected_origins
    
    def test_settings_with_env_override(self):
        """Test settings with environment variable override"""
        with patch.dict(os.environ, {
            'DEBUG': 'true',
            'PORT': '9000',
            'LOG_LEVEL': 'DEBUG',
            'GEMINI_MODEL': 'gemini-pro'
        }):
            settings = Settings()
            
            assert settings.debug is True
            assert settings.port == 9000
            assert settings.log_level == "DEBUG"
            assert settings.gemini_model == "gemini-pro"
    
    def test_get_settings_cached(self):
        """Test that get_settings returns cached instance"""
        settings1 = get_settings()
        settings2 = get_settings()
        
        assert settings1 is settings2  # Same instance (cached)


class TestGoogleApiKey:
    """Test Google API key configuration"""
    
    def test_get_google_api_key_from_env(self):
        """Test getting API key from environment variable"""
        with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test-key-from-env'}):
            api_key = get_google_api_key()
            assert api_key == 'test-key-from-env'
    
    def test_get_google_api_key_from_settings(self):
        """Test getting API key from settings when env is not set"""
        with patch.dict(os.environ, {}, clear=True):
            with patch('app.core.config.get_settings') as mock_get_settings:
                mock_settings = Settings()
                mock_settings.google_api_key = 'test-key-from-settings'
                mock_get_settings.return_value = mock_settings
                
                api_key = get_google_api_key()
                assert api_key == 'test-key-from-settings'
    
    def test_get_google_api_key_missing(self):
        """Test error when API key is missing"""
        with patch.dict(os.environ, {}, clear=True):
            with patch('app.core.config.get_settings') as mock_get_settings:
                mock_settings = Settings()
                mock_settings.google_api_key = None
                mock_get_settings.return_value = mock_settings
                
                with pytest.raises(ValueError, match="Google API key not found"):
                    get_google_api_key()
    
    def test_env_api_key_takes_precedence(self):
        """Test that environment variable takes precedence over settings"""
        with patch.dict(os.environ, {'GOOGLE_API_KEY': 'env-key'}):
            with patch('app.core.config.get_settings') as mock_get_settings:
                mock_settings = Settings()
                mock_settings.google_api_key = 'settings-key'
                mock_get_settings.return_value = mock_settings
                
                api_key = get_google_api_key()
                assert api_key == 'env-key'


class TestLLMConstants:
    """Test LLM constants"""
    
    def test_default_system_prompt(self):
        """Test default system prompt exists and is reasonable"""
        from app.core.config import LLMConstants
        
        prompt = LLMConstants.DEFAULT_SYSTEM_PROMPT
        
        assert isinstance(prompt, str)
        assert len(prompt) > 0
        assert "helpful" in prompt.lower()
        assert "assistant" in prompt.lower()


class TestConfigurationEdgeCases:
    """Test configuration edge cases and error handling"""
    
    def test_settings_with_invalid_types(self):
        """Test settings with invalid environment variable types"""
        with patch.dict(os.environ, {
            'PORT': 'not_a_number',
            'DEBUG': 'not_a_boolean'
        }):
            # Settings should raise validation error for invalid types in Pydantic V2
            with pytest.raises(PydanticValidationError) as exc_info:
                Settings()
            
            # Verify that the validation error contains information about the invalid fields
            error_str = str(exc_info.value)
            assert "bool_parsing" in error_str or "port" in error_str
            assert "int_parsing" in error_str or "debug" in error_str
    
    def test_settings_case_insensitive(self):
        """Test that settings are case insensitive"""
        with patch.dict(os.environ, {
            'debug': 'true',  # lowercase
            'PORT': '8080',   # uppercase
        }):
            settings = Settings()
            
            assert settings.debug is True
            assert settings.port == 8080
