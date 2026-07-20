/**
 * Deduplicação de produtos do catálogo estático vs WooCommerce por SKU.
 * Regra: se o WooCommerce já tem o SKU, a cópia do catálogo deve ser ignorada.
 */

export function normalizeSku(sku) {
  if (sku == null) return '';
  return String(sku).trim();
}

export function buildWooSkuSet(wooProducts) {
  return new Set(
    (wooProducts || [])
      .map((p) => normalizeSku(p?.sku))
      .filter(Boolean)
  );
}

/**
 * Filtra itens do catálogo cujo SKU já existe no WooCommerce.
 * @returns {{ visible: array, hiddenCount: number }}
 */
export function filterCatalogByWooSkus(catalogProducts, wooSkus) {
  const skuSet =
    wooSkus instanceof Set ? wooSkus : buildWooSkuSet(wooSkus || []);

  let hiddenCount = 0;
  const visible = (catalogProducts || []).filter((product) => {
    const sku = normalizeSku(product?.sku);
    if (sku && skuSet.has(sku)) {
      hiddenCount += 1;
      return false;
    }
    return true;
  });

  return { visible, hiddenCount };
}

export function getWooApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://n-1.artnaweb.com.br/wp-json/n1/v1'
  );
}

/**
 * Busca produtos do WooCommerce (lista) para montar o Set de SKUs.
 * Em falha de rede/timeout, retorna lista vazia (fallback: catálogo completo).
 */
export async function fetchWooCommerceProducts({
  perPage = 100,
  timeoutMs = 5000,
  apiBaseUrl = getWooApiBaseUrl(),
} = {}) {
  let timeoutId = null;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${apiBaseUrl}/products?per_page=${perPage}&orderby=date&order=DESC&_t=${Date.now()}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      return { products: [], error: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return { products: data.products || [], error: null };
  } catch (error) {
    return { products: [], error: error?.message || String(error) };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Verifica se um produto do catálogo deve ser ocultado porque o WooCommerce
 * já tem o mesmo SKU (via slug rápido + fallback na lista).
 */
export async function isCatalogProductReplacedByWoo(catalogProduct, options = {}) {
  const sku = normalizeSku(catalogProduct?.sku);
  if (!sku) return false;

  const apiBaseUrl = options.apiBaseUrl || getWooApiBaseUrl();
  const timeoutMs = options.timeoutMs || 5000;
  const slug = catalogProduct?.slug;

  if (slug) {
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(
        `${apiBaseUrl}/products/slug/${encodeURIComponent(slug)}?_t=${Date.now()}`,
        {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          cache: 'no-store',
        }
      );
      if (res.ok) {
        const woo = await res.json();
        if (normalizeSku(woo?.sku) === sku) {
          return true;
        }
      }
    } catch (_) {
      // continua para fallback
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  const { products } = await fetchWooCommerceProducts({
    apiBaseUrl,
    timeoutMs,
    perPage: options.perPage || 100,
  });
  return buildWooSkuSet(products).has(sku);
}
