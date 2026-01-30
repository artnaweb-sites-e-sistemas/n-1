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
        // Next.js já faz decode automático do slug da URL
        let slug = params?.slug;
        
        if (!slug) {
          router.replace('/shop');
          return;
        }

        // Garantir que o slug está decodificado (caso de double encoding)
        // Tentar decodificar múltiplas vezes se necessário
        let decodedSlug = slug;
        let previousSlug = '';
        while (decodedSlug !== previousSlug && decodedSlug.includes('%')) {
          previousSlug = decodedSlug;
          try {
            decodedSlug = decodeURIComponent(decodedSlug);
          } catch (e) {
            break; // Se falhar, usar o último valor válido
          }
        }
        
        // Normalizar caracteres especiais (substituir ₂ por 2, etc)
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

        // Primeiro, tentar buscar do catálogo local
        // Usar o slug decodificado diretamente (Next.js API routes fazem decode automático)
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
              // Produto do catálogo local - passar diretamente
              setProductId(catalogProduct);
              setIsLoading(false);
              
              // Atualizar o título da página
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
          // Se falhar, continuar para buscar no WooCommerce
          console.error('[LivroPage] Erro ao buscar no catálogo local:', catalogErr);
        }

        // Se não encontrou no catálogo, buscar no WooCommerce
        // Codificar apenas uma vez para a URL da API externa
        const apiUrl = `${API_BASE_URL()}/api/products/slug/${encodeURIComponent(slug)}`;
        console.log('[LivroPage] Buscando no WooCommerce:', apiUrl);
        
        const response = await fetch(apiUrl, {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const product = await response.json();
          if (product && product.id) {
            setProductId(product.id);
            setIsLoading(false);
            
            // Atualizar o título da página para produtos do WooCommerce
            if (product.title) {
              document.title = `N-1 - ${product.title}`;
            }
          } else {
            setError('Produto não encontrado');
            setIsLoading(false);
          }
        } else {
          setError('Produto não encontrado');
          setIsLoading(false);
        }
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

