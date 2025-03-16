/**
 * Environment detection utilities
 */

/**
 * Check if code is running in a browser environment
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if code is running in a Node.js environment
 */
export const isNode = !isBrowser;

/**
 * Get information about the current environment
 * @returns Environment information object
 */
export function getEnvironmentInfo() {
  return {
    isBrowser,
    isNode,
    version: '0.1.0'
  };
}
