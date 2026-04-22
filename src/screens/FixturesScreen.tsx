import { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { TabToStackNavigation } from '../navigation/navigationTypes';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Screen from '../components/ui/Screen';
import NewSeriesModal from '../components/series/NewSeriesModal';
import { useSeries } from '../hooks/useSeries';
import { useTeams } from '../hooks/useTeams';
import { formatSeriesFormat } from '../lib/seriesUi';
import { useAppSelector } from '../store/hooks';
import { selectCanManageAppData } from '../store/permissions';
import type { Series } from '../types/models';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';

export default function FixturesScreen() {
  const navigation = useNavigation<TabToStackNavigation>();
  const canEdit = useAppSelector(selectCanManageAppData);
  const { series, loading, error } = useSeries();
  const { teams } = useTeams();
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canEdit
        ? () => (
            <Pressable
              onPress={() => setSeriesModalOpen(true)}
              hitSlop={12}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="New series"
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.accent} />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, canEdit]);

  function openSeries(item: Series) {
    navigation.navigate('SeriesDetail', { seriesId: item.id, seriesName: item.name });
  }

  function renderItem({ item }: { item: Series }) {
    return (
      <Card style={styles.card} padded={false}>
        <Pressable
          onPress={() => openSeries(item)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
        >
          <View style={styles.badge}>
            <AppText variant="caption" style={styles.badgeText}>
              {item.oversPerInnings}ov
            </AppText>
          </View>
          <View style={styles.main}>
            <AppText variant="title3">{item.name}</AppText>
            <AppText variant="callout">
              {item.teamAName} vs {item.teamBName}
            </AppText>
            <AppText variant="caption" style={styles.format}>
              {formatSeriesFormat(item.format)} · tap for matches
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </Card>
    );
  }

  return (
    <>
      <Screen scroll={false}>
        <AppText variant="title1" style={styles.heading}>
          Fixtures
        </AppText>
        <AppText variant="callout" style={styles.intro}>
          {canEdit
            ? 'Create a series, pick two teams, then schedule matches with date and venue.'
            : 'Browse series and open one to see scheduled matches.'}
        </AppText>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <AppText variant="callout" style={styles.loadingLabel}>
              Loading series…
            </AppText>
          </View>
        ) : error ? (
          <Card>
            <AppText variant="title3" color="danger">
              Could not load series
            </AppText>
            <AppText variant="callout" style={{ marginTop: spacing.sm }}>
              {error}
            </AppText>
          </Card>
        ) : (
          <FlatList
            style={styles.list}
            data={series}
            keyExtractor={(s) => s.id}
            renderItem={renderItem}
            scrollEnabled={series.length > 4}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            ListEmptyComponent={
              <EmptyState
                icon="trophy-outline"
                title="No series yet"
                description={
                  canEdit
                    ? 'Start a best-of series between two squads, then add match dates from the series screen.'
                    : 'Series will appear here once staff creates them.'
                }
                action={
                  canEdit
                    ? { label: 'New series', onPress: () => setSeriesModalOpen(true) }
                    : undefined
                }
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Screen>
      <NewSeriesModal
        visible={seriesModalOpen}
        teams={teams}
        onClose={() => setSeriesModalOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: spacing.sm },
  intro: { marginBottom: spacing.xl },
  loading: {
    paddingVertical: spacing.xxxl * 2,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingLabel: { marginTop: spacing.sm },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xxxl },
  card: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  pressed: { opacity: 0.88 },
  badge: {
    minWidth: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  badgeText: { fontWeight: '700', color: colors.text },
  main: { flex: 1 },
  format: { marginTop: spacing.xs },
  headerBtn: {
    marginRight: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
