import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  children: ReactNode;
  scroll?: boolean;
};

export default function Screen({ children, scroll }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, spacing.md) + spacing.xl;

  if (scroll) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.flex, styles.content, { paddingBottom: bottomPad }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
  },
});
