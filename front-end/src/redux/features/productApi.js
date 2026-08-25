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
    // get products paginated (WooCommerce direto)
    getProductsPaginated: builder.query({
      query: ({ page = 1, per_page = 20 }) => {
        return `products?page=${page}&per_page=${per_page}`;
      },
      providesTags: ["Products"],
      keepUnusedDataFor: 600,
    }),
    // Listagem da loja via /api/catalog-products (só Woo no fluxo normal).
    // O catálogo estático é contingência para queda da API do WooCommerce;
    // nunca deve ser mesclado à listagem normal.
    getCatalogProducts: builder.query({
      queryFn: async ({ page = 1, per_page = 20 }) => {
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const timestamp = Date.now();
          const response = await fetch(`${baseUrl}/api/catalog-products?page=${page}&per_page=${per_page}&_t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          if (!response.ok) {
            throw new Error('Erro ao buscar produtos');
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      providesTags: ["CatalogProducts"],
      keepUnusedDataFor: 60,
    }),
    // Alias da listagem Woo (mesmo endpoint; sem mescla com JSON estático)
    getMergedProducts: builder.query({
      queryFn: async ({ page = 1, per_page = 20 }) => {
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const catalogResponse = await fetch(
            `${baseUrl}/api/catalog-products?page=${page}&per_page=${per_page}&_t=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (!catalogResponse.ok) {
            throw new Error('Erro ao buscar produtos');
          }
          const catalogData = await catalogResponse.json();
          return {
            data: {
              products: catalogData.products || [],
              total: catalogData.total || 0,
              pages: catalogData.pages || 0,
              current_page: catalogData.current_page || page,
              catalog_count: catalogData.catalog_count || 0,
              woocommerce_count: catalogData.wooCommerce_count || 0,
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
