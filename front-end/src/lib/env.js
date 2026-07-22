/**
 * Environment variables helper
 * Validates required environment variables and provides safe access
 */

/**
 * Get API base URL
 * - Browser: relative proxy `/wp-api` (same-origin → Next rewrite → WordPress; sem CORS)
 * - Server (SSR / route handlers): URL absoluta de NEXT_PUBLIC_API_BASE_URL
 * @returns {string} API base URL
 */
export function getApiBaseUrl() {
  // Navegador: proxy same-origin (next.config rewrites /wp-api → WordPress)
  if (typeof window !== 'undefined') {
    return '/wp-api';
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl || apiBaseUrl.trim() === '') {
    const errorMessage =
      'NEXT_PUBLIC_API_BASE_URL is required but not set. ' +
      'Please set it in your environment variables. ' +
      'Example: NEXT_PUBLIC_API_BASE_URL=https://adminloja.n-1edicoes.org/wp-json/n1/v1';

    // Build-time / server sem env: fallback para não quebrar o build
    console.error(`[ENV ERROR] ${errorMessage}`);
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
