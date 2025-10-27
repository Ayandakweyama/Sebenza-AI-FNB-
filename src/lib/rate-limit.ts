import { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// In production, use Redis or a database for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

export function rateLimit(config: RateLimitConfig = {
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10, // 10 requests per minute
}) {
  return {
    check: async (request: NextRequest, limit?: number, token?: string) => {
      const identifier = token || getClientIdentifier(request);
      const tokenCount = limit || config.uniqueTokenPerInterval;
      const now = Date.now();
      
      const tokenData = rateLimitMap.get(identifier);
      
      if (!tokenData || now > tokenData.resetTime) {
        // Create new entry or reset existing one
        rateLimitMap.set(identifier, {
          count: 1,
          resetTime: now + config.interval,
        });
        
        // Clean up old entries periodically
        cleanupOldEntries(now);
        
        return { success: true, limit: tokenCount, remaining: tokenCount - 1, reset: new Date(now + config.interval) };
      }
      
      if (tokenData.count >= tokenCount) {
        return { 
          success: false, 
          limit: tokenCount, 
          remaining: 0, 
          reset: new Date(tokenData.resetTime),
          message: 'Rate limit exceeded. Please try again later.'
        };
      }
      
      tokenData.count++;
      rateLimitMap.set(identifier, tokenData);
      
      return { 
        success: true, 
        limit: tokenCount, 
        remaining: tokenCount - tokenData.count, 
        reset: new Date(tokenData.resetTime) 
      };
    },
  };
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from various sources
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;
  
  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

function cleanupOldEntries(now: number) {
  // Clean up entries older than 5 minutes
  const cleanupThreshold = now - (5 * 60 * 1000);
  
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < cleanupThreshold) {
      rateLimitMap.delete(key);
    }
  }
}

// Preset configurations for different API endpoints
export const rateLimiters = {
  // Strict limit for expensive operations
  scraping: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 5, // 5 requests per minute
  }),
  
  // Moderate limit for AI operations
  ai: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 requests per minute
  }),
  
  // Standard limit for general API calls
  api: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 requests per minute
  }),
  
  // Lenient limit for read operations
  read: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 requests per minute
  }),
};

// Helper function to create rate limit response
export function rateLimitResponse(message: string = 'Too many requests. Please try again later.') {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded',
      message,
      retryAfter: 60 // seconds
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );
}
