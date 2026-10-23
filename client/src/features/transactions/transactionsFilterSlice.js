import { createSlice } from "@reduxjs/toolkit";
import { logout } from "@/features/auth/authSlice";
import { DEFAULT_FILTERS } from "./filterConfig";

// same pattern as transferDraftSlice: the Logout BUTTON finishes the logout MUTATION (not the `logout` action)
const isLogoutFulfilled = (a) => a.type.endsWith("/fulfilled") && a.meta?.arg?.endpointName === "logout";

const transactionsFilterSlice = createSlice({
  name: "transactionsFilter",
  initialState: DEFAULT_FILTERS,
  reducers: {
    // changing ANY filter, the sort or the page size sends you back to page 1
    setFilter(state, { payload }) {
      Object.assign(state, payload);
      state.page = 1;
    },
    setPage(state, { payload }) {
      state.page = payload;
    },
    // replace everything from the URL (mount, Back/Forward, pasted link)
    hydrateFilters: (state, { payload }) => ({ ...DEFAULT_FILTERS, ...payload }),
    // "Clear all" keeps your view preferences
    resetFilters: (state) => ({ ...DEFAULT_FILTERS, limit: state.limit, sort: state.sort }),
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => DEFAULT_FILTERS).addMatcher(isLogoutFulfilled, () => DEFAULT_FILTERS);
  },
});

export const { setFilter, setPage, hydrateFilters, resetFilters } = transactionsFilterSlice.actions;
export default transactionsFilterSlice.reducer;
