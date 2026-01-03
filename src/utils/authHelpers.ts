import { useAuth } from '@clerk/nextjs';

/**
 * Validates that a Clerk token is available and valid
 * @param getToken - Clerk's getToken function
 * @param maxRetries - Maximum number of retry attempts
 * @returns Valid token or null if unable to get token
 */
export async function getValidToken(
  getToken: () => Promise<string | null>,
  maxRetries: number = 3
): Promise<string | null> {
  let token: string | null = null;
  let retryCount = 0;

  while (retryCount < maxRetries && !token) {
    try {
      console.log(`🔄 Getting token, attempt ${retryCount + 1}/${maxRetries}...`);
      token = await getToken();
      
      if (!token) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Exponential backoff: 500ms, 1000ms, 2000ms
          const delay = Math.pow(2, retryCount - 1) * 500;
          console.log(`⚠️ Token is null, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else {
        console.log('✅ Token obtained successfully');
      }
    } catch (error) {
      console.error(`❌ Error getting token (attempt ${retryCount + 1}):`, error);
      retryCount++;
      
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount - 1) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  if (!token) {
    console.warn('❌ Failed to get valid token after all retries');
  }

  return token;
}

/**
 * Delays execution with exponential backoff
 * @param attempt - Current attempt number (0-based)
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function exponentialBackoff(attempt: number, baseDelay: number = 1000): Promise<void> {
  const delay = Math.pow(2, attempt) * baseDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Checks if authentication is ready and token is available
 * @param isLoaded - Clerk's isLoaded state
 * @param isSignedIn - Clerk's isSignedIn state
 * @param getToken - Clerk's getToken function
 * @returns Promise that resolves to true if auth is ready
 */
export async function isAuthReady(
  isLoaded: boolean,
  isSignedIn: boolean,
  getToken: () => Promise<string | null>
): Promise<boolean> {
  if (!isLoaded || !isSignedIn) {
    console.log('⚠️ Auth not ready:', { isLoaded, isSignedIn });
    return false;
  }

  const token = await getValidToken(getToken, 2); // Reduced retries for quick check
  return !!token;
}
