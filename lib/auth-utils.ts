/**
 * Utility functions for authentication flow
 */

/**
 * Sets up a user profile after authentication
 * This should be called only once per authentication flow
 */
export async function setupUserProfile(origin?: string) {
  try {
    const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : '');
    const response = await fetch(`${baseUrl}/api/auth/setup-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.warn("[AUTH] Profile setup warning:", await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[AUTH] Profile setup error:", error);
    return false;
  }
}
