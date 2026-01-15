'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PrdDetailsLoader from "@components/loader/details-loader";
import { API_BASE_URL } from "@lib/env";

export default function ShopRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const redirectToNewUrl = async () => {
      try {
        // Reconstruir a URL antiga a partir dos parâmetros
        const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];
        const oldPath = `/shop/${slugParts.join('/')}`;
        
        // Extrair apenas o path (sem query params e hash para a busca)
        const cleanPath = oldPath.split('?')[0].split('#')[0];
        
        // Construir a URL antiga original do site (não localhost)
        const originalOldUrl = `https://loja.n-1edicoes.org${cleanPath}`;

        console.log('[REDIRECT] Buscando produto para URL:', originalOldUrl);
        console.log('[REDIRECT] Path extraído:', cleanPath);

        // Extrair ISBN da URL para busca alternativa
        const isbnMatch = cleanPath.match(/\/(\d{13})-/);
        const isbn = isbnMatch ? isbnMatch[1] : null;
        
        console.log('[REDIRECT] ISBN extraído:', isbn);

        // Método 1: Buscar pelo endpoint old-url
        try {
          const apiUrl = `${API_BASE_URL()}/products/old-url?url=${encodeURIComponent(originalOldUrl)}`;
          console.log('[REDIRECT] Tentando endpoint:', apiUrl);
          
          const response = await fetch(apiUrl, {
            cache: 'no-store',
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[REDIRECT] Resposta do endpoint:', data);
            
            if (data && data.slug) {
              console.log('[REDIRECT] Redirecionando para:', `/livros/${data.slug}`);
              router.replace(`/livros/${data.slug}`);
              return;
            }
          } else {
            const errorText = await response.text();
            console.log('[REDIRECT] Endpoint retornou erro:', response.status, errorText);
          }
        } catch (apiError) {
          console.error('[REDIRECT] Erro ao chamar endpoint:', apiError);
        }

        // Método 2: Buscar todos os produtos e encontrar pelo ISBN no SKU
        if (isbn) {
          console.log('[REDIRECT] Tentando buscar por ISBN:', isbn);
          
          try {
            const productsUrl = `${API_BASE_URL()}/products`;
            const productsResponse = await fetch(productsUrl, {
              cache: 'no-store',
            });

            if (productsResponse.ok) {
              const productsData = await productsResponse.json();
              const products = Array.isArray(productsData) ? productsData : (productsData.products || []);
              
              console.log('[REDIRECT] Total de produtos carregados:', products.length);

              // Procurar produto que contenha o ISBN no SKU
              const foundProduct = products.find(product => {
                if (product.sku && product.sku.includes(isbn)) {
                  return true;
                }
                // Também verificar se o path da URL antiga está no slug ou título
                const pathSlug = cleanPath.replace('/shop/', '').split('-').slice(1).join('-').replace(/\d+$/, '').trim();
                const productSlug = product.slug || '';
                if (productSlug && pathSlug && productSlug.includes(pathSlug.substring(0, 20))) {
                  return true;
                }
                return false;
              });

              if (foundProduct && foundProduct.slug) {
                console.log('[REDIRECT] Produto encontrado pelo ISBN:', foundProduct.slug);
                router.replace(`/livros/${foundProduct.slug}`);
                return;
              } else {
                console.log('[REDIRECT] Nenhum produto encontrado pelo ISBN');
              }
            }
          } catch (productsError) {
            console.error('[REDIRECT] Erro ao buscar produtos:', productsError);
          }
        }

        // Se não encontrou, redirecionar para a página de produtos
        console.log('[REDIRECT] Produto não encontrado, redirecionando para /shop');
        router.replace('/shop');
      } catch (error) {
        console.error('[REDIRECT] Erro geral ao redirecionar:', error);
        router.replace('/shop');
      } finally {
        setIsRedirecting(false);
      }
    };

    redirectToNewUrl();
  }, [params.slug, router]);

  // Mostrar loading durante o redirecionamento
  if (isRedirecting) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <PrdDetailsLoader loading={true} />
        <p style={{ color: '#666', fontSize: '14px' }}>Redirecionando...</p>
      </div>
    );
  }

  return null;
}

