import { NextResponse } from 'next/server';
import catalogProducts from '@data/catalog-products.json';

/**
 * API Route para buscar um produto específico do catálogo local
 * GET /api/catalog-products/[id]
 */
export async function GET(request, { params }) {
  try {
    let { id } = params;

    // Decodificar o ID/slug caso venha codificado
    try {
      id = decodeURIComponent(id);
    } catch (e) {
      // Se falhar o decode, usar o valor original
      console.log('Não foi possível decodificar o slug:', id);
    }

    // Normalizar caracteres especiais (substituir ₂ por 2, etc)
    id = id
      .replace(/₂/g, '2')
      .replace(/₃/g, '3')
      .replace(/₄/g, '4')
      .replace(/²/g, '2')
      .replace(/³/g, '3')
      .replace(/⁴/g, '4');

    // Normalizar para comparação (lowercase)
    const normalizedId = id.toLowerCase().trim();

    // Buscar por ID ou slug (case-insensitive)
    const product = catalogProducts.find((p) => {
      const productId = (p._id || '').toString().toLowerCase();
      const productSlug = (p.slug || '').toLowerCase().trim();
      const productIdAlt = (p.id || '').toString().toLowerCase();
      
      return (
        productId === normalizedId ||
        productSlug === normalizedId ||
        productIdAlt === normalizedId ||
        // Também verificar match exato (sem normalização) para compatibilidade
        p._id === id ||
        p.id === id ||
        p.slug === id
      );
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching catalog product:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto do catálogo' },
      { status: 500 }
    );
  }
}


