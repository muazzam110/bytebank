import { baseApi } from "./baseApi";

const unwrap = (res) => res.data; // envelope {success,data} → data

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query({ query: () => "/auth/me", transformResponse: unwrap, providesTags: ["Me"] }),
    signup: build.mutation({ query: (body) => ({ url: "/auth/signup", method: "POST", body }), transformResponse: unwrap }),
    login: build.mutation({ query: (body) => ({ url: "/auth/login", method: "POST", body }), transformResponse: unwrap, invalidatesTags: ["Me"] }),
    logout: build.mutation({ query: () => ({ url: "/auth/logout", method: "POST" }), transformResponse: unwrap }),
    forgotPassword: build.mutation({ query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }), transformResponse: unwrap }),
    resetPassword: build.mutation({ query: (body) => ({ url: "/auth/reset-password", method: "POST", body }), transformResponse: unwrap }),
    changePassword: build.mutation({ query: (body) => ({ url: "/auth/change-password", method: "POST", body }), transformResponse: unwrap }),
  }),
});

export const {
  useGetMeQuery,
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
