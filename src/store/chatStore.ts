import { useState, useEffect, useCallback } from 'react';
import type { Conversation, ChatStore, Message } from '../types';
import { createErrorMessage, generateId } from '../utils/common';

interface StoredConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

interface StoredMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

/**
 * Simple localStorage operations without React Query overhead
 */
class LocalStorageService {
  private readonly storageKey = 'chatbot9000-conversations';

  async getConversations(): Promise<Conversation[]> {
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const conversations = JSON.parse(stored) as StoredConversation[];
      return conversations.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: this.deduplicateMessages(conv.messages.map((msg: StoredMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      }));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  async saveConversations(conversations: Conversation[]): Promise<void> {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
      throw error;
    }
  }

  async createConversation(initialMessage?: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: generateId(),
      title: initialMessage ? 
        (initialMessage.length > 50 ? initialMessage.substring(0, 47) + '...' : initialMessage) :
        'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const conversations = await this.getConversations();
    const updated = [conversation, ...conversations];
    await this.saveConversations(updated);
    
    return conversation;
  }

  async updateConversationTitle(id: string, title: string): Promise<Conversation> {
    const conversations = await this.getConversations();
    const conversation = conversations.find(conv => conv.id === id);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    const updatedConversation: Conversation = {
      ...conversation,
      title: title.trim(),
      updatedAt: new Date()
    };

    const updated = conversations.map(conv => 
      conv.id === id ? updatedConversation : conv
    );
    
    await this.saveConversations(updated);
    return updatedConversation;
  }

  async deleteConversation(id: string): Promise<void> {
    const conversations = await this.getConversations();
    const filtered = conversations.filter(conv => conv.id !== id);
    await this.saveConversations(filtered);
  }

  async clearConversations(): Promise<void> {
    window.localStorage.removeItem(this.storageKey);
  }

  async removeMessageFromConversation(conversationId: string, messageId: string): Promise<Conversation | null> {
    const conversations = await this.getConversations();
    const conversation = conversations.find(conv => conv.id === conversationId);
    
    if (!conversation) {
      return null;
    }

    const updatedMessages = conversation.messages.filter(msg => msg.id !== messageId);
    const updatedConversation: Conversation = {
      ...conversation,
      messages: updatedMessages,
      updatedAt: new Date()
    };

    const updated = conversations.map(conv => 
      conv.id === conversationId ? updatedConversation : conv
    );
    
    await this.saveConversations(updated);
    return updatedConversation;
  }

  private deduplicateMessages(messages: Message[]): Message[] {
    const seen = new Map<string, boolean>();
    const deduplicated: Message[] = [];
    
    for (const message of messages) {
      const key = `${message.role}-${message.content}-${message.timestamp.getTime()}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        deduplicated.push(message);
      }
    }
    
    return deduplicated;
  }
}

const storageService = new LocalStorageService();

/**
 * Simplified chat store using React state for localStorage operations
 * No React Query overhead for local data management
 */
export const useChatStore = (): ChatStore => {
  const [conversations, setConversations] = useState<readonly Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedConversations = await storageService.getConversations();
        setConversations(loadedConversations);
      } catch (err) {
        setError(createErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (initialMessage?: string): Promise<Conversation> => {
    try {
      const newConversation = await storageService.createConversation(initialMessage);
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      const error = createErrorMessage(err);
      setError(error);
      throw new Error(error);
    }
  }, []);

  // Update a conversation in both state and localStorage
  const updateConversation = useCallback(async (updatedConv: Conversation): Promise<void> => {
    try {
      // Update localStorage
      await storageService.saveConversations(
        conversations.map(conv => 
          conv.id === updatedConv.id ? updatedConv : conv
        )
      );
      
      // Update state
      setConversations(prev => 
        prev.map(conv => conv.id === updatedConv.id ? updatedConv : conv)
      );
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, [conversations]);

  // Update conversation title
  const updateConversationTitle = useCallback(async (id: string, title: string): Promise<void> => {
    try {
      const updatedConversation = await storageService.updateConversationTitle(id, title);
      setConversations(prev => 
        prev.map(conv => conv.id === id ? updatedConversation : conv)
      );
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    try {
      await storageService.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  // Clear all conversations
  const clearHistory = useCallback(async (): Promise<void> => {
    try {
      await storageService.clearConversations();
      setConversations([]);
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  // Remove a specific message from a conversation
  const removeMessage = useCallback(async (conversationId: string, messageId: string): Promise<void> => {
    try {
      const updatedConversation = await storageService.removeMessageFromConversation(conversationId, messageId);
      if (updatedConversation) {
        setConversations(prev => 
          prev.map(conv => conv.id === conversationId ? updatedConversation : conv)
        );
      }
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  return {
    conversations,
    isLoading,
    error,
    createConversation,
    updateConversation,
    updateConversationTitle,
    deleteConversation,
    clearHistory,
    removeMessage,
  };
};
