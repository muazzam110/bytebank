import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "@/api/baseApi";
import authReducer from "@/features/auth/authSlice";
import uiReducer, { uiInitialState } from "@/features/ui/uiSlice";
import transferDraftReducer from "@/features/transfer/transferDraftSlice";
import transactionsFilterReducer from "@/features/transactions/transactionsFilterSlice";

const STORAGE_KEY = "bb_ui";

// Read saved UI prefs, keeping ONLY known keys (so junk in localStorage can't leak into state)
function loadUi() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return Object.fromEntries(Object.keys(uiInitialState).filter((k) => k in saved).map((k) => [k, saved[k]]));
  } catch {
    return {};
  }
}

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    ui: uiReducer,
    transferDraft: transferDraftReducer, // memory only: NOT persisted
    transactionsFilter: transactionsFilterReducer, // memory only, mirrored to the URL
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  preloadedState: { ui: { ...uiInitialState, ...loadUi() } },
});

// Needed so `skipPollingIfUnfocused` can actually see when the tab loses focus
setupListeners(store.dispatch);

// Persist ONLY the ui slice, and only when it changed. Never balances, never user data.
let previous = store.getState().ui;
store.subscribe(() => {
  const current = store.getState().ui;
  if (current === previous) return;
  previous = current;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* storage full/blocked */
  }
});
