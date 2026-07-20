/**
 * Deduplicação de produtos do catálogo estático vs WooCommerce.
 * Regra: ocultar item do catálogo se existir WooCommerce com o mesmo SKU OU o mesmo SLUG.
 */

export function normalizeSku(sku) {
  if (sku == null) return '';
  return String(sku).trim();
}

/**
 * Normaliza slug como o front (/livros/[slug]) e o CSV: decode %xx, ₂→2, lowercase, trim.
 */
export function normalizeSlug(slug) {
  if (slug == null) return '';
  let s = String(slug).trim();
  if (!s) return '';

  let previous = '';
  while (s !== previous && s.includes('%')) {
    previous = s;
    try {
      s = decodeURIComponent(s);
    } catch (_) {
      break;
    }
  }

  return s
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/⁴/g, '4')
    .toLowerCase()
    .trim();
}

export function buildWooSkuSet(wooProducts) {
  return new Set(
    (wooProducts || [])
      .map((p) => normalizeSku(p?.sku))
      .filter(Boolean)
  );
}

export function buildWooSlugSet(wooProducts) {
  return new Set(
    (wooProducts || [])
      .map((p) => normalizeSlug(p?.slug))
      .filter(Boolean)
  );
}

/**
 * Filtra itens do catálogo cujo SKU ou SLUG já existem no WooCommerce.
 * @returns {{ visible: array, hiddenCount: number, hiddenBySku: number, hiddenBySlug: number }}
 */
export function filterCatalogByWooSkus(catalogProducts, wooProductsOrSkuSet, wooSlugSet) {
  let skuSet;
  let slugSet;

  if (wooProductsOrSkuSet instanceof Set && wooSlugSet instanceof Set) {
    skuSet = wooProductsOrSkuSet;
    slugSet = wooSlugSet;
  } else if (Array.isArray(wooProductsOrSkuSet)) {
    skuSet = buildWooSkuSet(wooProductsOrSkuSet);
    slugSet = buildWooSlugSet(wooProductsOrSkuSet);
  } else if (wooProductsOrSkuSet instanceof Set) {
    skuSet = wooProductsOrSkuSet;
    slugSet = wooSlugSet instanceof Set ? wooSlugSet : new Set();
  } else {
    skuSet = new Set();
    slugSet = new Set();
  }

  let hiddenBySku = 0;
  let hiddenBySlug = 0;
  const visible = (catalogProducts || []).filter((product) => {
    const sku = normalizeSku(product?.sku);
    if (sku && skuSet.has(sku)) {
      hiddenBySku += 1;
      return false;
    }
    const slug = normalizeSlug(product?.slug);
    if (slug && slugSet.has(slug)) {
      hiddenBySlug += 1;
      return false;
    }
    return true;
  });

  return {
    visible,
    hiddenCount: hiddenBySku + hiddenBySlug,
    hiddenBySku,
    hiddenBySlug,
  };
}

export function getWooApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://n-1.artnaweb.com.br/wp-json/n1/v1'
  );
}

/**
 * Busca TODOS os produtos do WooCommerce (paginado).
 */
export async function fetchWooCommerceProducts({
  perPage = 100,
  timeoutMs = 15000,
  apiBaseUrl = getWooApiBaseUrl(),
} = {}) {
  const products = [];
  let page = 1;
  let pages = 1;
  let lastError = null;

  while (page <= pages) {
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const url = `${apiBaseUrl}/products?per_page=${perPage}&page=${page}&orderby=date&order=DESC&_t=${Date.now()}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        break;
      }
      const data = await response.json();
      const batch = data.products || [];
      products.push(...batch);
      pages = Math.max(1, parseInt(data.pages || 1, 10));
      if (!batch.length) break;
      page += 1;
    } catch (error) {
      lastError = error?.message || String(error);
      break;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  return { products, error: lastError };
}

/**
 * Verifica se um produto do catálogo deve ser ocultado (mesmo SKU ou mesmo slug no Woo).
 */
export async function isCatalogProductReplacedByWoo(catalogProduct, options = {}) {
  const sku = normalizeSku(catalogProduct?.sku);
  const slug = normalizeSlug(catalogProduct?.slug);
  if (!sku && !slug) return false;

  const apiBaseUrl = options.apiBaseUrl || getWooApiBaseUrl();
  const timeoutMs = options.timeoutMs || 5000;

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
        const wooSku = normalizeSku(woo?.sku);
        const wooSlug = normalizeSlug(woo?.slug);
        if ((sku && wooSku && wooSku === sku) || (wooSlug && wooSlug === slug)) {
          return true;
        }
        // Produto existe nesse slug (mesmo sem SKU) — assume o lugar
        if (woo?.id) return true;
      }
    } catch (_) {
      // continua
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  const { products } = await fetchWooCommerceProducts({
    apiBaseUrl,
    timeoutMs,
    perPage: options.perPage || 100,
  });
  if (sku && buildWooSkuSet(products).has(sku)) return true;
  if (slug && buildWooSlugSet(products).has(slug)) return true;
  return false;
}
