import { baseApi } from "./baseApi";

// Only non-empty values go on the wire
const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== "" && v !== undefined && v !== null) p.set(k, String(v));
  });
  return p.toString();
};

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // totals change with deposits and status changes → refetch on the same tags
    getAdminOverview: build.query({
      query: () => "/admin/overview",
      transformResponse: (res) => res.data,
      providesTags: ["AdminUsers", "AdminDeposits"],
    }),
    getAdminUsers: build.query({
      query: (filters) => `/admin/users?${qs(filters)}`,
      transformResponse: (res) => ({ items: res.data.users, meta: res.meta }),
      providesTags: ["AdminUsers"],
    }),
    getAdminUser: build.query({
      query: (id) => `/admin/users/${id}`,
      transformResponse: (res) => res.data,
      providesTags: ["AdminUsers"],
    }),
    setUserStatus: build.mutation({
      query: ({ id, status, note }) => ({
        url: `/admin/users/${id}/status`,
        method: "PATCH",
        body: { status, ...(note ? { note } : {}) },
      }),
      transformResponse: (res) => res.data,
      invalidatesTags: ["AdminUsers"],
    }),
    getAdminTransactions: build.query({
      query: (filters) => `/admin/transactions?${qs(filters)}`,
      transformResponse: (res) => ({ items: res.data.transactions, meta: res.meta }),
      providesTags: ["Transactions"],
    }),
    getAdminDeposits: build.query({
      query: (filters) => `/admin/deposits?${qs(filters)}`,
      transformResponse: (res) => ({ items: res.data.deposits, meta: res.meta }),
      providesTags: ["AdminDeposits"],
    }),
    createDeposit: build.mutation({
      query: ({ userId, amount, reason }) => ({ url: "/admin/deposits", method: "POST", body: { userId, amount, reason } }),
      transformResponse: (res) => res.data.deposit,
      invalidatesTags: ["AdminDeposits", "AdminUsers", "Transactions"],
    }),
  }),
});

export const {
  useGetAdminOverviewQuery,
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useSetUserStatusMutation,
  useGetAdminTransactionsQuery,
  useGetAdminDepositsQuery,
  useCreateDepositMutation,
} = adminApi;
