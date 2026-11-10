import { apiSlice } from "src/redux/api/apiSlice";
import { legacyCouponQuote } from "@utils/legacy-coupon-quote.mjs";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting:true,
  endpoints: (builder) => ({
    validateCoupon: builder.mutation({
      async queryFn(body, api, options, baseQuery) {
        const result = await baseQuery({ url: "api/coupon/validate", method: "POST", body });
        // A refused coupon or network failure must never fall back to old rules.
        if (result.error?.status !== 404 || result.error?.data?.code !== "rest_no_route") return result;
        const legacy = await baseQuery({ url: "api/coupon", cache: "no-store" });
        if (legacy.error) return legacy;
        try {
          return { data: legacyCouponQuote(legacy.data, body) };
        } catch (error) {
          return { error: { status: 400, data: { message: error.message } } };
        }
      },
    }),
    // get offer coupon
    getOfferCoupons: builder.query({
      query: () => ({ url: "api/coupon", cache: "no-store" }),
      providesTags: ["Coupon"],
      keepUnusedDataFor: 600,
    }),
  }),
});

export const { useGetOfferCouponsQuery, useValidateCouponMutation } = authApi;
