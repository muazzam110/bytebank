import { baseApi } from "./baseApi";

// Only non-empty filters go on the wire
function toQueryString(f) {
  const p = new URLSearchParams();
  p.set("page", String(f.page));
  p.set("limit", String(f.limit));
  p.set("sort", f.sort);
  p.set("direction", f.direction);
  if (f.q) p.set("q", f.q);
  if (f.type) p.set("type", f.type);
  if (f.status) p.set("status", f.status);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  return p.toString();
}

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query({
      query: (filters) => `/transactions?${toQueryString(filters)}`,
      transformResponse: (res) => ({ items: res.data.transactions, meta: res.meta }),
      providesTags: ["Transactions"], // Phase 3's transfer mutation invalidates this tag
    }),
    getTransaction: build.query({
      query: (paymentId) => `/transactions/${paymentId}`,
      transformResponse: (res) => res.data.transaction,
      providesTags: (result, error, paymentId) => [{ type: "Transaction", id: paymentId }], // immutable → nothing invalidates it
    }),
    getReceipt: build.query({
      query: (paymentId) => `/transactions/${paymentId}/receipt`,
      transformResponse: (res) => res.data.receipt,
    }),
  }),
});

export const { useGetTransactionsQuery, useGetTransactionQuery, useGetReceiptQuery } = transactionsApi;
