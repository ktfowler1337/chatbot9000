"""
Tests for LLM service functionality
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import asyncio

from app.services.llm_service import LLMService
from app.core.utils import LLMError, ValidationError


class TestLLMServiceInitialization:
    """Test LLM service initialization"""
    
    @patch('app.services.llm_service.genai.configure')
    def test_llm_service_initialization_success(self, mock_configure):
        """Test successful LLM service initialization"""
        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'}):
            service = LLMService()
            
            assert service.api_key == 'test-key'
            assert service.model_name == 'gemini-2.5-flash'
            mock_configure.assert_called_once_with(api_key='test-key')
    
    @patch('app.services.llm_service.genai.configure')
    def test_llm_service_initialization_failure(self, mock_configure):
        """Test LLM service initialization failure"""
        mock_configure.side_effect = Exception("Configuration failed")
        
        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'}):
            with pytest.raises(LLMError, match="Failed to configure LLM service"):
                LLMService()


class TestGenerateResponse:
    """Test LLM response generation"""
    
    @pytest.fixture
    def mock_service(self):
        """Create a mock LLM service"""
        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'}):
            with patch('app.services.llm_service.genai.configure'):
                service = LLMService()
                yield service
    
    @pytest.mark.asyncio
    async def test_generate_response_success(self, mock_service):
        """Test successful response generation"""
        # Mock the model and response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "This is a test response"
        
        # Create a callable that returns the mock response
        def mock_generate_content(context):
            return mock_response
        
        mock_model.generate_content = mock_generate_content
        
        with patch.object(mock_service, '_get_model', return_value=mock_model):
            result = await mock_service.generate_response("Hello, world!")
            
            assert result == "This is a test response"
    
    @pytest.mark.asyncio
    async def test_generate_response_empty_message(self, mock_service):
        """Test response generation with empty message"""
        with pytest.raises(ValidationError, match="User message cannot be empty"):
            await mock_service.generate_response("")
    
    @pytest.mark.asyncio
    async def test_generate_response_whitespace_message(self, mock_service):
        """Test response generation with whitespace-only message"""
        with pytest.raises(ValidationError, match="User message cannot be empty"):
            await mock_service.generate_response("   \n\t  ")
    
    @pytest.mark.asyncio
    async def test_generate_response_message_too_long(self, mock_service):
        """Test response generation with message exceeding max length"""
        long_message = "x" * 10001  # Exceeds default max length
        
        with pytest.raises(ValidationError, match="Message too long"):
            await mock_service.generate_response(long_message)
    
    @pytest.mark.asyncio
    async def test_generate_response_with_system_prompt(self, mock_service):
        """Test response generation with custom system prompt"""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Custom response"
        
        # Create a callable that returns the mock response and captures the context
        captured_context = None
        def mock_generate_content(context):
            nonlocal captured_context
            captured_context = context
            return mock_response
        
        mock_model.generate_content = mock_generate_content
        
        with patch.object(mock_service, '_get_model', return_value=mock_model):
            result = await mock_service.generate_response(
                "Hello", 
                system_prompt="You are a helpful assistant"
            )
            
            assert result == "Custom response"
            
            # Verify context includes system prompt
            assert captured_context is not None
            assert "You are a helpful assistant" in captured_context
    
    @pytest.mark.asyncio
    async def test_generate_response_with_conversation_history(self, mock_service):
        """Test response generation with conversation history"""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Response with history"
        
        conversation_history = [
            {"role": "user", "content": "Previous question"},
            {"role": "assistant", "content": "Previous answer"}
        ]
        
        # Create a callable that returns the mock response and captures the context
        captured_context = None
        def mock_generate_content(context):
            nonlocal captured_context
            captured_context = context
            return mock_response
        
        mock_model.generate_content = mock_generate_content
        
        with patch.object(mock_service, '_get_model', return_value=mock_model):
            result = await mock_service.generate_response(
                "Current question",
                conversation_history=conversation_history
            )
            
            assert result == "Response with history"
            
            # Verify context includes conversation history
            assert captured_context is not None
            assert "Previous question" in captured_context
            assert "Previous answer" in captured_context
    
    @pytest.mark.asyncio
    async def test_generate_response_empty_response(self, mock_service):
        """Test handling of empty response from LLM"""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = ""  # Empty response
        mock_model.generate_content.return_value = mock_response
        
        with patch.object(mock_service, '_get_model', return_value=mock_model):
            with patch('asyncio.get_event_loop') as mock_loop:
                mock_loop.return_value.run_in_executor = AsyncMock(return_value=mock_response)
                
                with pytest.raises(LLMError, match="Empty response from LLM"):
                    await mock_service.generate_response("Hello")
    
    @pytest.mark.asyncio
    async def test_generate_response_api_error(self, mock_service):
        """Test handling of API errors during generation"""
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API Error")
        
        with patch.object(mock_service, '_get_model', return_value=mock_model):
            with patch('asyncio.get_event_loop') as mock_loop:
                mock_loop.return_value.run_in_executor = AsyncMock(side_effect=Exception("API Error"))
                
                with pytest.raises(LLMError, match="Failed to generate response"):
                    await mock_service.generate_response("Hello")


class TestHealthCheck:
    """Test LLM service health check"""
    
    @pytest.fixture
    def mock_service(self):
        """Create a mock LLM service"""
        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'}):
            with patch('app.services.llm_service.genai.configure'):
                service = LLMService()
                yield service
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, mock_service):
        """Test successful health check"""
        with patch.object(mock_service, 'generate_response', return_value="Yes, I am working correctly."):
            result = await mock_service.health_check()
            
            assert result["status"] == "healthy"
            assert result["model"] == "gemini-2.5-flash"
            assert result["response_received"] is True
            assert result["test_response_length"] > 0
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, mock_service):
        """Test health check failure"""
        with patch.object(mock_service, 'generate_response', side_effect=LLMError("Service unavailable")):
            result = await mock_service.health_check()
            
            assert result["status"] == "unhealthy"
            assert result["model"] == "gemini-2.5-flash"
            assert "error" in result
            assert "Service unavailable" in result["error"]


class TestLLMServiceCapabilities:
    """Test LLM service capabilities"""
    
    @pytest.fixture
    def mock_service(self):
        """Create a mock LLM service"""
        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'}):
            with patch('app.services.llm_service.genai.configure'):
                service = LLMService()
                yield service
    
    def test_get_capabilities(self, mock_service):
        """Test getting service capabilities"""
        capabilities = mock_service.get_capabilities()
        
        assert "supported_models" in capabilities
        assert "max_message_length" in capabilities
        assert "max_conversation_length" in capabilities
        assert "features" in capabilities
        
        assert mock_service.model_name in capabilities["supported_models"]
        assert "text_generation" in capabilities["features"]
        assert "conversation_context" in capabilities["features"]


class TestConversationContextBuilding:
    """Test conversation context building"""
    
    @pytest.fixture
    def mock_service(self):
        """Create a mock LLM service"""
        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'}):
            with patch('app.services.llm_service.genai.configure'):
                service = LLMService()
                yield service
    
    def test_build_conversation_context_basic(self, mock_service):
        """Test basic conversation context building"""
        context = mock_service._build_conversation_context(
            user_message="Hello",
            conversation_history=[],
            system_prompt=None
        )
        
        assert "System:" in context
        assert "User: Hello" in context
        assert "Assistant:" in context
    
    def test_build_conversation_context_with_history(self, mock_service):
        """Test conversation context with history"""
        history = [
            {"role": "user", "content": "First message"},
            {"role": "assistant", "content": "First response"},
            {"role": "user", "content": "Second message"}
        ]
        
        context = mock_service._build_conversation_context(
            user_message="Third message",
            conversation_history=history,
            system_prompt=None
        )
        
        assert "User: First message" in context
        assert "Assistant: First response" in context
        assert "User: Second message" in context
        assert "User: Third message" in context
    
    def test_build_conversation_context_with_system_prompt(self, mock_service):
        """Test conversation context with custom system prompt"""
        context = mock_service._build_conversation_context(
            user_message="Hello",
            conversation_history=[],
            system_prompt="Custom system prompt"
        )
        
        assert "System: Custom system prompt" in context
        assert "User: Hello" in context
    
    def test_build_conversation_context_history_limit(self, mock_service):
        """Test conversation context respects history limits"""
        # Create history longer than max_conversation_length
        long_history = []
        for i in range(150):  # Exceeds default max of 100
            long_history.append({"role": "user", "content": f"Message {i}"})
        
        context = mock_service._build_conversation_context(
            user_message="Current message",
            conversation_history=long_history,
            system_prompt=None
        )
        
        # Should only include recent messages
        assert "Message 0" not in context  # Very old messages excluded
        assert "Message 140" in context  # Recent messages included
        assert "Current message" in context
