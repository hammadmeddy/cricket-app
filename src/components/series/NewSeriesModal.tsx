import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../ui/AppText';
import Button from '../ui/Button';
import SegmentedControl from '../ui/SegmentedControl';
import TextField from '../ui/TextField';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { clampOversPerInnings, OVERS_PER_INNINGS_MAX, OVERS_PER_INNINGS_MIN } from '../../lib/matchOvers';
import { createSeriesRecord } from '../../services/seriesService';
import type { SeriesFormat, Team } from '../../types/models';

type Props = {
  visible: boolean;
  onClose: () => void;
  teams: Team[];
};

const FORMAT_OPTIONS: { value: SeriesFormat; label: string }[] = [
  { value: 'best-of-3', label: 'Bo3' },
  { value: 'best-of-5', label: 'Bo5' },
  { value: 'best-of-7', label: 'Bo7' },
  { value: 'test', label: 'Test' },
  { value: 'double-wicket', label: 'DW' },
];

export default function NewSeriesModal({ visible, onClose, teams }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [format, setFormat] = useState<SeriesFormat>('best-of-3');
  const [oversInput, setOversInput] = useState('6');
  const [teamAId, setTeamAId] = useState<string | null>(null);
  const [teamBId, setTeamBId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setFormat('best-of-3');
      setOversInput('6');
      setTeamAId(null);
      setTeamBId(null);
      setFormError(null);
    }
  }, [visible]);

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSave() {
    setFormError(null);
    if (teams.length < 2) {
      setFormError('Create at least two teams in Squads first.');
      return;
    }
    if (!teamAId || !teamBId) {
      setFormError('Select both teams.');
      return;
    }
    if (teamAId === teamBId) {
      setFormError('Team A and Team B must be different.');
      return;
    }
    const oversParsed = parseInt(oversInput.replace(/\D/g, ''), 10);
    const oversPerInnings = clampOversPerInnings(
      Number.isFinite(oversParsed) ? oversParsed : 6
    );
    const ta = teams.find((t) => t.id === teamAId);
    const tb = teams.find((t) => t.id === teamBId);
    if (!ta || !tb) {
      setFormError('Invalid team selection.');
      return;
    }
    setSaving(true);
    try {
      await createSeriesRecord({
        name: name.trim() || 'Series',
        format,
        teamAId: ta.id,
        teamBId: tb.id,
        teamAName: ta.name,
        teamBName: tb.name,
        oversPerInnings,
      });
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not create series.');
    } finally {
      setSaving(false);
    }
  }

  function renderTeamChip(team: Team, side: 'A' | 'B') {
    const selected = side === 'A' ? teamAId === team.id : teamBId === team.id;
    return (
      <Pressable
        key={`${side}-${team.id}`}
        onPress={() => {
          if (side === 'A') {
            setTeamAId(team.id);
          } else {
            setTeamBId(team.id);
          }
        }}
        style={[styles.chip, selected && styles.chipSelected]}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${side === 'A' ? 'Team A' : 'Team B'} ${team.name}`}
      >
        <AppText variant="callout" style={[styles.chipText, selected && styles.chipTextOn]}>
          {team.name}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropTouchable}
            onPress={handleClose}
            accessibilityLabel="Dismiss"
          />
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            accessibilityViewIsModal
          >
            <View style={styles.handle} accessibilityElementsHidden />
            <AppText variant="title2" style={styles.sheetTitle}>
              New series
            </AppText>
            <AppText variant="callout" style={styles.sheetSubtitle}>
              Tie two squads with a format. Double-wicket tournaments track winning pairs on the
              series screen; other formats use scheduled matches and the scorecard.
            </AppText>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              <TextField
                label="Series name (optional)"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Weekend championship"
                autoCapitalize="words"
                editable={!saving}
              />
              <AppText variant="label" style={styles.blockLabel}>
                Format
              </AppText>
              <SegmentedControl<SeriesFormat>
                options={FORMAT_OPTIONS}
                value={format}
                onChange={setFormat}
                accessibilityLabel="Series format"
              />
              <TextField
                label={`Overs per innings (${OVERS_PER_INNINGS_MIN}–${OVERS_PER_INNINGS_MAX})`}
                value={oversInput}
                onChangeText={setOversInput}
                placeholder="e.g. 5, 6, 10, 20"
                keyboardType="number-pad"
                editable={!saving}
              />
              <AppText variant="caption" style={styles.hintBelowField}>
                Each innings is capped at this many overs (six legal balls per over).
              </AppText>
              <AppText variant="label" style={styles.blockLabel}>
                Team A
              </AppText>
              <View style={styles.chipWrap}>{teams.map((t) => renderTeamChip(t, 'A'))}</View>
              <AppText variant="label" style={styles.blockLabel}>
                Team B
              </AppText>
              <View style={styles.chipWrap}>{teams.map((t) => renderTeamChip(t, 'B'))}</View>
              {formError ? (
                <AppText variant="caption" color="danger" style={styles.formError}>
                  {formError}
                </AppText>
              ) : null}
            </ScrollView>
            <View style={styles.actions}>
              <View style={styles.actionGrow}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={handleClose}
                  disabled={saving}
                  fullWidth
                />
              </View>
              <View style={styles.actionGrow}>
                <Button label="Create series" loading={saving} onPress={handleSave} fullWidth />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  backdropTouchable: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  sheetTitle: { marginBottom: spacing.sm },
  sheetSubtitle: { marginBottom: spacing.md },
  scroll: { maxHeight: 420 },
  blockLabel: { marginTop: spacing.md, marginBottom: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  chipText: { color: colors.textMuted },
  chipTextOn: { color: colors.text, fontWeight: '600' },
  hintBelowField: { marginTop: spacing.xs, color: colors.textMuted, marginBottom: spacing.xs },
  formError: { marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionGrow: { flex: 1 },
});
