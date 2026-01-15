'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShopDetailsMainArea from "@components/product-details/product-details-area-main";
import PrdDetailsLoader from "@components/loader/details-loader";

export default function LivroPage() {
  const params = useParams();
  const router = useRouter();
  const [productId, setProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductBySlug = async () => {
      try {
        const slug = params?.slug;
        
        if (!slug) {
          router.replace('/shop');
          return;
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://n-1.artnaweb.com.br/wp-json/n1/v1'}/api/products/slug/${encodeURIComponent(slug)}`;
        
        const response = await fetch(apiUrl, {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const product = await response.json();
          if (product && product.id) {
            setProductId(product.id);
            setIsLoading(false);
          } else {
            setError('Produto não encontrado');
            setIsLoading(false);
          }
        } else {
          setError('Produto não encontrado');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
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

