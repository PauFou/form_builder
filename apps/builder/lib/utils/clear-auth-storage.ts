/**
 * Utility to clear authentication storage
 * This can help resolve issues with corrupted localStorage data
 */
export function clearAuthStorage() {
  if (typeof window === "undefined") return;

  try {
    // Clear auth-related localStorage items
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth-storage");

    // Clear auth cookie
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    console.log("Auth storage cleared successfully");
  } catch (error) {
    console.error("Error clearing auth storage:", error);
  }
}

/**
 * Check if auth storage is valid
 */
export function validateAuthStorage() {
  if (typeof window === "undefined") return true;

  try {
    // Check if auth-storage can be parsed
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      JSON.parse(authStorage);
    }

    // Check tokens
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    // Basic validation - tokens should be strings
    if (accessToken && typeof accessToken !== "string") return false;
    if (refreshToken && typeof refreshToken !== "string") return false;

    return true;
  } catch (error) {
    console.error("Auth storage validation failed:", error);
    return false;
  }
}

/**
 * Safe storage getter with error handling
 */
export function safeGetFromStorage(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return null;
  }
}

/**
 * Safe storage setter with error handling
 */
export function safeSetToStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting ${key} to storage:`, error);
    return false;
  }
}
