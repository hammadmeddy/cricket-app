import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAppSelector } from '../store/hooks';

export default function SquadsScreen() {
  const role = useAppSelector((s) => s.app.role);
  const canEdit = role === 'admin';

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Teams & players</Text>
      <Text style={styles.body}>
        {canEdit
          ? 'Create Team A / Team B, add players with roles and photos (Storage), and keep stats documents in sync from match events.'
          : 'Browse squads, open player profiles, and see career aggregates (read-only).'}
      </Text>
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
  },
});
