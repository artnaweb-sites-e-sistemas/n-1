import { notifySuccess } from "@utils/toast";
import { apiSlice } from "src/redux/api/apiSlice";
import { userLoggedIn } from "./authSlice";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting:true,
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (data) => ({
        url: "api/user/signup",
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          
          if (result.data?.data?.token && result.data?.data?.user) {
            const authData = {
              accessToken: result.data.data.token,
              user: result.data.data.user,
            };
            
            localStorage.setItem(
              "auth",
              JSON.stringify(authData)
            );

            dispatch(
              userLoggedIn({
                accessToken: result.data.data.token,
                user: result.data.data.user,
              })
            );
          }
        } catch (err) {
          // do nothing
        }
      },
    }),

    // login
    loginUser: builder.mutation({
      query: (data) => ({
        url: "api/user/login",
        method: "POST",
        body: data,
      }),

      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;

          const authData = {
            accessToken: result.data.data.token,
            user: result.data.data.user,
          };

          localStorage.setItem(
            "auth",
            JSON.stringify(authData)
          );

          dispatch(
            userLoggedIn({
              accessToken: result.data.data.token,
              user: result.data.data.user,
            })
          );
        } catch (err) {
          // do nothing
        }
      },
    }),

    // get me
    getUser: builder.query({
      query: () => "api/user/me",

      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          // Manter o token existente do localStorage
          const authData = localStorage.getItem("auth");
          let accessToken = undefined;
          if (authData) {
            try {
              const parsed = JSON.parse(authData);
              accessToken = parsed.accessToken;
            } catch (e) {
              // ignore
            }
          }
          dispatch(
            userLoggedIn({
              accessToken: accessToken,
              user: result.data,
            })
          );
        } catch (err) {
          // do nothing
        }
      },
    }),
    // confirmEmail
    confirmEmail: builder.query({
      query: (token) => `api/user/confirmEmail/${token}`,

      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;

          localStorage.setItem(
            "auth",
            JSON.stringify({
              accessToken: result.data.data.token,
              user: result.data.data.user,
            })
          );

          dispatch(
            userLoggedIn({
              accessToken: result.data.data.token,
              user: result.data.data.user,
            })
          );
        } catch (err) {
          // do nothing
        }
      },
    }),
    // reset password
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "api/user/forget-password",
        method: "PATCH",
        body: data,
      }),
    }),
    // confirmForgotPassword
    confirmForgotPassword: builder.mutation({
      query: (data) => ({
        url: "api/user/confirm-forget-password",
        method: "PATCH",
        body: data,
      }),
    }),
    // change password
    changePassword: builder.mutation({
      query: (data) => ({
        url: "api/user/change-password",
        method: "PATCH",
        body: data,
      }),
    }),
    // change password
    updateProfile: builder.mutation({
      query: ({id,...data}) => ({
        url: `api/user/update-user/${id}`,
        method: "PUT",
        body: data,
      }),

      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;

          const authData = {
            accessToken: result.data.data.token,
            user: result.data.data.user,
          };

          localStorage.setItem(
            "auth",
            JSON.stringify(authData)
          );

          dispatch(
            userLoggedIn({
              accessToken: result.data.data.token,
              user: result.data.data.user,
            })
          );
        } catch (err) {
          // do nothing
        }
      },
    }),
  }),
});

export const {
  useLoginUserMutation,
  useRegisterUserMutation,
  useConfirmEmailQuery,
  useResetPasswordMutation,
  useConfirmForgotPasswordMutation,
  useChangePasswordMutation,
  useUpdateProfileMutation,
} = authApi;
