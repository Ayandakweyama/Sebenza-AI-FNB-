// Configuration for LangChain and AI services

// Default model configuration
export const DEFAULT_MODEL = 'gpt-4';

// Temperature settings for different use cases
export const TEMPERATURE = {
  CREATIVE: 0.8,    // For generating content
  BALANCED: 0.5,    // For general tasks
  PRECISE: 0.2,     // For factual responses
};

// Maximum token limits
export const MAX_TOKENS = {
  SHORT: 500,      // For brief responses
  MEDIUM: 1000,     // For standard responses
  LONG: 2000,       // For detailed responses
};

// Cache settings
export const CACHE_CONFIG = {
  TTL: 60 * 60 * 24, // 24 hours in seconds
  PREFIX: 'ai_cache_',
};
