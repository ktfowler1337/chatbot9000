/**
 * Core domain types for the chat application
 */

export type MessageRole = 'user' | 'assistant';

export interface Message {
  readonly id: string;
  readonly content: string;
  readonly role: MessageRole;
  readonly timestamp: Date;
}

export interface Conversation {
  readonly id: string;
  readonly title: string;
  readonly messages: readonly Message[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * API related types
 */
export interface CreateMessageRequest {
  readonly content: string;
  readonly conversationId: string;
}

export interface CreateMessageResponse {
  readonly message: Message;
  readonly conversation: Conversation;
}

/**
 * Storage related types
 */
export interface StoredConversation extends Omit<Conversation, 'createdAt' | 'updatedAt' | 'messages'> {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly messages: readonly StoredMessage[];
}

export interface StoredMessage extends Omit<Message, 'timestamp'> {
  readonly timestamp: string;
}

/**
 * Component prop types
 */
export interface ChatWindowProps {
  readonly messages: readonly Message[];
  readonly onSend: (message: string) => void;
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

export interface SidebarProps {
  readonly conversations: readonly Conversation[];
  readonly selectedId?: string;
  readonly onSelect: (id: string) => void;
  readonly onNew: () => void;
  readonly onClearHistory: () => void;
  readonly onRename: (id: string, newTitle: string) => void;
  readonly onDelete: (id: string) => void;
  readonly isLoading?: boolean;
}

export interface MessageBubbleProps {
  readonly message: Message;
}

export interface InputBarProps {
  readonly onSend: (message: string) => void;
  readonly isLoading?: boolean;
  readonly placeholder?: string;
}

/**
 * Hook return types
 */
export interface ChatStore {
  readonly conversations: readonly Conversation[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly updateConversation: (conversation: Conversation) => void;
  readonly updateConversationTitle: (id: string, title: string) => void;
  readonly deleteConversation: (id: string) => void;
  readonly clearHistory: () => void;
}

export interface SendMessageMutation {
  readonly mutate: (content: string) => void;
  readonly isPending: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
}

/**
 * Utility types
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Backend API Types
 */
export interface ChatRequest {
  readonly message: string;
  readonly conversation_id?: string;
  readonly system_prompt?: string;
}

export interface ChatResponse {
  readonly message: Message;
  readonly conversation: ConversationResponse;
  readonly processing_time_ms: number;
}

export interface ConversationResponse {
  readonly id: string;
  readonly title: string;
  readonly created_at: string; // ISO string from backend
  readonly updated_at: string; // ISO string from backend
  readonly message_count: number;
  readonly last_message_preview: string;
}

export interface ConversationDetail extends Omit<ConversationResponse, 'created_at' | 'updated_at'> {
  readonly created_at: string; // ISO string from backend
  readonly updated_at: string; // ISO string from backend
  readonly messages: readonly BackendMessage[];
}

export interface BackendMessage extends Omit<Message, 'timestamp'> {
  readonly timestamp: string; // ISO string from backend
}

export interface UpdateConversationRequest {
  readonly title: string;
}

export interface ErrorResponse {
  readonly error: string;
  readonly message: string;
}