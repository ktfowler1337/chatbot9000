/**
 * Validation utilities
 */

export const validateMessage = (content: string): boolean => {
  return content.trim().length > 0 && content.length <= 10000;
};

export const validateConversationTitle = (title: string): boolean => {
  const trimmed = title.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * ID generation utility
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Error handling utility
 */
export const createErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};
