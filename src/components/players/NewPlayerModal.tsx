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
import SegmentedControl from '../ui/SegmentedControl';
import TextField from '../ui/TextField';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { createPlayerRecord, updatePlayerRecord } from '../../services/playersService';
import type { Player, PlayerRole } from '../../types/models';

type Props = {
  visible: boolean;
  teamId: string;
  onClose: () => void;
  /** When set, modal edits this player instead of creating a new one. */
  playerToEdit?: Player | null;
};

const ROLE_OPTIONS: { value: PlayerRole; label: string }[] = [
  { value: 'batsman', label: 'Bat' },
  { value: 'bowler', label: 'Bowl' },
  { value: 'all-rounder', label: 'AR' },
];

export default function NewPlayerModal({
  visible,
  teamId,
  onClose,
  playerToEdit = null,
}: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [role, setRole] = useState<PlayerRole>('batsman');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const isEdit = Boolean(playerToEdit);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (playerToEdit) {
      setName(playerToEdit.name);
      setRole(playerToEdit.role);
      setFormError(null);
      setNameError(null);
    } else {
      setName('');
      setRole('batsman');
      setFormError(null);
      setNameError(null);
    }
  }, [visible, playerToEdit]);

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSave() {
    setFormError(null);
    setNameError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Enter the player’s name.');
      return;
    }
    setSaving(true);
    try {
      if (playerToEdit) {
        await updatePlayerRecord(playerToEdit.id, trimmed, role);
      } else {
        await createPlayerRecord(teamId, trimmed, role);
      }
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save player.');
    } finally {
      setSaving(false);
    }
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
              {isEdit ? 'Edit player' : 'New player'}
            </AppText>
            <AppText variant="callout" style={styles.sheetSubtitle}>
              {isEdit
                ? 'Update name and primary role for line-ups and stats.'
                : 'Add a squad member and set their primary role for line-ups and stats.'}
            </AppText>
            <TextField
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Alex Khan"
              autoCapitalize="words"
              editable={!saving}
              error={nameError}
            />
            <AppText variant="label" style={styles.roleLabel}>
              Role
            </AppText>
            <SegmentedControl<PlayerRole>
              options={ROLE_OPTIONS}
              value={role}
              onChange={setRole}
              accessibilityLabel="Player role"
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
                <Button
                  label={isEdit ? 'Save changes' : 'Add player'}
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
    maxHeight: '88%',
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
  sheetSubtitle: { marginBottom: spacing.lg },
  roleLabel: { marginBottom: spacing.sm },
  formError: { marginTop: spacing.md, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionGrow: { flex: 1 },
});
