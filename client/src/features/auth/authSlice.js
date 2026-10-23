import { createSlice } from "@reduxjs/toolkit";

// Matches RTK Query actions BY NAME (importing authApi here would create an import cycle)
const endpointFulfilled = (name) => (a) => a.type.endsWith("/fulfilled") && a.meta?.arg?.endpointName === name;
const endpointRejected = (name) => (a) => a.type.endsWith("/rejected") && a.meta?.arg?.endpointName === name;

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, isHydrated: false, notice: null },
  reducers: {
    // optional payload = a message to show on the login page ("Your account has been suspended…")
    logout(state, { payload }) {
      state.user = null;
      state.notice = payload ?? null;
    },
    clearNotice(state) {
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(endpointFulfilled("getMe"), (state, { payload }) => {
        state.user = payload.user;
        state.isHydrated = true;
      })
      .addMatcher(endpointRejected("getMe"), (state, action) => {
        state.user = null;
        state.isHydrated = true;
        if (action.payload?.data?.error?.code === "ACCOUNT_SUSPENDED") {
          state.notice = "Your account has been suspended. Contact support if you think this is a mistake.";
        }
      })
      .addMatcher(endpointFulfilled("login"), (state, { payload }) => {
        state.user = payload.user;
        state.notice = null;
      })
      .addMatcher(endpointFulfilled("logout"), (state) => {
        state.user = null;
      });
  },
});

export const { logout, clearNotice } = authSlice.actions;
export const selectUser = (s) => s.auth.user;
export const selectRole = (s) => s.auth.user?.role ?? null;
export const selectIsHydrated = (s) => s.auth.isHydrated;
export const selectNotice = (s) => s.auth.notice;
export default authSlice.reducer;
