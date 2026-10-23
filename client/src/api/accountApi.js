import { baseApi } from "./baseApi";

export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccount: build.query({
      query: () => "/account",
      transformResponse: (res) => res.data.account,
      providesTags: ["Account"], // Phase 3's transfer will invalidate this → auto refetch
    }),
    getSummary: build.query({
      query: (range = "30d") => `/account/summary?range=${range}`, // each range = its own cache entry
      transformResponse: (res) => res.data,
      providesTags: ["Summary"],
    }),
  }),
});

export const { useGetAccountQuery, useGetSummaryQuery } = accountApi;
