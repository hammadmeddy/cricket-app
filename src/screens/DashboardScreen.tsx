import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setRole } from '../store/slices/appSlice';
import { isFirebaseConfigured } from '../config/firebase';

export default function DashboardScreen() {
  const role = useAppSelector((s) => s.app.role);
  const dispatch = useAppDispatch();
  const firebaseReady = isFirebaseConfigured();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Club overview</Text>
      <Text style={styles.body}>
        Totals for matches, active series, and team form will live here with
        Firestore listeners.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Signed-in role (local demo)</Text>
        <Text style={styles.cardValue}>{role}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, role === 'player' && styles.chipActive]}
            onPress={() => dispatch(setRole('player'))}
          >
            <Text style={styles.chipText}>Player</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, role === 'admin' && styles.chipActive]}
            onPress={() => dispatch(setRole('admin'))}
          >
            <Text style={styles.chipText}>Admin</Text>
          </Pressable>
        </View>
      </View>
      <View style={[styles.banner, !firebaseReady && styles.bannerWarn]}>
        <Text style={styles.bannerText}>
          {firebaseReady
            ? 'Firebase config detected.'
            : 'Set EXPO_PUBLIC_FIREBASE_* env vars to enable Firestore.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 8,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  cardValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  banner: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerWarn: { borderColor: colors.warning },
  bannerText: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});
