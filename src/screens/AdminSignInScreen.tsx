import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminSignIn'>;

function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled in Firebase. Enable it under Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return code ? `Could not sign in (${code}).` : 'Something went wrong. Please try again.';
  }
}

export default function AdminSignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Firebase is not configured.');
      return;
    }
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Enter email and password.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, trimmed, password);
      navigation.goBack();
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      setError(mapAuthError(code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        <AppText variant="title1" style={styles.title}>
          Staff sign in
        </AppText>
        <AppText variant="callout" style={styles.subtitle}>
          Sign in with a Firebase email/password (or any non-guest) account to manage series, teams,
          matches, and scoring. Guests who only open the app stay on anonymous sign-in and are
          read-only. Firestore users (uid) role admin is only needed for a few user-document actions
          in the console.
        </AppText>
        <TextField
          label="Admin email"
          value={email}
          onChangeText={setEmail}
          placeholder="admin@yourclub.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!busy}
          autoComplete="email"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          editable={!busy}
          autoComplete="password"
        />
        {error ? (
          <AppText variant="caption" color="danger" style={styles.error}>
            {error}
          </AppText>
        ) : null}
        <Button label="Sign in" loading={busy} onPress={handleSignIn} disabled={busy} fullWidth />
        <View style={styles.spacer} />
        <Button
          label="Cancel"
          variant="secondary"
          onPress={() => navigation.goBack()}
          disabled={busy}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.xxl, color: colors.textMuted },
  error: { marginBottom: spacing.lg },
  spacer: { height: spacing.md },
});
