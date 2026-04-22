import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '../../types/models';

type AppState = {
  role: UserRole;
};

const initialState: AppState = {
  /** Synced from Firestore `users/{uid}.role` (admin vs read-only). Default until profile loads. */
  role: 'player',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<UserRole>) {
      state.role = action.payload;
    },
  },
});

export const { setRole } = appSlice.actions;
export default appSlice.reducer;
