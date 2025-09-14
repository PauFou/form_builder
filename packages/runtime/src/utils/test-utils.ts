/**
 * Test utilities for handling async operations in tests
 */

/**
 * Create a timer that can be mocked in tests
 */
export function createTimer(callback: () => void, delay: number): NodeJS.Timeout | number {
  if (process.env.NODE_ENV === "test") {
    // In tests, execute immediately to avoid act() warnings
    // Tests should use fake timers if they need to test timing
    Promise.resolve().then(callback);
    return 0;
  }
  return setTimeout(callback, delay);
}

/**
 * Clear a timer created with createTimer
 */
export function clearTimer(timer: NodeJS.Timeout | number): void {
  if (timer && typeof timer !== "number") {
    clearTimeout(timer);
  }
}
