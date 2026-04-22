import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthUser = {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
};

type AuthState = {
  ready: boolean;
  user: AuthUser | null;
  /** After staff sign-out, Firebase user is briefly null while we re-sign anonymously — unmount data screens to avoid permission errors. */
  reconnectingGuest: boolean;
};

const initialState: AuthState = {
  ready: false,
  user: null,
  reconnectingGuest: false,
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
      state.reconnectingGuest = false;
    },
    beginGuestSessionReconnect(state) {
      state.reconnectingGuest = true;
      state.user = null;
      state.ready = true;
    },
    failGuestSessionReconnect(state) {
      state.reconnectingGuest = false;
      state.user = null;
      state.ready = true;
    },
  },
});

export const { setAuthFromFirebase, beginGuestSessionReconnect, failGuestSessionReconnect } =
  authSlice.actions;
export default authSlice.reducer;
