import { baseApi } from "./baseApi";

export const transferApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchRecipients: build.query({
      query: (q) => `/recipients/search?q=${encodeURIComponent(q)}`,
      transformResponse: (res) => res.data.recipients,
      keepUnusedDataFor: 30, // short: this is people data, don't hoard it
    }),
    transfer: build.mutation({
      // arg = { idempotencyKey, recipientAccountId, amount (STRING), description }
      query: ({ idempotencyKey, recipientAccountId, amount, description }) => ({
        url: "/transfers",
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: { recipient: { accountId: recipientAccountId }, amount, ...(description ? { description } : {}) },
      }),
      transformResponse: (res) => res.data,
      // After a real success, everything money-related is stale → refetch
      invalidatesTags: ["Account", "Summary", "Transactions"],
    }),
  }),
});

export const { useSearchRecipientsQuery, useLazySearchRecipientsQuery, useTransferMutation } = transferApi;
