import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../ui/AppText';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { addDoubleWicketResult } from '../../services/doubleWicketService';

type Props = {
  visible: boolean;
  seriesId: string;
  onClose: () => void;
  suggestedPlace: number;
};

export default function NewDoubleWicketResultModal({
  visible,
  seriesId,
  onClose,
  suggestedPlace,
}: Props) {
  const insets = useSafeAreaInsets();
  const [placeInput, setPlaceInput] = useState(String(suggestedPlace));
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [dateLabel, setDateLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPlaceInput(String(suggestedPlace));
      setP1('');
      setP2('');
      setDateLabel('');
      setNotes('');
      setFormError(null);
    }
  }, [visible, suggestedPlace]);

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSave() {
    setFormError(null);
    const place = parseInt(placeInput.replace(/\D/g, ''), 10);
    if (!Number.isFinite(place) || place < 1) {
      setFormError('Enter a valid place (1, 2, 3, …).');
      return;
    }
    if (!p1.trim() || !p2.trim()) {
      setFormError('Enter both player names.');
      return;
    }
    setSaving(true);
    try {
      await addDoubleWicketResult({
        seriesId,
        place,
        player1Name: p1.trim(),
        player2Name: p2.trim(),
        dateLabel: dateLabel.trim() || '—',
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <View style={styles.handle} />
            <AppText variant="title2" style={styles.sheetTitle}>
              Add double-wicket result
            </AppText>
            <AppText variant="callout" style={styles.sheetSubtitle}>
              Place, both names, and an optional date label (e.g. 14-05-2025).
            </AppText>
            <TextField
              label="Place (rank)"
              value={placeInput}
              onChangeText={setPlaceInput}
              keyboardType="number-pad"
              editable={!saving}
            />
            <TextField
              label="Player 1"
              value={p1}
              onChangeText={setP1}
              placeholder="e.g. Rizwan"
              autoCapitalize="words"
              editable={!saving}
            />
            <TextField
              label="Player 2"
              value={p2}
              onChangeText={setP2}
              placeholder="e.g. Zeeshan"
              autoCapitalize="words"
              editable={!saving}
            />
            <TextField
              label="Date label (optional)"
              value={dateLabel}
              onChangeText={setDateLabel}
              placeholder="e.g. 14-05-2025"
              editable={!saving}
            />
            <TextField
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Date not confirmed"
              editable={!saving}
            />
            {formError ? (
              <AppText variant="caption" color="danger" style={styles.formError}>
                {formError}
              </AppText>
            ) : null}
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
                <Button label="Save" loading={saving} onPress={handleSave} fullWidth />
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
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
  sheetSubtitle: { marginBottom: spacing.md, color: colors.textMuted },
  formError: { marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionGrow: { flex: 1 },
});
