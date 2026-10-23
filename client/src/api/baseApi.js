import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "@/features/auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  credentials: "include", // send the HTTP-only cookie
});

const EXPECTED = ["getMe", "login"]; // these legitimately fail for visitors, so no forced logout
const MSG_EXPIRED = "Your session ended. Please log in again.";
const MSG_SUSPENDED = "Your account has been suspended. Contact support if you think this is a mistake.";

const baseQueryWithSessionHandler = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const err = result.error;
  if (err && !EXPECTED.includes(api.endpoint)) {
    const expired = err.status === 401;
    const suspended = err.status === 403 && err.data?.error?.code === "ACCOUNT_SUSPENDED";
    if (expired || suspended) {
      // Only explain if the UI believed someone was logged in (a deliberate Logout has already cleared the user)
      const wasLoggedIn = Boolean(api.getState().auth.user);
      api.dispatch(logout(wasLoggedIn ? (suspended ? MSG_SUSPENDED : MSG_EXPIRED) : undefined));
      api.dispatch(baseApi.util.resetApiState()); // no stale private data after the session dies
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithSessionHandler,
  tagTypes: ["Me", "Account", "Summary", "Transactions", "Transaction", "AdminUsers", "AdminDeposits"],
  endpoints: () => ({}),
});
