import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Message } from '../types';
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
 * Direct localStorage operations without API service abstraction
 */
class LocalChatStorage {
  private readonly storageKey = 'chatbot9000-conversations';

  async getConversations(): Promise<readonly Conversation[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
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

  async saveConversations(conversations: readonly Conversation[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
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

  async updateConversation(updatedConversation: Conversation): Promise<Conversation> {
    const conversations = await this.getConversations();
    const updated = conversations.map(conv => 
      conv.id === updatedConversation.id ? updatedConversation : conv
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
    localStorage.removeItem(this.storageKey);
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

const storage = new LocalChatStorage();

/**
 * Simple, efficient chat store using only React state + localStorage
 * No React Query overhead for local operations
 */
export const useLocalChatStore = () => {
  const [conversations, setConversations] = useState<readonly Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedConversations = await storage.getConversations();
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
      const newConversation = await storage.createConversation(initialMessage);
      setConversations(prev => [newConversation, ...prev]);
      return newConversation;
    } catch (err) {
      const error = createErrorMessage(err);
      setError(error);
      throw new Error(error);
    }
  }, []);

  // Add or update a conversation
  const updateConversation = useCallback(async (updatedConv: Conversation) => {
    try {
      await storage.updateConversation(updatedConv);
      setConversations(prev => 
        prev.map(conv => conv.id === updatedConv.id ? updatedConv : conv)
      );
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  // Update conversation title
  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      const conversation = conversations.find(conv => conv.id === id);
      if (!conversation) throw new Error('Conversation not found');

      const updatedConversation: Conversation = {
        ...conversation,
        title: title.trim(),
        updatedAt: new Date()
      };

      await updateConversation(updatedConversation);
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, [conversations, updateConversation]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await storage.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  // Clear all conversations
  const clearHistory = useCallback(async () => {
    try {
      await storage.clearConversations();
      setConversations([]);
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, []);

  // Add a message to a conversation
  const addMessageToConversation = useCallback(async (conversationId: string, message: Message) => {
    try {
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (!conversation) throw new Error('Conversation not found');

      const updatedConversation: Conversation = {
        ...conversation,
        messages: [...conversation.messages, message],
        updatedAt: new Date()
      };

      await updateConversation(updatedConversation);
    } catch (err) {
      setError(createErrorMessage(err));
    }
  }, [conversations, updateConversation]);

  return {
    conversations,
    isLoading,
    error,
    createConversation,
    updateConversation,
    updateConversationTitle,
    deleteConversation,
    clearHistory,
    addMessageToConversation,
  };
};
