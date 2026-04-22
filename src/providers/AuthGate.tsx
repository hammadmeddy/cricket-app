import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import AppText from '../components/ui/AppText';
import {
  getFirebaseAuth,
  getFirebaseApp,
  getFirestoreDb,
  isFirebaseConfigured,
} from '../config/firebase';
import { collections } from '../config/firestorePaths';
import {
  beginGuestSessionReconnect,
  failGuestSessionReconnect,
  setAuthFromFirebase,
} from '../store/slices/authSlice';
import { setRole } from '../store/slices/appSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { syncUserProfileToFirestore } from '../services/syncUserProfile';
import RootNavigator from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export default function AuthGate() {
  const dispatch = useAppDispatch();
  const { ready, user, reconnectingGuest } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isFirebaseConfigured() || !getFirebaseApp()) {
      dispatch(setAuthFromFirebase({ user: null }));
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      dispatch(setAuthFromFirebase({ user: null }));
      return;
    }
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) {
        return;
      }
      if (firebaseUser) {
        const profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          isAnonymous: firebaseUser.isAnonymous,
        };
        dispatch(setAuthFromFirebase({ user: profile }));
        try {
          await syncUserProfileToFirestore(
            profile.uid,
            profile.email,
            profile.isAnonymous
          );
        } catch {
          // Firestore rules or network; session stays
        }
        return;
      }
      dispatch(beginGuestSessionReconnect());
      try {
        await signInAnonymously(auth);
      } catch {
        if (!cancelled) {
          dispatch(failGuestSessionReconnect());
        }
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [dispatch]);

  useEffect(() => {
    const db = getFirestoreDb();
    if (!user?.uid || !db) {
      dispatch(setRole('player'));
      return;
    }
    const ref = doc(db, collections.users, user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const role = snap.data()?.role === 'admin' ? 'admin' : 'player';
        dispatch(setRole(role));
      },
      () => {
        dispatch(setRole('player'));
      }
    );
    return unsub;
  }, [dispatch, user?.uid]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !getFirebaseApp()) {
      SplashScreen.hideAsync().catch(() => {});
      return;
    }
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!isFirebaseConfigured() || !getFirebaseApp()) {
    return (
      <View style={styles.centered}>
        <AppText variant="title2" style={styles.centerTitle}>
          Configuration needed
        </AppText>
        <AppText variant="callout" style={styles.centerBody}>
          Add your Firebase web keys to `.env` as EXPO_PUBLIC_FIREBASE_* and restart Expo.
        </AppText>
      </View>
    );
  }

  if (!ready) {
    return null;
  }

  if (reconnectingGuest) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <AppText variant="callout" style={styles.reconnectingText}>
          Returning to guest mode…
        </AppText>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <AppText variant="title2" style={styles.centerTitle}>
          Could not start guest session
        </AppText>
        <AppText variant="callout" style={styles.centerBody}>
          Enable Anonymous sign-in in Firebase Console → Authentication → Sign-in method, then
          restart the app.
        </AppText>
      </View>
    );
  }

  return <RootNavigator />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  centerTitle: { marginBottom: spacing.md, textAlign: 'center' },
  centerBody: { textAlign: 'center', maxWidth: 320 },
  reconnectingText: { marginTop: spacing.md, textAlign: 'center', color: colors.textMuted },
});
