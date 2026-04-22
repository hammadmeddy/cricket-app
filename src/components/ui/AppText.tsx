import { Text, type TextProps, type TextStyle } from 'react-native';
import { typography, type TypographyVariant } from '../../theme/typography';
import { colors } from '../../theme/colors';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: keyof typeof colors | (string & {});
};

export default function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: Props) {
  const base = typography[variant];
  const colorStyle: TextStyle | undefined =
    color && color in colors ? { color: colors[color as keyof typeof colors] } : color ? { color: String(color) } : undefined;

  return (
    <Text style={[base, colorStyle, style]} allowFontScaling {...rest}>
      {children}
    </Text>
  );
}
