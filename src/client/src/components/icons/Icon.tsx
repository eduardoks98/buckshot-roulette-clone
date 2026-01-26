// ==========================================
// ICON BASE COMPONENT
// ==========================================

import { CSSProperties } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface IconProps {
  size?: IconSize | number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export const ICON_SIZES: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
};

export function getIconSize(size: IconSize | number | undefined): number {
  if (typeof size === 'number') return size;
  return ICON_SIZES[size || 'md'];
}

export const DEFAULT_ICON_COLOR = 'currentColor';
