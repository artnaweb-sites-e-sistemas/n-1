import { NextResponse } from 'next/server';

/**
 * API Route para testar a conexão com WooCommerce
 * GET /api/test-woocommerce
 */
export async function GET() {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://n-1.artnaweb.com.br/wp-json/n1/v1';
    const wooCommerceUrl = `${apiBaseUrl}/products?per_page=100&orderby=date&order=DESC`;
    
    const response = await fetch(wooCommerceUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const status = response.status;
    const statusText = response.statusText;

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        status,
        statusText,
        error: errorText,
        url: wooCommerceUrl,
      });
    }

    const data = await response.json();
    const products = data.products || [];

    return NextResponse.json({
      success: true,
      status,
      url: wooCommerceUrl,
      total: products.length,
      products: products.slice(0, 10).map(p => ({
        id: p.id || p._id,
        title: p.title,
        slug: p.slug,
        date_created: p.date_created,
        date_created_timestamp: p.date_created_timestamp,
        source: p.source,
      })),
      all_products_info: products.map(p => ({
        id: p.id || p._id,
        title: p.title,
        date_created: p.date_created,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

