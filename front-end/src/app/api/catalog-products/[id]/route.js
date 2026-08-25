import { NextResponse } from 'next/server';
import catalogProducts from '@data/catalog-products.json';
import {
  getWooApiBaseUrl,
  isCatalogFallbackEnabled,
  normalizeSlug,
} from '@utils/catalog-sku-dedup';

/**
 * GET /api/catalog-products/[id]
 *
 * O catálogo estático é contingência para queda da API do WooCommerce;
 * nunca deve ser mesclado à listagem normal nem servir produto quando a API
 * está respondendo (mesmo que o slug não exista no Woo — nesse caso 404).
 *
 * Serve item do JSON somente se a API Woo falhar de fato e
 * CATALOG_FALLBACK_ENABLED estiver ativo (padrão).
 */
async function probeWooCommerceAvailability(slug) {
  const apiBaseUrl = getWooApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Probe leve: slug específico se tivermos slug; senão listagem page=1
    const url = slug
      ? `${apiBaseUrl}/api/products/slug/${encodeURIComponent(slug)}?_t=${Date.now()}`
      : `${apiBaseUrl}/products?per_page=1&page=1&lite=1&_t=${Date.now()}`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (res.ok) {
      return { available: true, status: res.status };
    }
    // 404 no slug = API no ar, produto inexistente no Woo — NÃO usar catálogo
    if (res.status === 404) {
      return { available: true, status: 404 };
    }
    // 4xx (exceto 404) ou 5xx: tratar 5xx como falha; 4xx como API no ar
    if (res.status >= 500) {
      return { available: false, status: res.status, error: `HTTP ${res.status}` };
    }
    return { available: true, status: res.status };
  } catch (error) {
    return {
      available: false,
      status: 0,
      error: error?.message || String(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    let { id } = resolvedParams;

    try {
      id = decodeURIComponent(id);
    } catch (e) {
      console.log('Não foi possível decodificar o slug:', id);
    }

    id = id
      .replace(/₂/g, '2')
      .replace(/₃/g, '3')
      .replace(/₄/g, '4')
      .replace(/²/g, '2')
      .replace(/³/g, '3')
      .replace(/⁴/g, '4');

    const normalizedId = id.toLowerCase().trim();
    const fallbackEnabled = isCatalogFallbackEnabled();

    const probe = await probeWooCommerceAvailability(normalizeSlug(id) || normalizedId);

    // API Woo respondendo → nunca servir catálogo estático
    if (probe.available) {
      return NextResponse.json(
        {
          error: 'Produto não encontrado no WooCommerce',
          code: 'woocommerce_only',
          // o catálogo estático é contingência para queda da API do WooCommerce;
          // nunca deve ser mesclado à listagem normal
        },
        { status: 404 }
      );
    }

    // API Woo fora do ar
    if (!fallbackEnabled) {
      return NextResponse.json(
        {
          error: 'API WooCommerce indisponível e contingência do catálogo desligada',
          code: 'catalog_fallback_disabled',
          debug: { wooCommerce_error: probe.error || null },
        },
        { status: 503 }
      );
    }

    const product = catalogProducts.find((p) => {
      const productId = (p._id || '').toString().toLowerCase();
      const productIdAlt = (p.id || '').toString().toLowerCase();

      let productSlug = (p.slug || '').toLowerCase().trim();
      try {
        productSlug = decodeURIComponent(productSlug);
      } catch (e) {
        // ignore
      }
      productSlug = productSlug
        .replace(/₂/g, '2')
        .replace(/₃/g, '3')
        .replace(/₄/g, '4')
        .replace(/²/g, '2')
        .replace(/³/g, '3')
        .replace(/⁴/g, '4');

      return (
        productId === normalizedId ||
        productSlug === normalizedId ||
        productIdAlt === normalizedId ||
        p._id === id ||
        p.id === id ||
        p.slug === id ||
        p.slug === encodeURIComponent(id)
      );
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    console.warn(
      '[Catalog API id] Contingência: servindo produto do catálogo estático (API Woo falhou)',
      { slug: product.slug, title: product.title, wooError: probe.error }
    );

    return NextResponse.json({
      ...product,
      source: product.source || 'catalog',
      isCatalogFallback: true,
    });
  } catch (error) {
    console.error('Error fetching catalog product:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto do catálogo' },
      { status: 500 }
    );
  }
}
