import { apiSlice } from "../api/apiSlice";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting:true,
  endpoints: (builder) => ({
    // getUserOrders
    getUserOrders: builder.query({
      query: () => `/api/user-order/order-by-user`,
      keepUnusedDataFor: 600,
    }),
    // getUserOrders — id string OU { id, key } para checkout convidado (order_key WooCommerce)
    getUserOrderById: builder.query({
      query: (arg) => {
        const id = typeof arg === "object" && arg !== null ? arg.id : arg;
        const key =
          typeof arg === "object" && arg !== null && arg.key
            ? String(arg.key)
            : "";
        let url = `/api/user-order/single-order/${id}`;
        if (key) {
          url += `?key=${encodeURIComponent(key)}`;
        }
        return url;
      },
      keepUnusedDataFor: 600,
    }),
  }),
});

export const {
  useGetUserOrdersQuery,
  useGetUserOrderByIdQuery,
} = authApi;
