'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShopDetailsMainArea from "@components/product-details/product-details-area-main";
import PrdDetailsLoader from "@components/loader/details-loader";
import { API_BASE_URL } from "@lib/env";

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

        // 1) WooCommerce primeiro: produto migrado assume o slug do catálogo
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
          } else {
            console.log(`[LivroPage] WooCommerce retornou ${response.status}`);
          }
        } catch (wooErr) {
          console.error('[LivroPage] Erro ao buscar no WooCommerce:', wooErr);
        }

        // 2) Fallback: catálogo estático (já oculta SKUs migrados na API)
        try {
          const catalogUrl = `/api/catalog-products/${slug}`;
          console.log('[LivroPage] Buscando no catálogo local:', catalogUrl);
          
          const catalogResponse = await fetch(catalogUrl, {
            cache: 'no-store',
          });
          
          console.log('[LivroPage] Resposta do catálogo:', catalogResponse.status);
          
          if (catalogResponse.ok) {
            const catalogProduct = await catalogResponse.json();
            console.log('[LivroPage] Produto encontrado no catálogo:', catalogProduct?.title);
            
            if (catalogProduct && catalogProduct.source === 'catalog') {
              setProductId(catalogProduct);
              setIsLoading(false);
              
              if (catalogProduct.title) {
                document.title = `N-1 - ${catalogProduct.title}`;
              }
              return;
            }
          } else {
            const errorData = await catalogResponse.json().catch(() => ({}));
            console.log(`[LivroPage] Catálogo local retornou ${catalogResponse.status}:`, errorData);
          }
        } catch (catalogErr) {
          console.error('[LivroPage] Erro ao buscar no catálogo local:', catalogErr);
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
