/**
 * Application-wide constants
 */

export const APP_CONFIG = {
  SIDEBAR_WIDTH: 280,
  MAX_MESSAGE_WIDTH: '80%',
  ANIMATION_DURATION: 0.3,
  SCROLL_BEHAVIOR: 'smooth' as const,
} as const;

export const STORAGE_KEYS = {
  CHAT_HISTORY: 'chatbot9000-chat-history',
  USER_PREFERENCES: 'user-preferences',
} as const;

export const QUERY_KEYS = {
  CONVERSATIONS: ['conversations'],
  CONVERSATION: 'conversation', // Base key for individual conversations
} as const;

export const AI_CONFIG = {
  MODEL: 'gemini-1.5-flash',
  SYSTEM_PROMPT: 'Keep the conversation upbeat.',
  DEFAULT_CONVERSATION_TITLE: 'New Chat',
} as const;

export const UI_MESSAGES = {
  NO_CONVERSATION_SELECTED: 'Select a conversation or start a new chat',
  CLEAR_HISTORY_TOOLTIP: 'Clear chat history',
  NEW_CHAT_TOOLTIP: 'Start new conversation',
  CLEAR_HISTORY_CONFIRM_TITLE: 'Clear Chat History',
  CLEAR_HISTORY_CONFIRM_MESSAGE: 'Are you sure you want to clear all chat history? This action cannot be undone.',
  DELETE_CONVERSATION_CONFIRM_TITLE: 'Delete Conversation',
  DELETE_CONVERSATION_CONFIRM_MESSAGE: 'Are you sure you want to delete this conversation? This action cannot be undone.',
} as const;
