import { useEffect, useRef, useState } from 'react';

/**
 * Hook para implementar infinite scroll usando IntersectionObserver
 * @param {Function} loadMore - Função para carregar mais itens
 * @param {boolean} hasMore - Se há mais itens para carregar
 * @param {boolean} isLoading - Se está carregando
 * @returns {Object} - { sentinelRef, isIntersecting }
 */
export const useInfiniteScroll = (loadMore, hasMore, isLoading) => {
  const sentinelRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) {
      setIsIntersecting(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Carregar quando estiver a 100px do fim
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  return { sentinelRef, isIntersecting };
};


