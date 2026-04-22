import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import AppText from './AppText';
import Button from './Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon?: IconName;
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
};

export default function EmptyState({
  icon = 'people-outline',
  title,
  description,
  action,
}: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="none">
      <Ionicons
        name={icon}
        size={44}
        color={colors.textMuted}
        style={styles.icon}
        accessibilityElementsHidden
      />
      <AppText variant="title3" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="callout" style={styles.desc}>
        {description}
      </AppText>
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="secondary"
          fullWidth
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.md,
  },
  icon: { marginBottom: spacing.lg },
  title: { textAlign: 'center', marginBottom: spacing.sm },
  desc: { textAlign: 'center', marginBottom: spacing.xl, maxWidth: 320 },
});
