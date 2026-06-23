/**
 * ScreenHeader — consistent top bar for tab screens (headerShown: false).
 * Handles safe area inset automatically.
 * Props:
 *   title    string   — screen title (right side)
 *   left     node     — left slot (back button, logo, etc.)
 *   right    node     — right slot (action button)
 *   noBorder bool     — hide bottom border
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY } from '../utils/theme';
import { ms } from '../utils/responsive';

export default function ScreenHeader({ title, left, right, noBorder = false }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      s.bar,
      { paddingTop: insets.top + ms(10) },
      !noBorder && s.border,
    ]}>
      <View style={s.left}>{left  || <View style={s.slot} />}</View>
      {title ? <Text style={s.title} numberOfLines={1}>{title}</Text> : <View style={s.titlePlaceholder} />}
      <View style={s.right}>{right || <View style={s.slot} />}</View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingBottom:   ms(10),
    paddingHorizontal: ms(16),
    backgroundColor: COLORS.deep2,
  },
  border: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  left:             { width: ms(80), alignItems: 'flex-start' },
  right:            { width: ms(80), alignItems: 'flex-end' },
  slot:             { width: ms(40) },
  titlePlaceholder: { flex: 1 },
  title: {
    flex: 1,
    textAlign:  'center',
    ...TYPOGRAPHY.h4,
    color: COLORS.goldLight,
    letterSpacing: 0.3,
  },
});
