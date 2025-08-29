import { useState, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAISendMessage } from './useAISendMessage';
import type { Conversation, Message } from '../types';

/**
 * Helper function to add a message to a conversation
 */
const addToConversation = async (
  message: Message, 
  selectedConversation: Conversation | undefined, 
  updateConversation: (conv: Conversation) => Promise<void>
) => {
  if (selectedConversation) {
    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      updatedAt: new Date()
    };
    await updateConversation(updatedConversation);
  }
};

/**
 * Hook for managing conversation state and operations
 */
export function useConversationManager() {
  const [selectedId, setSelectedId] = useState<string>();
  
  const { 
    conversations, 
    isLoading: storeLoading, 
    error: storeError,
    createConversation,
    updateConversation,
    updateConversationTitle,
    deleteConversation,
    clearHistory,
    removeMessage
  } = useChatStore();

  // Get the selected conversation from the conversations list
  const selectedConversation = selectedId ? conversations.find(conv => conv.id === selectedId) : undefined;

  // AI message sending integration
  const { 
    sendMessage: sendToAI, 
    isPending: isSending,
    error: sendError 
  } = useAISendMessage(
    async (userMessage: Message) => {
      await addToConversation(userMessage, selectedConversation, updateConversation);
    },
    async (aiMessage: Message) => {
      await addToConversation(aiMessage, selectedConversation, updateConversation);
    },
    // On error - remove the failed user message
    async (messageId: string) => {
      if (selectedConversation) {
        await removeMessage(selectedConversation.id, messageId);
      }
    }
  );

  // Event handlers
  const handleNewChat = useCallback(async () => {
    try {
      const newConversation = await createConversation();
      setSelectedId(newConversation.id);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }, [createConversation]);

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedId || !selectedConversation) {
      // If no conversation is selected, create a new one with this message
      try {
        const newConversation = await createConversation(content);
        setSelectedId(newConversation.id);
        // Send the message to AI after creating conversation
        sendToAI(content);
      } catch (error) {
        console.error('Failed to create conversation with message:', error);
      }
      return;
    }
    sendToAI(content);
  }, [selectedId, selectedConversation, sendToAI, createConversation]);

  const handleClearHistory = useCallback(async () => {
    setSelectedId(undefined);
    await clearHistory();
  }, [clearHistory]);

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    await updateConversationTitle(id, newTitle);
  }, [updateConversationTitle]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    // If the deleted conversation is currently selected, clear selection
    if (selectedId === id) {
      setSelectedId(undefined);
    }
    await deleteConversation(id);
  }, [deleteConversation, selectedId]);

  // Derived state
  const error = storeError;
  const isLoading = storeLoading || isSending;
  const showChatWindow = !!selectedConversation;

  return {
    // State
    conversations,
    selectedId,
    selectedConversation,
    isLoading,
    error,
    sendError,
    showChatWindow,
    storeLoading,
    
    // Actions
    handleNewChat,
    handleSelectConversation,
    handleSendMessage,
    handleClearHistory,
    handleRenameConversation,
    handleDeleteConversation,
  };
}
