import { baseApi } from "./baseApi";

export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query({
      query: () => "/profile",
      transformResponse: (res) => res.data.user,
      providesTags: ["Me"],
    }),
    updateProfile: build.mutation({
      query: (body) => ({ url: "/profile", method: "PATCH", body }),
      transformResponse: (res) => res.data.user,
      // `Me` is also what AuthBootstrap's getMe provides → it refetches → authSlice updates → the shell header shows the new name
      invalidatesTags: ["Me"],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi;
