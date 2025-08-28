import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import type { Conversation, Message, SendMessageMutation } from '../types';
import { QUERY_KEYS } from '../constants/app';
import { chatApiService } from '../api/chat';
import { validateMessage, validateConversationId } from '../utils/common';

/**
 * Hook for sending messages in a conversation using localStorage + backend proxy
 */
export const useSendMessage = (conversationId: string): SendMessageMutation => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (content: string): Promise<Message> => {
      // Validate inputs
      if (!validateConversationId(conversationId)) {
        throw new Error('Invalid conversation ID');
      }
      if (!validateMessage(content)) {
        throw new Error('Message content is invalid or too long');
      }

      // Get current conversation data
      const conversations = queryClient.getQueryData<readonly Conversation[]>(QUERY_KEYS.CONVERSATIONS) || [];
      const conversation = conversations.find(conv => conv.id === conversationId);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Create user message for immediate display (optimistic update)
      const userMessage: Message = {
        id: nanoid(),
        content: content.trim(),
        role: 'user',
        timestamp: new Date()
      };

      // Add user message to conversation immediately
      const conversationWithUserMessage: Conversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
        updatedAt: new Date()
      };

      // Update cache immediately so user sees their message right away
      queryClient.setQueryData<readonly Conversation[]>(QUERY_KEYS.CONVERSATIONS, (old = []) =>
        old.map(conv => 
          conv.id === conversationId ? conversationWithUserMessage : conv
        )
      );

      // Also update the individual conversation cache immediately
      queryClient.setQueryData([QUERY_KEYS.CONVERSATION, conversationId], conversationWithUserMessage);

      // Persist user message to localStorage (using the same message object)
      await chatApiService.addUserMessage(userMessage, conversationId);

      // Send message to backend to get AI response
      const aiMessage = await chatApiService.sendMessage(content.trim(), conversationId);

      // Add AI response to conversation
      const finalConversation: Conversation = {
        ...conversationWithUserMessage,
        messages: [...conversationWithUserMessage.messages, aiMessage],
        updatedAt: new Date()
      };

      // Update cache with AI response
      queryClient.setQueryData<readonly Conversation[]>(QUERY_KEYS.CONVERSATIONS, (old = []) =>
        old.map(conv => 
          conv.id === conversationId ? finalConversation : conv
        )
      );

      // Also update the individual conversation cache if it exists
      queryClient.setQueryData([QUERY_KEYS.CONVERSATION, conversationId], finalConversation);

      return aiMessage;
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONVERSATIONS });
    }
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * Hook for creating a new conversation using localStorage
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (initialMessage?: string) => {
      return chatApiService.createConversation(initialMessage);
    },
    onSuccess: (newConversation) => {
      // Add new conversation to the list
      queryClient.setQueryData<readonly Conversation[]>(QUERY_KEYS.CONVERSATIONS, (old = []) => 
        [newConversation, ...old]
      );
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
    }
  });
};

/**
 * Hook for getting a specific conversation with messages
 */
export const useConversation = (conversationId: string | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONVERSATION, conversationId],
    queryFn: () => {
      if (!conversationId) return null;
      return chatApiService.getConversation(conversationId);
    },
    enabled: !!conversationId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook for updating conversation title using localStorage
 */
export const useUpdateConversationTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, title }: { conversationId: string; title: string }) => {
      return chatApiService.updateConversationTitle(conversationId, title.trim());
    },
    onSuccess: (updatedConversation) => {
      // Update the conversation in the list
      queryClient.setQueryData<readonly Conversation[]>(QUERY_KEYS.CONVERSATIONS, (old = []) =>
        old.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        )
      );
      
      // Also update the individual conversation cache if it exists
      queryClient.setQueryData([QUERY_KEYS.CONVERSATION, updatedConversation.id], updatedConversation);
    },
    onError: (error) => {
      console.error('Failed to update conversation title:', error);
    }
  });
};

/**
 * Hook for deleting a conversation using localStorage
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await chatApiService.deleteConversation(conversationId);
      return conversationId;
    },
    onSuccess: (deletedId) => {
      // Remove conversation from the list
      queryClient.setQueryData<readonly Conversation[]>(QUERY_KEYS.CONVERSATIONS, (old = []) =>
        old?.filter(conv => conv.id !== deletedId) || []
      );
      
      // Remove individual conversation cache
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.CONVERSATION, deletedId] });
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error);
    }
  });
};
