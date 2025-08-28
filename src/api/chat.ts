import type { 
  Message, 
  Conversation, 
  MessageRole
} from '../types';
import { createErrorMessage, generateId } from '../utils/common';

/**
 * Simple chat response from the LLM proxy backend
 */
interface ChatProxyResponse {
  response: string;
  processing_time_ms: number;
}

/**
 * Simple chat request to the LLM proxy backend
 */
interface ChatProxyRequest {
  message: string;
  system_prompt?: string;
}

/**
 * Mutable versions for internal manipulation
 */
interface MutableMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
}

interface MutableConversation {
  id: string;
  title: string;
  messages: MutableMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chat service that combines localStorage persistence with LLM proxy backend
 */
export class ChatApiService {
  private readonly baseURL: string;
  private readonly storageKey = 'chatbot9000-conversations';

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  /**
   * Make an HTTP request to the LLM proxy backend
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw new Error(`API request failed: ${createErrorMessage(error)}`);
    }
  }

  /**
   * Load conversations from localStorage
   */
  private loadConversations(): MutableConversation[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const conversations = JSON.parse(stored) as MutableConversation[];
      return conversations.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: this.deduplicateMessages(conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      }));
    } catch (error) {
      console.error('Failed to load conversations from localStorage:', error);
      return [];
    }
  }

  /**
   * Remove duplicate messages that might exist from previous bugs
   */
  private deduplicateMessages(messages: MutableMessage[]): MutableMessage[] {
    const seen = new Map<string, boolean>();
    const deduplicated: MutableMessage[] = [];
    
    for (const message of messages) {
      // Create a key based on content, role, and timestamp to identify duplicates
      const key = `${message.role}-${message.content}-${message.timestamp.getTime()}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        deduplicated.push(message);
      }
    }
    
    return deduplicated;
  }

  /**
   * Save conversations to localStorage
   */
  private storeConversations(conversations: MutableConversation[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations to localStorage:', error);
    }
  }

  /**
   * Convert mutable conversation to readonly conversation
   */
  private toReadonlyConversation(conv: MutableConversation): Conversation {
    return {
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp
      })),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    };
  }

  /**
   * Get LLM response from the backend proxy
   */
  private async getLLMResponse(message: string, systemPrompt?: string): Promise<string> {
    const requestData: ChatProxyRequest = {
      message,
      ...(systemPrompt && { system_prompt: systemPrompt })
    };

    const response = await this.request<ChatProxyResponse>('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    return response.response;
  }

  /**
   * Add a user message to a conversation in localStorage
   */
  async addUserMessage(userMessage: Message, conversationId: string): Promise<Message> {
    const conversations = this.loadConversations();
    const conversation = conversations.find(conv => conv.id === conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Convert to mutable message for storage
    const mutableUserMessage: MutableMessage = {
      id: userMessage.id,
      role: userMessage.role,
      content: userMessage.content,
      timestamp: userMessage.timestamp
    };

    // Add to conversation
    conversation.messages.push(mutableUserMessage);
    conversation.updatedAt = new Date();
    
    // Save to localStorage
    this.storeConversations(conversations);
    
    return userMessage;
  }

  /**
   * Send a message and get AI response (user message should be handled by the frontend)
   */
  async sendMessage(content: string, conversationId?: string): Promise<Message> {
    // Get AI response from backend
    const aiResponse = await this.getLLMResponse(content);
    
    // Create AI message
    const aiMessage: MutableMessage = {
      id: generateId(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };

    // If conversationId provided, save the AI message to localStorage
    if (conversationId) {
      const conversations = this.loadConversations();
      const conversation = conversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        conversation.messages.push(aiMessage);
        conversation.updatedAt = new Date();
        this.storeConversations(conversations);
      }
    }
    
    return aiMessage;
  }

  /**
   * Get all conversations
   */
  async getConversations(): Promise<readonly Conversation[]> {
    const conversations = this.loadConversations();
    return conversations.map(conv => this.toReadonlyConversation(conv));
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(id: string): Promise<Conversation | null> {
    const conversations = this.loadConversations();
    const conversation = conversations.find(conv => conv.id === id);
    return conversation ? this.toReadonlyConversation(conversation) : null;
  }

  /**
   * Create a new conversation
   */
  async createConversation(initialMessage?: string): Promise<Conversation> {
    const conversation: MutableConversation = {
      id: generateId(),
      title: initialMessage ? 
        (initialMessage.length > 50 ? initialMessage.substring(0, 47) + '...' : initialMessage) :
        'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const conversations = this.loadConversations();
    conversations.push(conversation);
    this.storeConversations(conversations);

    // If initial message provided, send it
    if (initialMessage) {
      await this.sendMessage(initialMessage, conversation.id);
      // Return updated conversation
      const updated = await this.getConversation(conversation.id);
      return updated || this.toReadonlyConversation(conversation);
    }

    return this.toReadonlyConversation(conversation);
  }

  /**
   * Update a conversation (rename)
   */
  async updateConversation(updatedConversation: Conversation): Promise<Conversation> {
    const conversations = this.loadConversations();
    const index = conversations.findIndex(conv => conv.id === updatedConversation.id);
    
    if (index === -1) {
      throw new Error('Conversation not found');
    }
    
    conversations[index] = {
      ...conversations[index],
      title: updatedConversation.title,
      updatedAt: new Date()
    };
    
    this.storeConversations(conversations);
    return this.toReadonlyConversation(conversations[index]);
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(id: string, title: string): Promise<Conversation> {
    const conversations = this.loadConversations();
    const conversation = conversations.find(conv => conv.id === id);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    conversation.title = title;
    conversation.updatedAt = new Date();
    
    this.storeConversations(conversations);
    return this.toReadonlyConversation(conversation);
  }

  /**
   * Delete a specific conversation
   */
  async deleteConversation(id: string): Promise<void> {
    const conversations = this.loadConversations();
    const filteredConversations = conversations.filter(conv => conv.id !== id);
    this.storeConversations(filteredConversations);
  }

  /**
   * Save conversations to storage (for compatibility)
   */
  async saveConversations(conversations: readonly Conversation[]): Promise<void> {
    const mutableConversations: MutableConversation[] = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp
      })),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));
    this.storeConversations(mutableConversations);
  }

  /**
   * Clear all conversations
   */
  async clearConversations(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/v1/health');
  }
}

// Create singleton instance
const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const chatApiService = new ChatApiService(backendURL);
