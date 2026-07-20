import { NextResponse } from 'next/server';
import catalogProducts from '@data/catalog-products.json';
import {
  filterCatalogByWooSkus,
  fetchWooCommerceProducts,
  getWooApiBaseUrl,
} from '@utils/catalog-sku-dedup';

/**
 * API Route para servir produtos do catálogo local + WooCommerce
 * GET /api/catalog-products
 * Query params: page, per_page
 *
 * Itens do catálogo cujo SKU ou SLUG já existem no WooCommerce são ocultados.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);

    const CATALOG_BASE_DATE = new Date('2024-01-01T00:00:00Z').getTime();

    const catalogProductsWithDate = catalogProducts.map((product, index) => ({
      ...product,
      date_created_timestamp: product.date_created_timestamp || (CATALOG_BASE_DATE - (index * 1000)),
      date_created: product.date_created || new Date(CATALOG_BASE_DATE - (index * 1000)).toISOString(),
      source: product.source || 'catalog',
    }));

    let wooCommerceProducts = [];
    let wooCommerceError = null;
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

    const {
      visible: catalogVisible,
      hiddenCount: catalog_hidden_by_sku,
      hiddenBySku,
      hiddenBySlug,
    } = filterCatalogByWooSkus(catalogProductsWithDate, wooCommerceProducts);

    const allProducts = [...wooCommerceProducts, ...catalogVisible];

    allProducts.sort((a, b) => {
      const timestampA = a.date_created_timestamp || 0;
      const timestampB = b.date_created_timestamp || 0;
      return timestampB - timestampA;
    });

    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);
    const total = allProducts.length;
    const pages = Math.ceil(total / perPage);

    console.log('[Catalog API] Resumo:', {
      total_products: total,
      wooCommerce_count: wooCommerceProducts.length,
      catalog_count: catalogProducts.length,
      catalog_hidden_by_sku,
      hiddenBySku,
      hiddenBySlug,
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
      catalog_count: catalogProducts.length,
      debug: {
        wooCommerce_error: wooCommerceError || null,
        catalog_hidden_by_sku,
        catalog_hidden_by_sku_only: hiddenBySku,
        catalog_hidden_by_slug: hiddenBySlug,
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
