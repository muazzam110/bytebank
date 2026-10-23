import { createSlice } from "@reduxjs/toolkit";

export const uiInitialState = {
  balanceHidden: false,
  sidebarCollapsed: false,
  reduceEffects: false,
  welcomeSeenFor: [], // user ids who already saw the welcome sparkles
};

const uiSlice = createSlice({
  name: "ui",
  initialState: uiInitialState,
  reducers: {
    toggleBalanceHidden(state) {
      state.balanceHidden = !state.balanceHidden;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setReduceEffects(state, { payload }) {
      state.reduceEffects = Boolean(payload);
    },
    markWelcomeSeen(state, { payload: userId }) {
      if (!state.welcomeSeenFor.includes(userId)) state.welcomeSeenFor.push(userId);
    },
  },
});

export const { toggleBalanceHidden, toggleSidebar, setReduceEffects, markWelcomeSeen } = uiSlice.actions;
export default uiSlice.reducer;
