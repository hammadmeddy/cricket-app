import {
  TextInput,
  View,
  type TextInputProps,
  StyleSheet,
  Platform,
} from 'react-native';
import AppText from './AppText';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export default function TextField({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textDisabled}
        selectionColor={colors.accent}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.select({ ios: 14, default: 12 }),
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { marginTop: spacing.sm },
});
