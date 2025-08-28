"""
LLM Service for handling Google Generative AI interactions
"""
import asyncio
import time
from typing import List, Optional, Dict, Any
from datetime import datetime

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from ..core.config import get_google_api_key, get_settings, LLMConstants
from ..core.utils import logger, LLMError, ValidationError


class LLMService:
    """Service for LLM interactions using Google Generative AI"""
    
    def __init__(self):
        self.settings = get_settings()
        self.api_key = get_google_api_key()
        self.model_name = self.settings.gemini_model
        self._configure_genai()
        self._model = None
        
    def _configure_genai(self) -> None:
        """Configure Google Generative AI"""
        try:
            genai.configure(api_key=self.api_key)
            logger.info(f"Configured Google Generative AI with model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to configure Google Generative AI: {e}")
            raise LLMError(f"Failed to configure LLM service: {str(e)}")
    
    def _get_model(self):
        """Get or create model instance"""
        if self._model is None:
            try:
                # Configure safety settings
                safety_settings = {
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                }
                
                # Generation configuration
                generation_config = {
                    "temperature": 0.7,
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": 2048,
                }
                
                self._model = genai.GenerativeModel(
                    model_name=self.model_name,
                    safety_settings=safety_settings,
                    generation_config=generation_config,
                )
                
                logger.info("Successfully initialized Generative AI model")
            except Exception as e:
                logger.error(f"Failed to initialize model: {e}")
                raise LLMError(f"Failed to initialize model: {str(e)}")
        
        return self._model
    
    async def generate_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate AI response for given message and conversation context
        
        Args:
            user_message: The user's input message
            conversation_history: Previous messages in the conversation
            system_prompt: Custom system prompt (optional)
            
        Returns:
            Generated AI response text
            
        Raises:
            LLMError: If generation fails
            ValidationError: If input is invalid
        """
        try:
            # Validate input
            if not user_message or not user_message.strip():
                raise ValidationError("User message cannot be empty")
            
            if len(user_message) > self.settings.max_message_length:
                raise ValidationError(f"Message too long. Max length: {self.settings.max_message_length}")
            
            # Build conversation context
            context = self._build_conversation_context(
                user_message=user_message,
                conversation_history=conversation_history or [],
                system_prompt=system_prompt
            )
            
            # Generate response
            start_time = time.time()
            model = self._get_model()
            
            # Use asyncio to run the synchronous API call in a thread pool
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: model.generate_content(context)
            )
            
            processing_time = (time.time() - start_time) * 1000
            
            # Extract and validate response
            if not response or not response.text:
                raise LLMError("Empty response from LLM")
            
            response_text = response.text.strip()
            
            logger.info(
                f"Generated response in {processing_time:.2f}ms, "
                f"input_length={len(user_message)}, "
                f"output_length={len(response_text)}"
            )
            
            return response_text
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}")
            raise LLMError(f"Failed to generate response: {str(e)}")
    
    def _build_conversation_context(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        system_prompt: Optional[str] = None
    ) -> str:
        """Build conversation context for the LLM"""
        
        # Use custom system prompt or default
        prompt = system_prompt or LLMConstants.DEFAULT_SYSTEM_PROMPT
        
        context_parts = [f"System: {prompt}"]
        
        # Add conversation history (limit to prevent context overflow)
        max_history = self.settings.max_conversation_length
        recent_history = conversation_history[-max_history:] if len(conversation_history) > max_history else conversation_history
        
        for message in recent_history:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            if role == "user":
                context_parts.append(f"User: {content}")
            elif role == "assistant":
                context_parts.append(f"Assistant: {content}")
        
        # Add current user message
        context_parts.append(f"User: {user_message}")
        context_parts.append("Assistant:")
        
        return "\n\n".join(context_parts)
    
    async def health_check(self) -> Dict[str, Any]:
        """Check LLM service health"""
        try:
            # Simple test generation
            test_response = await self.generate_response(
                "Hello, are you working?",
                conversation_history=[],
                system_prompt="Respond with 'Yes, I am working correctly.'"
            )
            
            is_healthy = bool(test_response and len(test_response) > 0)
            
            return {
                "status": "healthy" if is_healthy else "unhealthy",
                "model": self.model_name,
                "response_received": is_healthy,
                "test_response_length": len(test_response) if test_response else 0,
            }
            
        except Exception as e:
            logger.error(f"LLM health check failed: {e}")
            return {
                "status": "unhealthy",
                "model": self.model_name,
                "error": str(e),
            }
    
    def get_capabilities(self) -> Dict[str, Any]:
        """Get LLM service capabilities"""
        return {
            "supported_models": [self.model_name],
            "max_message_length": self.settings.max_message_length,
            "max_conversation_length": self.settings.max_conversation_length,
            "features": [
                "text_generation",
                "conversation_context",
                "safety_filtering",
                "custom_system_prompts",
            ],
        }


# Singleton instance
llm_service = LLMService()
