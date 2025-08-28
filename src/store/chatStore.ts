import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation, ChatStore } from '../types';
import { QUERY_KEYS } from '../constants/app';
import { chatApiService } from '../api/chat';
import { createErrorMessage } from '../utils/common';

/**
 * Custom hook for managing chat store state with React Query and localStorage
 */
export const useChatStore = (): ChatStore => {
  const queryClient = useQueryClient();

  // Query for fetching conversations from localStorage
  const {
    data: conversations = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: QUERY_KEYS.CONVERSATIONS,
    queryFn: () => chatApiService.getConversations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Mutation for updating conversation title
  const { mutate: updateTitleMutation } = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      return chatApiService.updateConversationTitle(id, title);
    },
    onSuccess: (updatedConversation) => {
      // Update the conversation in the list
      const updatedConversations = conversations.map((conv) =>
        conv.id === updatedConversation.id ? updatedConversation : conv
      );
      queryClient.setQueryData(QUERY_KEYS.CONVERSATIONS, updatedConversations);
    },
    onError: (error) => {
      console.error('Failed to update conversation title:', error);
    },
  });

  // Mutation for deleting a conversation
  const { mutate: deleteConversationMutation } = useMutation({
    mutationFn: async (id: string) => {
      await chatApiService.deleteConversation(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove the conversation from the list
      const updatedConversations = conversations.filter(conv => conv.id !== deletedId);
      queryClient.setQueryData(QUERY_KEYS.CONVERSATIONS, updatedConversations);
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error);
    },
  });

  // Mutation for clearing all conversations
  const { mutate: clearConversationsMutation } = useMutation({
    mutationFn: () => chatApiService.clearConversations(),
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.CONVERSATIONS, []);
    },
    onError: (error) => {
      console.error('Failed to clear conversations:', error);
    },
  });

  const updateConversation = (updatedConv: Conversation): void => {
    // For localStorage backend, we primarily update through specific mutations
    // This method is kept for compatibility but may not be used much
    const updatedConversations = conversations.map((conv) =>
      conv.id === updatedConv.id ? updatedConv : conv
    );
    queryClient.setQueryData(QUERY_KEYS.CONVERSATIONS, updatedConversations);
  };

  const updateConversationTitle = (id: string, title: string): void => {
    updateTitleMutation({ id, title: title.trim() });
  };

  const deleteConversation = (id: string): void => {
    deleteConversationMutation(id);
  };

  const clearHistory = (): void => {
    clearConversationsMutation();
  };

  const error = queryError ? createErrorMessage(queryError) : null;

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
