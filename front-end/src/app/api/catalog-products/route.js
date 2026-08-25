import { NextResponse } from 'next/server';
import catalogProducts from '@data/catalog-products.json';
import {
  fetchWooCommerceProducts,
  getWooApiBaseUrl,
  isCatalogFallbackEnabled,
} from '@utils/catalog-sku-dedup';

export const revalidate = 60;

/**
 * GET /api/catalog-products
 * Query params: page, per_page
 *
 * O catálogo estático (catalog-products.json) é contingência para queda da API
 * do WooCommerce; nunca deve ser mesclado à listagem normal.
 *
 * Fluxo:
 * - API Woo OK → retorna SOMENTE produtos do WooCommerce (mesmo se vazia/poucos).
 * - API Woo FALHOU (rede/timeout/HTTP erro) e CATALOG_FALLBACK_ENABLED=true (padrão)
 *   → retorna só o catálogo estático.
 * - API Woo FALHOU e contingência desligada → lista vazia + erro em debug.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);
    const fallbackEnabled = isCatalogFallbackEnabled();

    let wooCommerceProducts = [];
    let wooCommerceError = null;
    let usedCatalogFallback = false;

    try {
      const apiBaseUrl = getWooApiBaseUrl();
      console.log('[Catalog API] Buscando produtos do WooCommerce (paginado):', apiBaseUrl);

      const { products, error } = await fetchWooCommerceProducts({
        apiBaseUrl,
        perPage: 100,
        timeoutMs: 15000,
      });
      wooCommerceError = error;

      wooCommerceProducts = (products || []).map((product) => {
        let timestamp = product.date_created_timestamp;
        if (timestamp && timestamp < 10000000000) {
          timestamp = timestamp * 1000;
        }

        return {
          ...product,
          source: 'woocommerce',
          date_created_timestamp:
            timestamp ||
            (product.date_created ? new Date(product.date_created).getTime() : Date.now()),
        };
      });

      console.log('[Catalog API] Produtos processados do WooCommerce:', wooCommerceProducts.length);
    } catch (error) {
      console.error('[Catalog API] Erro ao buscar produtos do WooCommerce:', error.message);
      wooCommerceError = error.message;
    }

    // Falha real: erro e nenhum produto obtido com sucesso.
    // Sucesso com 0 produtos NÃO aciona contingência.
    const wooRequestFailed =
      Boolean(wooCommerceError) && wooCommerceProducts.length === 0;

    let allProducts = [];

    if (wooRequestFailed) {
      if (fallbackEnabled) {
        // Contingência: catálogo estático apenas quando a API caiu de fato.
        usedCatalogFallback = true;
        const CATALOG_BASE_DATE = new Date('2024-01-01T00:00:00Z').getTime();
        allProducts = catalogProducts.map((product, index) => ({
          ...product,
          date_created_timestamp:
            product.date_created_timestamp || CATALOG_BASE_DATE - index * 1000,
          date_created:
            product.date_created ||
            new Date(CATALOG_BASE_DATE - index * 1000).toISOString(),
          source: product.source || 'catalog',
        }));
        console.warn(
          '[Catalog API] Contingência ativa: API Woo falhou — servindo catálogo estático.',
          { wooCommerce_error: wooCommerceError }
        );
      } else {
        allProducts = [];
        console.warn(
          '[Catalog API] API Woo falhou e CATALOG_FALLBACK_ENABLED != true — lista vazia.',
          { wooCommerce_error: wooCommerceError }
        );
      }
    } else {
      // Listagem normal: SOMENTE WooCommerce (sem mesclar catálogo).
      allProducts = wooCommerceProducts;
    }

    allProducts.sort((a, b) => {
      const timestampA = a.date_created_timestamp || 0;
      const timestampB = b.date_created_timestamp || 0;
      return timestampB - timestampA;
    });

    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);
    const total = allProducts.length;
    const pages = Math.ceil(total / perPage) || 0;

    console.log('[Catalog API] Resumo:', {
      total_products: total,
      wooCommerce_count: wooCommerceProducts.length,
      catalog_count: catalogProducts.length,
      used_catalog_fallback: usedCatalogFallback,
      fallback_enabled: fallbackEnabled,
      page,
      perPage,
      products_in_page: paginatedProducts.length,
      first_product_source: paginatedProducts[0]?.source,
      first_product_title: paginatedProducts[0]?.title,
      wooCommerce_error: wooCommerceError || null,
    });

    return NextResponse.json({
      products: paginatedProducts,
      total,
      pages,
      current_page: page,
      per_page: perPage,
      wooCommerce_count: wooCommerceProducts.length,
      catalog_count: usedCatalogFallback ? catalogProducts.length : 0,
      debug: {
        wooCommerce_error: wooCommerceError || null,
        used_catalog_fallback: usedCatalogFallback,
        catalog_fallback_enabled: fallbackEnabled,
        // o catálogo estático é contingência para queda da API do WooCommerce;
        // nunca deve ser mesclado à listagem normal
        first_products: paginatedProducts.slice(0, 3).map((p) => ({
          title: p.title,
          source: p.source,
          date_created: p.date_created,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching catalog products:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos do catálogo' },
      { status: 500 }
    );
  }
}
