import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { nanoid } from 'nanoid';
import type { Message } from '../types';
import { validateMessage } from '../utils/common';

/**
 * Hybrid approach: React Query for AI API calls, simple state for localStorage
 */
export const useAISendMessage = (
  onUserMessage: (message: Message) => void,
  onAIResponse: (message: Message) => void,
  onRemoveMessage?: (messageId: string) => void
) => {
  const currentUserMessageRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (content: string): Promise<Message> => {
      // Validate input
      if (!validateMessage(content)) {
        throw new Error('Message content is invalid or too long');
      }

      // Create and add user message immediately (optimistic update)
      const userMessage: Message = {
        id: nanoid(),
        content: content.trim(),
        role: 'user',
        timestamp: new Date()
      };
      
      // Track the current user message ID for potential rollback
      currentUserMessageRef.current = userMessage.id;
      onUserMessage(userMessage);

      // Send to AI backend using React Query (this is where React Query makes sense)
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

      return aiMessage;
    },
    onSuccess: (aiMessage) => {
      // Clear the tracked message since everything was successful
      currentUserMessageRef.current = null;
      // Add AI response to conversation
      onAIResponse(aiMessage);
    },
    onError: (error) => {
      console.error('Failed to get AI response:', error);
      // Remove the optimistically added user message if we have a way to do so
      if (currentUserMessageRef.current && onRemoveMessage) {
        onRemoveMessage(currentUserMessageRef.current);
      }
      currentUserMessageRef.current = null;
    }
  });

  return {
    sendMessage: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
