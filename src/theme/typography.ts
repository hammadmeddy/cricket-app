import type { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: colors.text,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: colors.text,
    letterSpacing: -0.25,
  },
  title2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: colors.text,
  },
  title3: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: colors.text,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: colors.text,
  },
  callout: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: colors.textMuted,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: colors.textMuted,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
} as const;

export type TypographyVariant = keyof typeof typography;
