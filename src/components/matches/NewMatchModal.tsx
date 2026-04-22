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
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../ui/AppText';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import {
  OVERS_PER_INNINGS_MAX,
  OVERS_PER_INNINGS_MIN,
  clampOversPerInnings,
} from '../../lib/matchOvers';
import { createMatchRecord, updateMatchFixture } from '../../services/matchesService';
import type { Match, Series } from '../../types/models';

type Props = {
  visible: boolean;
  onClose: () => void;
  series: Series | null;
  /** When set, modal edits this fixture instead of creating a new one. */
  matchToEdit?: Match | null;
};

function atNoon(d: Date): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

function formatMatchDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function NewMatchModal({
  visible,
  onClose,
  series,
  matchToEdit = null,
}: Props) {
  const insets = useSafeAreaInsets();
  const [matchDate, setMatchDate] = useState(() => atNoon(new Date()));
  const [venue, setVenue] = useState('');
  const [oversStr, setOversStr] = useState('6');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !series) {
      return;
    }
    setFormError(null);
    if (matchToEdit) {
      const t = matchToEdit.scheduledAt;
      if (t && typeof t.toDate === 'function') {
        setMatchDate(atNoon(t.toDate()));
      } else {
        setMatchDate(atNoon(new Date()));
      }
      setVenue(matchToEdit.venue ?? '');
      setOversStr(String(matchToEdit.oversPerInnings));
    } else {
      setMatchDate(atNoon(new Date()));
      setVenue('');
      setOversStr(String(series.oversPerInnings));
    }
  }, [visible, series, matchToEdit]);

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  function openAndroidDatePicker() {
    DateTimePickerAndroid.open({
      value: matchDate,
      mode: 'date',
      onChange: (_event, date) => {
        if (date) {
          setMatchDate(atNoon(date));
        }
      },
    });
  }

  async function handleSave() {
    setFormError(null);
    if (!series) {
      setFormError('Series is not loaded.');
      return;
    }
    const parsedOvers = parseInt(oversStr.replace(/\D/g, ''), 10);
    const oversPerInnings = clampOversPerInnings(
      Number.isFinite(parsedOvers) ? parsedOvers : series.oversPerInnings
    );
    setSaving(true);
    try {
      if (matchToEdit) {
        await updateMatchFixture(matchToEdit.id, {
          scheduledAt: Timestamp.fromDate(atNoon(matchDate)),
          venue: venue.trim(),
          oversPerInnings,
        });
      } else {
        await createMatchRecord({
          seriesId: series.id,
          teamAId: series.teamAId,
          teamBId: series.teamBId,
          teamAName: series.teamAName,
          teamBName: series.teamBName,
          scheduledAt: Timestamp.fromDate(atNoon(matchDate)),
          oversPerInnings,
          venue: venue.trim(),
        });
      }
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not create match.');
    } finally {
      setSaving(false);
    }
  }

  if (!series) {
    return null;
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
              {matchToEdit ? 'Edit fixture' : 'Schedule match'}
            </AppText>
            <AppText variant="callout" style={styles.sheetSubtitle}>
              {series.teamAName} vs {series.teamBName}. Series default is {series.oversPerInnings}{' '}
              overs per innings — you can set a different length for this fixture before the match
              goes live.
            </AppText>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scroll}
            >
              <AppText variant="label" style={styles.dateLabel}>
                Match date
              </AppText>
              {Platform.OS === 'ios' ? (
                <View style={styles.pickerWrap}>
                  <DateTimePicker
                    value={matchDate}
                    mode="date"
                    display="inline"
                    onChange={(_, date) => {
                      if (date) {
                        setMatchDate(atNoon(date));
                      }
                    }}
                    themeVariant="dark"
                  />
                </View>
              ) : (
                <Pressable
                  onPress={openAndroidDatePicker}
                  style={styles.androidDateBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Choose match date"
                >
                  <AppText variant="callout" style={styles.androidDateLabel}>
                    {formatMatchDate(matchDate)}
                  </AppText>
                  <AppText variant="caption">Tap to change date</AppText>
                </Pressable>
              )}

              <TextField
                label={`Overs per innings (${OVERS_PER_INNINGS_MIN}–${OVERS_PER_INNINGS_MAX})`}
                value={oversStr}
                onChangeText={setOversStr}
                placeholder="e.g. 5 or 20"
                keyboardType="number-pad"
                editable={!saving}
              />

              <TextField
                label="Venue (optional)"
                value={venue}
                onChangeText={setVenue}
                placeholder="e.g. North ground"
                autoCapitalize="words"
                editable={!saving}
              />
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
                <Button
                  label={matchToEdit ? 'Save changes' : 'Add match'}
                  loading={saving}
                  onPress={handleSave}
                  fullWidth
                />
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
  scroll: { maxHeight: 380, marginBottom: spacing.sm },
  dateLabel: { marginBottom: spacing.sm },
  pickerWrap: {
    marginBottom: spacing.md,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  androidDateBtn: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  androidDateLabel: { fontWeight: '600', marginBottom: spacing.xs },
  formError: { marginTop: spacing.sm, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionGrow: { flex: 1 },
});
