import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import AppText from './AppText';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
};

const MIN_TOUCH = 48;

export default function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  fullWidth,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  const labelColor =
    variant === 'primary' || variant === 'danger' ? colors.onAccent : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      accessibilityLabel={label}
      disabled={isDisabled}
      style={(state) => {
        const resolved =
          typeof style === 'function' ? style(state) : style;
        return [
          styles.base,
          fullWidth && styles.fullWidth,
          variant === 'primary' && styles.primary,
          variant === 'secondary' && styles.secondary,
          variant === 'ghost' && styles.ghost,
          variant === 'danger' && styles.danger,
          isDisabled && styles.disabled,
          state.pressed && !isDisabled && styles.pressed,
          resolved,
        ];
      }}
      android_ripple={
        variant === 'primary' || variant === 'danger'
          ? { color: 'rgba(255,255,255,0.2)' }
          : { color: 'rgba(45,157,95,0.25)' }
      }
      {...rest}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={labelColor} />
        ) : (
          <AppText variant="callout" style={[styles.labelText, { color: labelColor }]}>
            {label}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullWidth: { alignSelf: 'stretch' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  labelText: { fontWeight: '600', color: colors.text },
  primary: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.45 },
});
