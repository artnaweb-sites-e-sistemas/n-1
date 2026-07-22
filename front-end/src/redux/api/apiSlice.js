import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@lib/env";

export const apiSlice = createApi({
  reducerPath: "api",
  // baseUrl por request: browser → /wp-api; server → URL absoluta do env
  baseQuery: (args, api, extraOptions) =>
    fetchBaseQuery({
      baseUrl: API_BASE_URL(),
      prepareHeaders: async (headers, { getState }) => {
        const token = getState()?.auth?.accessToken;
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
      },
    })(args, api, extraOptions),
  tagTypes: ["Category", "Products", "Discount", "Coupon", "Product","RelatedProducts", "CatalogProducts"],
  endpoints: (builder) => ({}),
});
