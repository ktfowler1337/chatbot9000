import { useState, useEffect, useCallback } from 'react';
import type { Conversation } from '../types';
import { chatApiService } from '../api/chat';
import { createErrorMessage } from '../utils/common';

/**
 * Simple chat store using React state for localStorage operations
 * No React Query needed since we're only dealing with local data
 */
export const useSimpleChatStore = () => {
  const [conversations, setConversations] = useState<readonly Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedConversations = await chatApiService.getConversations();
        setConversations(loadedConversations);
      } catch (err) {
        setError(createErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Add or update a conversation
  const updateConversation = useCallback((updatedConv: Conversation) => {
    setConversations(prev => {
      const exists = prev.some(conv => conv.id === updatedConv.id);
      if (exists) {
        return prev.map(conv => conv.id === updatedConv.id ? updatedConv : conv);
      } else {
        return [updatedConv, ...prev];
      }
    });
  }, []);

  // Update conversation title
  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      const updatedConversation = await chatApiService.updateConversationTitle(id, title.trim());
      setConversations(prev => 
        prev.map(conv => conv.id === id ? updatedConversation : conv)
      );
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await chatApiService.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  // Clear all conversations
  const clearHistory = useCallback(async () => {
    try {
      await chatApiService.clearConversations();
      setConversations([]);
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  return {
    conversations,
    isLoading,
    error,
    updateConversation,
    updateConversationTitle,
    deleteConversation,
    clearHistory,
  };
};
