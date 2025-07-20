// Comprehensive error handling utilities for AI service failures

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Error codes and their properties
export const ERROR_CODES = {
  // OpenAI related errors
  OPENAI_RATE_LIMIT: {
    message: 'OpenAI API rate limit exceeded. Please try again later.',
    retryable: true,
    statusCode: 429,
  },
  OPENAI_AUTH_ERROR: {
    message: 'OpenAI API authentication failed',
    retryable: false,
    statusCode: 401,
  },
  OPENAI_SERVER_ERROR: {
    message: 'OpenAI service temporarily unavailable',
    retryable: true,
    statusCode: 503,
  },
  OPENAI_API_ERROR: {
    message: 'OpenAI API error occurred',
    retryable: false,
    statusCode: 400,
  },
  NO_RESPONSE: {
    message: 'No response received from AI service',
    retryable: true,
    statusCode: 503,
  },
  INVALID_FORMAT: {
    message: 'AI service returned invalid response format',
    retryable: true,
    statusCode: 502,
  },
  INVALID_MODULE_COUNT: {
    message: 'AI service did not generate exactly 5 modules',
    retryable: true,
    statusCode: 502,
  },
  PARSE_ERROR: {
    message: 'Failed to parse AI service response',
    retryable: true,
    statusCode: 502,
  },
  NETWORK_ERROR: {
    message: 'Network error connecting to AI service',
    retryable: true,
    statusCode: 503,
  },

  // Content processing errors
  INVALID_URL: {
    message: 'Invalid Twitter/X URL format',
    retryable: false,
    statusCode: 400,
  },
  INVALID_TWEET_ID: {
    message: 'Could not extract tweet ID from URL',
    retryable: false,
    statusCode: 400,
  },
  TWEET_EXTRACTION_NOT_IMPLEMENTED: {
    message: 'Tweet content extraction is not yet implemented. Please copy and paste the tweet content manually.',
    retryable: false,
    statusCode: 501,
  },
  EMPTY_CONTENT: {
    message: 'Content cannot be empty',
    retryable: false,
    statusCode: 400,
  },
  CONTENT_TOO_SHORT: {
    message: 'Content is too short. Please provide at least 10 characters.',
    retryable: false,
    statusCode: 400,
  },
  CONTENT_TOO_LONG: {
    message: 'Content is too long. Please limit to 10,000 characters.',
    retryable: false,
    statusCode: 400,
  },
  MIXED_CONTENT_TYPE: {
    message: 'Please provide either a tweet URL only, or paste the tweet content as text.',
    retryable: false,
    statusCode: 400,
  },
  EMPTY_INPUT: {
    message: 'Input cannot be empty',
    retryable: false,
    statusCode: 400,
  },

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: {
    message: 'Rate limit exceeded. Please try again later.',
    retryable: true,
    statusCode: 429,
  },

  // User and subscription errors
  USAGE_LIMIT_EXCEEDED: {
    message: 'Usage limit exceeded for your current plan',
    retryable: false,
    statusCode: 403,
  },
  MISSING_CONTENT: {
    message: 'Content is required',
    retryable: false,
    statusCode: 400,
  },

  // Database errors
  DATABASE_ERROR: {
    message: 'Database operation failed',
    retryable: true,
    statusCode: 500,
  },

  // Generic errors
  INTERNAL_ERROR: {
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
    statusCode: 500,
  },
  METHOD_NOT_ALLOWED: {
    message: 'HTTP method not supported',
    retryable: false,
    statusCode: 405,
  },
  UNKNOWN_ERROR: {
    message: 'An unknown error occurred',
    retryable: true,
    statusCode: 500,
  },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// Create standardized error response
export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, any>
): ErrorResponse {
  const errorConfig = ERROR_CODES[code];
  
  return {
    success: false,
    error: {
      code,
      message: customMessage || errorConfig.message,
      details,
      retryable: errorConfig.retryable,
    },
  };
}

// Create success response
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

// Get HTTP status code for error
export function getErrorStatusCode(code: ErrorCode): number {
  return ERROR_CODES[code]?.statusCode || 500;
}

// Retry configuration for different error types
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'OPENAI_RATE_LIMIT',
    'OPENAI_SERVER_ERROR',
    'NO_RESPONSE',
    'INVALID_FORMAT',
    'INVALID_MODULE_COUNT',
    'PARSE_ERROR',
    'NETWORK_ERROR',
    'RATE_LIMIT_EXCEEDED',
    'DATABASE_ERROR',
    'INTERNAL_ERROR',
    'UNKNOWN_ERROR',
  ] as ErrorCode[],
};

// Retry function with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  errorCode?: ErrorCode,
  maxRetries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if this is the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry if error is not retryable
      if (errorCode && !RETRY_CONFIG.retryableErrors.includes(errorCode)) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError;
}

// Log error for monitoring
export function logError(error: Error, context?: Record<string, any>): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  };
  
  console.error('Application Error:', JSON.stringify(errorLog, null, 2));
  
  // In production, you might want to send this to a monitoring service
  // like Sentry, LogRocket, or similar
}

// Sanitize error for client response (remove sensitive information)
export function sanitizeError(error: any): ErrorResponse {
  // If it's already a properly formatted error response, return it
  if (error && typeof error === 'object' && 'success' in error && error.success === false) {
    return error as ErrorResponse;
  }
  
  // If it's a known error type, create proper response
  if (error && error.code && ERROR_CODES[error.code as ErrorCode]) {
    return createErrorResponse(error.code as ErrorCode, error.message);
  }
  
  // For unknown errors, return generic error without exposing internals
  return createErrorResponse('INTERNAL_ERROR');
}

// Validate API response structure
export function isValidApiResponse<T>(response: any): response is ApiResponse<T> {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  if (response.success === true) {
    return 'data' in response;
  }
  
  if (response.success === false) {
    return (
      'error' in response &&
      typeof response.error === 'object' &&
      'code' in response.error &&
      'message' in response.error &&
      'retryable' in response.error
    );
  }
  
  return false;
}