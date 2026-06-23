import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ms } from '../utils/responsive';

/**
 * WederLogo — Diamond W icon + WEDER wordmark
 *
 * Props
 *   variant   : 'sm' | 'md' | 'lg' | 'xl'
 *   horizontal: bool — icon left, text right
 *   iconOnly  : bool — mark only, no text
 *   color     : 'gold' | 'light'   (wordmark colour)
 */

const ICON = require('../../assets/icon.png');

const SIZE = { sm: ms(32), md: ms(48), lg: ms(68), xl: ms(88) };
const FONT = { sm: ms(15), md: ms(22), lg: ms(30), xl: ms(40) };
const TAG  = { sm: 0,      md: ms(8),  lg: ms(10), xl: ms(13) };
const GAP  = { sm: ms(8),  md: ms(12), lg: ms(16), xl: ms(20) };

const PALETTE = {
  gold:  { primary: '#D4A834', bright: '#FFD750', tag: 'rgba(210,164,52,0.55)' },
  light: { primary: '#FDF6EC', bright: '#FFFFFF', tag: 'rgba(253,246,236,0.5)' },
};

export default function WederLogo({
  variant    = 'md',
  horizontal = false,
  iconOnly   = false,
  color      = 'gold',
  style,
}) {
  const sz  = SIZE[variant] || SIZE.md;
  const fn  = FONT[variant] || FONT.md;
  const tg  = TAG[variant]  || TAG.md;
  const gap = GAP[variant]  || GAP.md;
  const pal = PALETTE[color] || PALETTE.gold;

  const mark = (
    <Image
      source={ICON}
      style={{ width: sz, height: sz, borderRadius: sz * 0.12 }}
      resizeMode="cover"
    />
  );

  if (iconOnly) return <View style={style}>{mark}</View>;

  const wordmark = (
    <View style={horizontal ? s.hText : s.vText}>
      <Text style={[s.title, { fontSize: fn, color: pal.bright, letterSpacing: fn * 0.22 }]}>
        WEDER
      </Text>
      {tg > 0 && (
        <Text style={[s.tag, { fontSize: tg, color: pal.tag, letterSpacing: tg * 0.5 }]}>
          WEDDING MANAGEMENT
        </Text>
      )}
    </View>
  );

  return (
    <View style={[horizontal ? { flexDirection: 'row', alignItems: 'center', gap } : { alignItems: 'center', gap: gap * 0.6 }, style]}>
      {mark}
      {wordmark}
    </View>
  );
}

const s = StyleSheet.create({
  hText: { justifyContent: 'center' },
  vText: { alignItems: 'center' },
  title: { fontWeight: '300', includeFontPadding: false },
  tag:   { fontWeight: '300', includeFontPadding: false, marginTop: 2 },
});
