import { NextResponse } from 'next/server';
import catalogProducts from '@data/catalog-products.json';

/**
 * API Route para servir produtos do catálogo local + WooCommerce
 * GET /api/catalog-products
 * Query params: page, per_page
 * 
 * Produtos são ordenados por data de criação (mais recentes primeiro)
 * Produtos do WooCommerce aparecem primeiro, seguidos pelos do catálogo local
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '20', 10);

    // Adicionar timestamp de data de criação aos produtos do catálogo local
    // Definir uma data base antiga para o catálogo (ex: 01/01/2024) para que novos produtos apareçam primeiro
    const CATALOG_BASE_DATE = new Date('2024-01-01T00:00:00Z').getTime();
    
    const catalogProductsWithDate = catalogProducts.map((product, index) => ({
      ...product,
      // Produtos do catálogo são mais antigos que qualquer produto novo no WooCommerce
      date_created_timestamp: product.date_created_timestamp || (CATALOG_BASE_DATE - (index * 1000)),
      date_created: product.date_created || new Date(CATALOG_BASE_DATE - (index * 1000)).toISOString(),
      source: product.source || 'catalog',
    }));

    // Buscar produtos do WooCommerce
    let wooCommerceProducts = [];
    let timeoutId = null;
    let wooCommerceError = null;
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://n-1.artnaweb.com.br/wp-json/n1/v1';
      // ATENÇÃO: A rota correta no WordPress é /products (sem o /api extra)
      // Adicionar timestamp para evitar cache no WordPress
      const wooCommerceUrl = `${apiBaseUrl}/products?per_page=100&orderby=date&order=DESC&_t=${Date.now()}`;
      
      console.log('[Catalog API] Buscando produtos do WooCommerce:', wooCommerceUrl);
      
      // Criar AbortController para timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const wooCommerceResponse = await fetch(wooCommerceUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store', // Não usar cache para garantir produtos atualizados
      });

      console.log('[Catalog API] Status da resposta WooCommerce:', wooCommerceResponse.status);

      if (wooCommerceResponse.ok) {
        const wooCommerceData = await wooCommerceResponse.json();
        console.log('[Catalog API] Produtos retornados do WooCommerce:', wooCommerceData.products?.length || 0);
        
        wooCommerceProducts = (wooCommerceData.products || []).map(product => {
          // Converter timestamp de segundos (WP) para milissegundos (JS) se necessário
          let timestamp = product.date_created_timestamp;
          if (timestamp && timestamp < 10000000000) { // Se estiver em segundos
            timestamp = timestamp * 1000;
          }
          
          return {
            ...product,
            source: 'woocommerce',
            date_created_timestamp: timestamp || (product.date_created ? new Date(product.date_created).getTime() : Date.now()),
          };
        });
        
        console.log('[Catalog API] Produtos processados do WooCommerce:', wooCommerceProducts.length);
      } else {
        const errorText = await wooCommerceResponse.text();
        console.error('[Catalog API] Erro na resposta WooCommerce:', wooCommerceResponse.status, errorText);
        wooCommerceError = `HTTP ${wooCommerceResponse.status}: ${errorText.substring(0, 100)}`;
      }
    } catch (error) {
      // Se falhar ao buscar do WooCommerce, continuar apenas com catálogo local
      console.error('[Catalog API] Erro ao buscar produtos do WooCommerce:', error.message);
      wooCommerceError = error.message;
    } finally {
      // Limpar timeout se ainda estiver ativo
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    // Mesclar produtos: WooCommerce primeiro (mais recentes), depois catálogo local
    const allProducts = [...wooCommerceProducts, ...catalogProductsWithDate];

    // Ordenar por data de criação (mais recentes primeiro)
    allProducts.sort((a, b) => {
      const timestampA = a.date_created_timestamp || 0;
      const timestampB = b.date_created_timestamp || 0;
      return timestampB - timestampA; // Descendente (mais recente primeiro)
    });

    // Paginação
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);
    const total = allProducts.length;
    const pages = Math.ceil(total / perPage);

    // Log para debug
    console.log('[Catalog API] Resumo:', {
      total_products: total,
      wooCommerce_count: wooCommerceProducts.length,
      catalog_count: catalogProducts.length,
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
        first_products: paginatedProducts.slice(0, 3).map(p => ({
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


