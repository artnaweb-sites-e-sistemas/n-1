import { createSlice } from "@reduxjs/toolkit";

// Carregar dados do localStorage ao inicializar
const loadAuthFromStorage = () => {
  if (typeof window !== "undefined") {
    const authData = localStorage.getItem("auth");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return {
          accessToken: parsed.accessToken || undefined,
          user: parsed.user || undefined,
        };
      } catch (e) {
        return {
          accessToken: undefined,
          user: undefined,
        };
      }
    }
  }
  return {
    accessToken: undefined,
    user: undefined,
  };
};

const initialState = loadAuthFromStorage();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (state, { payload }) => {
      state.accessToken = payload.accessToken;
      state.user = payload.user;
    },
    userLoggedOut: (state) => {
      state.accessToken = undefined;
      state.user = undefined;
      localStorage.removeItem("auth");
    },
  },
});

export const { userLoggedIn, userLoggedOut } = authSlice.actions;
export default authSlice.reducer;
