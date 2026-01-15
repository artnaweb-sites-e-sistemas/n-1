/**
 * Environment variables helper
 * Validates required environment variables and provides safe access
 */

/**
 * Get API base URL from environment variable
 * Throws error only in runtime (not build time) if missing
 * @returns {string} API base URL
 */
export function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!apiBaseUrl || apiBaseUrl.trim() === '') {
    const errorMessage = 
      'NEXT_PUBLIC_API_BASE_URL is required but not set. ' +
      'Please set it in your environment variables. ' +
      'Example: NEXT_PUBLIC_API_BASE_URL=https://n-1.artnaweb.com.br/wp-json/n1/v1';
    
    // Only throw error in runtime (client-side), not during build
    if (typeof window !== 'undefined') {
      console.error(`[ENV ERROR] ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // During build, return a fallback to prevent build failure
    // This will be caught at runtime
    return 'https://n-1.artnaweb.com.br/wp-json/n1/v1';
  }
  
  return apiBaseUrl;
}

/**
 * Get WordPress URL from environment variable
 * @returns {string|undefined} WordPress URL or undefined
 */
export function getWordPressUrl() {
  return process.env.NEXT_PUBLIC_WORDPRESS_URL;
}

/**
 * Get Stripe public key from environment variable
 * @returns {string|undefined} Stripe key or undefined
 */
export function getStripeKey() {
  return process.env.NEXT_PUBLIC_STRIPE_KEY;
}

// Export functions instead of executing them at import time
// This allows the build to complete even if env vars are missing
// The functions will be called at runtime when needed
export function API_BASE_URL() {
  return getApiBaseUrl();
}

export function WORDPRESS_URL() {
  return getWordPressUrl();
}

export function STRIPE_KEY() {
  return getStripeKey();
}

