import { NextResponse } from 'next/server';
import catalogProducts from '@data/catalog-products.json';
import { isCatalogProductReplacedByWoo } from '@utils/catalog-sku-dedup';

/**
 * API Route para buscar um produto específico do catálogo local
 * GET /api/catalog-products/[id]
 *
 * Se o SKU já existir no WooCommerce, retorna 404 para a página /livros/[slug]
 * cair no produto real do WooCommerce (mesmo slug).
 */
export async function GET(request, { params }) {
  try {
    let { id } = params;

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

    const replaced = await isCatalogProductReplacedByWoo(product);
    if (replaced) {
      console.log('[Catalog API id] Produto do catálogo ocultado por SKU no WooCommerce:', {
        sku: product.sku,
        slug: product.slug,
        title: product.title,
      });
      return NextResponse.json(
        {
          error: 'Produto migrado para WooCommerce',
          code: 'replaced_by_woocommerce',
          sku: product.sku,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...product,
      source: product.source || 'catalog',
    });
  } catch (error) {
    console.error('Error fetching catalog product:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto do catálogo' },
      { status: 500 }
    );
  }
}
