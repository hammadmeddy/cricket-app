import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthUser = {
  uid: string;
  email: string | null;
};

type AuthState = {
  ready: boolean;
  user: AuthUser | null;
};

const initialState: AuthState = {
  ready: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthFromFirebase(
      state,
      action: PayloadAction<{ user: AuthUser | null }>
    ) {
      state.ready = true;
      state.user = action.payload.user;
    },
  },
});

export const { setAuthFromFirebase } = authSlice.actions;
export default authSlice.reducer;
