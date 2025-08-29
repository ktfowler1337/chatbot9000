/**
 * Core domain types for the chat application
 */

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook return types
 */
export interface ChatStore {
  conversations: readonly Conversation[];
  isLoading: boolean;
  error: string | null;
  createConversation: (initialMessage?: string) => Promise<Conversation>;
  updateConversation: (conversation: Conversation) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeMessage: (conversationId: string, messageId: string) => Promise<void>;
}