import { apiSlice } from "src/redux/api/apiSlice";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // get showing products
    getShowingProducts: builder.query({
      query: () => `api/products/show`,
      providesTags: ["Products"],
      keepUnusedDataFor: 600,
    }),
    // get discount products
    getDiscountProducts: builder.query({
      query: () => `api/products/discount`,
      providesTags: ["Discount"],
      keepUnusedDataFor: 600,
    }),
    // get single product
    getProduct: builder.query({
      query: (id) => `api/products/${id}`,
      providesTags: (result, error, arg) => [{ type: "Product", id: arg }],
      invalidatesTags: (result, error, arg) => [
        { type: "RelatedProducts", id },
      ],
    }),
    // getRelatedProducts
    getRelatedProducts: builder.query({
      query: ({ id, categories }) => {
        const categoriesParam = categories && categories.length > 0
          ? `&categories=${categories.join(",")}`
          : '';
        const queryString = `api/products/relatedProduct?id=${id}${categoriesParam}`;
        return queryString;
      },
      providesTags: (result, error, arg) => [
        { type: "RelatedProducts", id: arg.id },
      ],
      invalidatesTags: (result, error, arg) => [
        { type: "Product", id: arg.id },
      ],
    }),
    // get products paginated (for infinite scroll) - mescla WooCommerce + catálogo local
    getProductsPaginated: builder.query({
      query: ({ page = 1, per_page = 20 }) => {
        return `products?page=${page}&per_page=${per_page}`;
      },
      providesTags: ["Products"],
      keepUnusedDataFor: 600,
    }),
    // get catalog products (produtos do catálogo local + WooCommerce)
    getCatalogProducts: builder.query({
      queryFn: async ({ page = 1, per_page = 20 }) => {
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          // Adicionar timestamp para evitar cache e garantir produtos atualizados
          const timestamp = Date.now();
          const response = await fetch(`${baseUrl}/api/catalog-products?page=${page}&per_page=${per_page}&_t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
          
          if (!response.ok) {
            throw new Error('Erro ao buscar produtos do catálogo');
          }
          
          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      providesTags: ["CatalogProducts"],
      keepUnusedDataFor: 60, // Reduzir cache para 1 minuto para produtos aparecerem mais rápido
    }),
    // get merged products (WooCommerce + catálogo local)
    getMergedProducts: builder.query({
      queryFn: async ({ page = 1, per_page = 20 }, _queryApi, _extraOptions, baseQuery) => {
        try {
            // Buscar produtos do WooCommerce
            const wooCommerceResult = await baseQuery({
              url: `products?page=${page}&per_page=${per_page}`,
            });

            // Buscar produtos do catálogo local (usar fetch direto pois é rota Next.js)
            let catalogData = { products: [], total: 0, pages: 0 };
            try {
              const catalogResponse = await fetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/catalog-products?page=${page}&per_page=${per_page}`);
              if (catalogResponse.ok) {
                catalogData = await catalogResponse.json();
              }
            } catch (catalogErr) {
              console.warn('Erro ao buscar produtos do catálogo:', catalogErr);
            }

            const wooCommerceData = wooCommerceResult.data || { products: [], total: 0, pages: 0 };

            // Mesclar produtos (catálogo primeiro, depois WooCommerce)
            const mergedProducts = [
              ...catalogData.products,
              ...wooCommerceData.products,
            ];

            // Calcular totais
            const total = catalogData.total + wooCommerceData.total;
            const pages = Math.ceil(total / per_page);

            return {
              data: {
                products: mergedProducts,
                total,
                pages,
                current_page: page,
                catalog_count: catalogData.total,
                woocommerce_count: wooCommerceData.total,
              },
            };
          } catch (error) {
            return { error: { status: 'CUSTOM_ERROR', error: error.message } };
          }
      },
      providesTags: ["Products", "CatalogProducts"],
      keepUnusedDataFor: 600,
    }),
  }),
});

export const {
  useGetShowingProductsQuery,
  useGetDiscountProductsQuery,
  useGetProductQuery,
  useGetRelatedProductsQuery,
  useGetProductsPaginatedQuery,
  useGetCatalogProductsQuery,
  useGetMergedProductsQuery,
} = authApi;
