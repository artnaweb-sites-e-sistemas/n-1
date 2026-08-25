'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShopDetailsMainArea from "@components/product-details/product-details-area-main";
import PrdDetailsLoader from "@components/loader/details-loader";
import { API_BASE_URL } from "@lib/env";

/**
 * Página de produto por slug.
 * Fonte principal: WooCommerce.
 * O catálogo estático é contingência para queda da API do WooCommerce;
 * nunca deve ser mesclado à listagem normal — só entra se a API falhar de fato
 * (rede/timeout/5xx), nunca quando o produto simplesmente não existe (404).
 */
export default function LivroPage() {
  const params = useParams();
  const router = useRouter();
  const [productId, setProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductBySlug = async () => {
      try {
        let slug = params?.slug;

        if (!slug) {
          router.replace('/shop');
          return;
        }

        let decodedSlug = slug;
        let previousSlug = '';
        while (decodedSlug !== previousSlug && decodedSlug.includes('%')) {
          previousSlug = decodedSlug;
          try {
            decodedSlug = decodeURIComponent(decodedSlug);
          } catch (e) {
            break;
          }
        }

        decodedSlug = decodedSlug
          .replace(/₂/g, '2')
          .replace(/₃/g, '3')
          .replace(/₄/g, '4')
          .replace(/²/g, '2')
          .replace(/³/g, '3')
          .replace(/⁴/g, '4');

        slug = decodedSlug;

        console.log('[LivroPage] Slug recebido:', params?.slug);
        console.log('[LivroPage] Slug decodificado:', slug);

        let wooApiFailed = false;

        try {
          const apiUrl = `${API_BASE_URL()}/api/products/slug/${encodeURIComponent(slug)}`;
          console.log('[LivroPage] Buscando no WooCommerce:', apiUrl);

          const response = await fetch(apiUrl, {
            cache: 'no-store',
          });

          if (response.ok) {
            const product = await response.json();
            if (product && product.id) {
              console.log('[LivroPage] Produto encontrado no WooCommerce:', product?.title);
              setProductId(product.id);
              setIsLoading(false);
              if (product.title) {
                document.title = `N-1 - ${product.title}`;
              }
              return;
            }
          } else if (response.status >= 500) {
            console.log(`[LivroPage] WooCommerce indisponível (${response.status})`);
            wooApiFailed = true;
          } else {
            // 404 / 4xx: produto inexistente ou inacessível no Woo — NÃO usar catálogo
            console.log(`[LivroPage] WooCommerce retornou ${response.status} — produto não encontrado`);
          }
        } catch (wooErr) {
          console.error('[LivroPage] Erro de rede ao buscar no WooCommerce:', wooErr);
          wooApiFailed = true;
        }

        // Contingência: catálogo estático só se a API Woo caiu de fato.
        // A rota /api/catalog-products/[id] também bloqueia se a API estiver no ar.
        if (wooApiFailed) {
          try {
            const catalogUrl = `/api/catalog-products/${encodeURIComponent(slug)}`;
            console.log('[LivroPage] Contingência — buscando catálogo estático:', catalogUrl);

            const catalogResponse = await fetch(catalogUrl, {
              cache: 'no-store',
            });

            if (catalogResponse.ok) {
              const catalogProduct = await catalogResponse.json();
              if (catalogProduct && catalogProduct.source === 'catalog') {
                console.log('[LivroPage] Produto via contingência do catálogo:', catalogProduct?.title);
                setProductId(catalogProduct);
                setIsLoading(false);
                if (catalogProduct.title) {
                  document.title = `N-1 - ${catalogProduct.title}`;
                }
                return;
              }
            } else {
              const errorData = await catalogResponse.json().catch(() => ({}));
              console.log(
                `[LivroPage] Catálogo contingência retornou ${catalogResponse.status}:`,
                errorData
              );
            }
          } catch (catalogErr) {
            console.error('[LivroPage] Erro na contingência do catálogo:', catalogErr);
          }
        }

        setError('Produto não encontrado');
        setIsLoading(false);
      } catch (err) {
        console.error('[LivroPage] Erro ao buscar produto:', err);
        setError('Erro ao carregar produto');
        setIsLoading(false);
      }
    };

    fetchProductBySlug();
  }, [params?.slug, router]);

  if (isLoading) {
    return <PrdDetailsLoader loading={true} />;
  }

  if (error || !productId) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <p>{error || 'Produto não encontrado'}</p>
        <button
          onClick={() => router.push('/shop')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Voltar para a loja
        </button>
      </div>
    );
  }

  return <ShopDetailsMainArea id={productId} />;
}
