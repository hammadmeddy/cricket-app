import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAppSelector } from '../store/hooks';

export default function LiveScreen() {
  const role = useAppSelector((s) => s.app.role);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Live scoring</Text>
      <Text style={styles.body}>
        Ball-by-ball (0–6, extras, wickets) with batsman/bowler tallies, team
        totals, and a real-time `scores` subcollection for all connected
        clients.
      </Text>
      {role !== 'admin' ? (
        <Text style={styles.hint}>
          Only admins start or advance innings; players follow the live card
          here.
        </Text>
      ) : null}
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
    marginBottom: 12,
  },
  hint: {
    color: colors.warning,
    fontSize: 14,
    lineHeight: 20,
  },
});
