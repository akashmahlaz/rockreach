/**
 * Fetch with automatic retry logic for network resilience
 * Implements exponential backoff with jitter
 */

interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error, attempt) => {
      // Retry on network errors or 5xx status codes
      const isNetworkError = error.message.includes('fetch') || 
                            error.message.includes('network') ||
                            error.message.includes('Failed to parse URL');
      return isNetworkError && attempt < maxRetries;
    },
    ...fetchOptions
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      
      // If we get a 5xx error and should retry, throw to trigger retry
      if (response.status >= 500 && attempt < maxRetries) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry
      if (!shouldRetry(lastError, attempt)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
      const delay = exponentialDelay + jitter;
      
      console.warn(`Fetch attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`, lastError.message);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  throw lastError!;
}

/**
 * Wrapper for fetch with built-in timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Combined fetch with retry and timeout
 */
export async function fetchRobust(
  url: string,
  options: FetchWithRetryOptions & { timeout?: number } = {}
): Promise<Response> {
  const { maxRetries, baseDelay, maxDelay, shouldRetry, ...fetchOptions } = options;
  
  return fetchWithRetry(url, {
    ...fetchOptions,
    maxRetries,
    baseDelay,
    maxDelay,
    shouldRetry,
  });
}
