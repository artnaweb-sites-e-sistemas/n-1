'use client';
import React, { useState, useCallback, useEffect } from "react";
import ProductCoverCard from "@components/products/product-cover-card";
import ErrorMessage from "@components/error-message/error";
import { useGetCatalogProductsQuery } from "src/redux/features/productApi";
import ShopLoader from "@components/loader/shop-loader";
import { useInfiniteScroll } from "src/hooks/use-infinite-scroll";
import styles from './home-shop-content-infinite.module.scss';

const HomeShopContentInfinite = () => {
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const perPage = 20;

  // Usar APENAS produtos do catálogo local (196 produtos)
  const { 
    data, 
    isError, 
    isLoading, 
    isFetching
  } = useGetCatalogProductsQuery({ page, per_page: perPage });

  // Acumular produtos de todas as páginas
  useEffect(() => {
    if (data?.products && data.products.length > 0) {
      if (page === 1) {
        setAllProducts(data.products);
      } else {
        setAllProducts((prev) => {
          // Evitar duplicatas
          const existingIds = new Set(prev.map(p => p._id || p.id));
          const newProducts = data.products.filter(p => !existingIds.has(p._id || p.id));
          return [...prev, ...newProducts];
        });
      }
    }
  }, [data, page]);

  const hasMore = data ? page < data.pages : false;
  const totalProducts = data?.total || 0;
  const isFetchingNextPage = isFetching && page > 1;

  const loadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isFetching]);

  const { sentinelRef } = useInfiniteScroll(loadMore, hasMore, isFetching);

  // Renderização principal
  return (
    <section className={`shop__area pt-100 pb-60 ${styles.homeShopArea}`}>
      <div className="container">
        {/* Estado de Loading */}
        {isLoading && page === 1 && (
          <ShopLoader loading={isLoading} />
        )}

        {/* Estado de Erro */}
        {!isLoading && isError && (
          <ErrorMessage message="Ocorreu um erro" />
        )}

        {/* Grid de Produtos */}
        {allProducts.length > 0 && (
          <div className={styles.productGrid}>
            {allProducts.map((product) => (
              <div key={product._id || product.id} className={styles.productItem}>
                <ProductCoverCard product={product} />
              </div>
            ))}
          </div>
        )}
        
        {/* Sentinel para infinite scroll */}
        {hasMore && (
          <div ref={sentinelRef} className={styles.sentinel}>
            {isFetchingNextPage && (
              <div className={styles.loadingMore}>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Carregando mais produtos...</span>
                </div>
                <span className={styles.loadingText}>Carregando mais produtos...</span>
              </div>
            )}
          </div>
        )}

        {/* Mensagem de fim da lista */}
        {!hasMore && allProducts.length > 0 && !isLoading && (
          <div className={styles.endMessage}>
            <p>Você visualizou todos os {totalProducts} produtos disponíveis.</p>
          </div>
        )}

        {/* Nenhum produto encontrado */}
        {!isLoading && !isError && allProducts.length === 0 && data && (
          <ErrorMessage message="Nenhum produto encontrado!" />
        )}
      </div>
    </section>
  )
};

export default HomeShopContentInfinite;

