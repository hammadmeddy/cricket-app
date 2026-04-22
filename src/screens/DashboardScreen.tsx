import { useLayoutEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import Screen from '../components/ui/Screen';
import { getFirebaseAuth } from '../config/firebase';
import { useDashboardStats } from '../hooks/useDashboardStats';
import type { TabToStackNavigation } from '../navigation/navigationTypes';
import { useAppSelector } from '../store/hooks';
import type { Match } from '../types/models';
import { formatMatchStatus } from '../lib/matchUi';
import { formatSeriesFormat } from '../lib/seriesUi';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

function formatWhen(m: Match): string {
  if (!m.scheduledAt) {
    return 'TBC';
  }
  try {
    return m.scheduledAt.toDate().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'TBC';
  }
}

export default function DashboardScreen() {
  const navigation = useNavigation<TabToStackNavigation>();
  const authUser = useAppSelector((s) => s.auth.user);
  const isGuest = Boolean(authUser?.isAnonymous);
  const {
    loading,
    error,
    teamCount,
    seriesCount,
    matchCount,
    liveCount,
    nextFixtures,
    recentSeries,
  } = useDashboardStats();

  async function handleSignOut() {
    const auth = getFirebaseAuth();
    if (auth) {
      await signOut(auth);
    }
    try {
      await Updates.reloadAsync();
    } catch {
      // Dev client / environments where reload is unavailable — AuthGate re-signs anonymously.
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: authUser
        ? () => (
            <Pressable
              onPress={() =>
                isGuest
                  ? navigation.navigate('AdminSignIn')
                  : handleSignOut()
              }
              hitSlop={12}
              style={styles.headerIcon}
              accessibilityRole="button"
              accessibilityLabel={isGuest ? 'Staff sign in' : 'Sign out'}
            >
              <Ionicons
                name={isGuest ? 'key-outline' : 'log-out-outline'}
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, authUser, isGuest]);

  return (
    <Screen scroll>
      <AppText variant="title1" style={styles.title}>
        Home
      </AppText>
      <AppText
        variant="callout"
        style={[styles.tagline, !isGuest && styles.taglineSpacing]}
      >
        Fixtures and live matches at a glance.
      </AppText>
      {isGuest ? (
        <AppText variant="caption" style={styles.guestHint}>
          You are browsing as a guest (view only). Staff use the key icon above to sign in.
        </AppText>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      ) : error ? (
        <Card style={styles.block}>
          <AppText variant="callout" color="danger">
            {error}
          </AppText>
        </Card>
      ) : (
        <>
          <Card style={styles.block} padded={false}>
            <View style={styles.statRow}>
              <View style={styles.statCell}>
                <AppText variant="caption" style={styles.statLabel}>
                  Teams
                </AppText>
                <AppText variant="title2" style={styles.statNum}>
                  {teamCount}
                </AppText>
              </View>
              <View style={styles.statRule} />
              <View style={styles.statCell}>
                <AppText variant="caption" style={styles.statLabel}>
                  Series
                </AppText>
                <AppText variant="title2" style={styles.statNum}>
                  {seriesCount}
                </AppText>
              </View>
              <View style={styles.statRule} />
              <View style={styles.statCell}>
                <AppText variant="caption" style={styles.statLabel}>
                  Matches
                </AppText>
                <AppText variant="title2" style={styles.statNum}>
                  {matchCount}
                </AppText>
              </View>
              <View style={styles.statRule} />
              <View style={styles.statCell}>
                <AppText variant="caption" style={styles.statLabel}>
                  Live
                </AppText>
                <AppText
                  variant="title2"
                  style={[styles.statNum, liveCount > 0 && styles.statNumLive]}
                >
                  {liveCount}
                </AppText>
              </View>
            </View>
          </Card>

          {nextFixtures.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="label" style={styles.sectionLabel}>
                Coming up
              </AppText>
              <Card style={styles.block} padded={false}>
                {nextFixtures.map((m, i) => (
                  <Pressable
                    key={m.id}
                    onPress={() =>
                      navigation.navigate('MatchScoring', {
                        matchId: m.id,
                        headerTitle: `${m.teamAName} vs ${m.teamBName}`,
                      })
                    }
                    style={({ pressed }) => [
                      styles.fixtureRow,
                      i < nextFixtures.length - 1 && styles.fixtureRowBorder,
                      pressed && styles.fixturePressed,
                    ]}
                  >
                    <View style={styles.fixtureMain}>
                      <AppText variant="title3" numberOfLines={1} style={styles.fixtureTitle}>
                        {m.teamAName} vs {m.teamBName}
                      </AppText>
                      <AppText variant="caption" style={styles.fixtureMeta}>
                        {formatWhen(m)} · {formatMatchStatus(m.status)}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                ))}
              </Card>
            </View>
          ) : recentSeries.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="label" style={styles.sectionLabel}>
                Series
              </AppText>
              <AppText variant="caption" style={styles.sectionHint}>
                Home lists scheduled matches here. Open a series to add or view matches.
              </AppText>
              <Card style={styles.block} padded={false}>
                {recentSeries.map((s, i) => (
                  <Pressable
                    key={s.id}
                    onPress={() =>
                      navigation.navigate('SeriesDetail', {
                        seriesId: s.id,
                        seriesName: s.name,
                      })
                    }
                    style={({ pressed }) => [
                      styles.fixtureRow,
                      i < recentSeries.length - 1 && styles.fixtureRowBorder,
                      pressed && styles.fixturePressed,
                    ]}
                  >
                    <View style={styles.fixtureMain}>
                      <AppText variant="title3" numberOfLines={1} style={styles.fixtureTitle}>
                        {s.name}
                      </AppText>
                      <AppText variant="callout" numberOfLines={1}>
                        {s.teamAName} vs {s.teamBName}
                      </AppText>
                      <AppText variant="caption" style={styles.fixtureMeta}>
                        {formatSeriesFormat(s.format)} · {s.oversPerInnings} overs
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                ))}
              </Card>
            </View>
          ) : (
            <Card style={styles.block}>
              <AppText variant="callout" style={styles.empty}>
                No fixtures yet. Open Fixtures to create a series, then schedule matches inside it.
              </AppText>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  tagline: {
    marginBottom: spacing.sm,
    color: colors.textMuted,
  },
  taglineSpacing: {
    marginBottom: spacing.xl,
  },
  guestHint: {
    marginBottom: spacing.xl,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  loading: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  block: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  statLabel: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  statNum: {
    fontVariant: ['tabular-nums'],
  },
  statNumLive: {
    color: colors.accent,
  },
  statRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  section: {
    marginTop: spacing.xs,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  sectionHint: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    color: colors.textMuted,
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  fixtureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  fixturePressed: {
    backgroundColor: colors.surfaceMuted,
  },
  fixtureMain: {
    flex: 1,
    minWidth: 0,
  },
  fixtureTitle: {
    fontWeight: '600',
  },
  fixtureMeta: {
    marginTop: 4,
    color: colors.textMuted,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  headerIcon: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
});
