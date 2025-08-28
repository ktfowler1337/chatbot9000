import type { Conversation, StoredConversation } from '../types';
import { STORAGE_KEYS } from '../constants/app';

/**
 * Service for handling localStorage operations
 */
export class StorageService {
  private static instance: StorageService;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Get conversations from localStorage
   */
  async getConversations(): Promise<readonly Conversation[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (!stored) return [];

      const parsed = JSON.parse(stored) as readonly StoredConversation[];
      return this.transformStoredConversations(parsed);
    } catch (error) {
      console.error('Error parsing stored conversations:', error);
      return [];
    }
  }

  /**
   * Save conversations to localStorage
   */
  async saveConversations(conversations: readonly Conversation[]): Promise<void> {
    try {
      const storedConversations = this.transformConversationsForStorage(conversations);
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(storedConversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
      throw new Error('Failed to save conversations');
    }
  }

  /**
   * Clear all conversations from localStorage
   */
  async clearConversations(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw new Error('Failed to clear conversations');
    }
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(id: string): Promise<Conversation | null> {
    const conversations = await this.getConversations();
    return conversations.find(conv => conv.id === id) || null;
  }

  /**
   * Transform stored conversations to domain objects
   */
  private transformStoredConversations(stored: readonly StoredConversation[]): readonly Conversation[] {
    return stored.map(conv => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  }

  /**
   * Transform domain objects for storage
   */
  private transformConversationsForStorage(conversations: readonly Conversation[]): readonly StoredConversation[] {
    return conversations.map(conv => ({
      ...conv,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messages: conv.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
    }));
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
