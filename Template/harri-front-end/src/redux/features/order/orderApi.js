import { apiSlice } from "../../api/apiSlice";
import { set_client_secret } from "./orderSlice";


export const authApi = apiSlice.injectEndpoints({
  overrideExisting:true,
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation({
      query: (data) => ({
        url: "api/order/create-payment-intent",
        method: "POST",
        body: data,
      }),

      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          // RTK Query envolve a resposta em result.data
          const clientSecret = result.data?.clientSecret || result.data?.data?.clientSecret;
          if (clientSecret) {
            dispatch(set_client_secret(clientSecret));
          }
        } catch (err) {
          // do nothing
        }
      },

    }),
    addOrder: builder.mutation({
      query: (data) => ({
        url: "api/order/addOrder",
        method: "POST",
        body: data,
      }),

      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          if(result){
            localStorage.removeItem("couponInfo");
            localStorage.removeItem("cart_products");
            localStorage.removeItem("shipping_info");
          }
        } catch (err) {
          // do nothing
        }
      },

    }),
    calculateShipping: builder.mutation({
      query: (data) => ({
        url: "api/shipping/calculate",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useAddOrderMutation,
  useCalculateShippingMutation,
} = authApi;
