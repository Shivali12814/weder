import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Base design dimensions (iPhone 14 Pro = 393×852)
const BASE_W = 393;
const BASE_H = 852;

/** Percentage of screen width */
export const wp = (pct) => (SCREEN_W * pct) / 100;

/** Percentage of screen height */
export const hp = (pct) => (SCREEN_H * pct) / 100;

/** Scale a font/size relative to base width */
export const scale = (size) => (SCREEN_W / BASE_W) * size;

/** Moderate scale — less aggressive for fonts */
export const ms = (size, factor = 0.45) =>
  size + (scale(size) - size) * factor;

/** True if running on a tablet (iPad / Android tablet) */
export const isTablet = SCREEN_W >= 768;

/** True if small phone (< 375px) */
export const isSmall = SCREEN_W < 375;

export const SCREEN = { W: SCREEN_W, H: SCREEN_H };

export default { wp, hp, scale, ms, isTablet, isSmall, SCREEN };
