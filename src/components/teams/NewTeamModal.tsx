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
import { createTeamRecord, updateTeamRecord } from '../../services/teamsService';
import type { Team } from '../../types/models';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** When set, modal edits this team instead of creating a new one. */
  teamToEdit?: Team | null;
};

export default function NewTeamModal({ visible, onClose, teamToEdit = null }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const isEdit = Boolean(teamToEdit);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (teamToEdit) {
      setName(teamToEdit.name);
      setShortCode(teamToEdit.shortCode ?? '');
      setFormError(null);
      setNameError(null);
    } else {
      setName('');
      setShortCode('');
      setFormError(null);
      setNameError(null);
    }
  }, [visible, teamToEdit]);

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
      setNameError('Enter a team name.');
      return;
    }
    setSaving(true);
    try {
      if (teamToEdit) {
        await updateTeamRecord(teamToEdit.id, trimmed, shortCode);
      } else {
        await createTeamRecord(trimmed, shortCode);
      }
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save team.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
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
              {isEdit ? 'Edit team' : 'New team'}
            </AppText>
            <AppText variant="callout" style={styles.sheetSubtitle}>
              {isEdit
                ? 'Update the display name and short code used in lists and scorecards.'
                : 'Add a squad for fixtures and stats. Short code appears on compact UI (max 6 characters).'}
            </AppText>
            <TextField
              label="Team name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. North XI"
              autoCapitalize="words"
              editable={!saving}
              error={nameError}
            />
            <TextField
              label="Short code (optional)"
              value={shortCode}
              onChangeText={(t) => setShortCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. NXI"
              autoCapitalize="characters"
              maxLength={6}
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
                <Button
                  label={isEdit ? 'Save changes' : 'Create team'}
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
    paddingBottom: spacing.lg,
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
  formError: { marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionGrow: { flex: 1 },
});
