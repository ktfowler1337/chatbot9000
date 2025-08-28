import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { Message } from '../types';
import { createErrorMessage, validateMessage } from '../utils/common';

/**
 * Simple message sending hook without React Query
 * Handles optimistic updates and AI responses
 */
export const useSimpleMessageSending = (
  onMessageAdded: (message: Message) => void
) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!validateMessage(content)) {
      setError(new Error('Message content is invalid or too long'));
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      // Create user message for immediate display (optimistic update)
      const userMessage: Message = {
        id: nanoid(),
        content: content.trim(),
        role: 'user',
        timestamp: new Date()
      };

      // Add user message immediately
      onMessageAdded(userMessage);

      // Send to backend for AI response
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Create AI message
      const aiMessage: Message = {
        id: nanoid(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };

      // Add AI response
      onMessageAdded(aiMessage);

    } catch (err) {
      const errorMessage = createErrorMessage(err);
      setError(new Error(errorMessage));
      console.error('Failed to send message:', err);
    } finally {
      setIsPending(false);
    }
  }, [onMessageAdded]);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    isPending,
    error,
    reset,
  };
};
