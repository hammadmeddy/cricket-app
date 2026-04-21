import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function LeadersScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Leaderboards</Text>
      <Text style={styles.body}>
        Top batsmen (runs, strike rate), top bowlers (wickets, economy), player
        of the match, and team W/L — sourced from aggregated `stats`
        documents maintained by Cloud Functions or batched writes after each
        match.
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
