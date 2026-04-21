import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function FixturesScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Series & fixtures</Text>
      <Text style={styles.body}>
        Series: best-of 3 / 5 / 7, overs per innings (5–6), scheduled matches,
        toss, batting order, and final results — each backed by Firestore
        documents under `series` and `matches`.
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
