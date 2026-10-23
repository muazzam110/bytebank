import { createSlice } from "@reduxjs/toolkit";
import { logout } from "@/features/auth/authSlice";

const initialState = {
  step: 1, // 1 Recipient · 2 Amount · 3 Review  (4 = Result is shown by the page)
  recipient: null, // { accountId, name, maskedAccountNumber }
  amountInput: "", // what the user typed, as a STRING
  description: "",
  idempotencyKey: null, // minted when entering Review; reused only to RETRY the same attempt
  startedAt: null,
};

// crypto.randomUUID only exists on https/localhost. getRandomValues works everywhere (e.g. phone on LAN).
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// The Logout BUTTON path doesn't dispatch the `logout` action (only the 401 handler does),
// so we also listen for the logout MUTATION finishing. Otherwise a draft would survive logout.
const isLogoutFulfilled = (a) => a.type.endsWith("/fulfilled") && a.meta?.arg?.endpointName === "logout";

const transferDraftSlice = createSlice({
  name: "transferDraft",
  initialState,
  reducers: {
    // Reducers must be PURE (no Date.now / random inside). `prepare` runs first and may be impure.
    selectRecipient: {
      reducer(state, { payload }) {
        state.recipient = payload.recipient;
        state.step = 2;
        state.startedAt ??= payload.now;
      },
      prepare: (recipient) => ({ payload: { recipient, now: Date.now() } }),
    },
    setAmount(state, { payload }) {
      state.amountInput = payload;
    },
    setDescription(state, { payload }) {
      state.description = payload;
    },
    goToStep(state, { payload }) {
      state.step = payload;
    },
    createAttemptKey: {
      reducer(state, { payload }) {
        state.idempotencyKey = payload;
      },
      prepare: () => ({ payload: uuid() }),
    },
    resetDraft: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState).addMatcher(isLogoutFulfilled, () => initialState);
  },
});

export const { selectRecipient, setAmount, setDescription, goToStep, createAttemptKey, resetDraft } =
  transferDraftSlice.actions;
export default transferDraftSlice.reducer;
