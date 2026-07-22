/**
 * Design tokens — the single source of colours, spacing and typography.
 * Components reference these instead of hard-coding values.
 */

export const palette = {
  teal900: '#00494E',
  teal700: '#006A71',
  teal500: '#48A6A7',
  teal300: '#9ACBD0',
  teal050: '#EAF4F4',

  ink900: '#0F172A',
  ink700: '#334155',
  ink500: '#64748B',
  ink300: '#CBD5E1',
  ink100: '#F1F5F9',

  white: '#FFFFFF',
  bg: '#F7FAFA',

  green: '#16A34A',
  red: '#DC2626',
  amber: '#D97706',
} as const

export const colors = {
  primary: palette.teal700,
  primaryDark: palette.teal900,
  primarySoft: palette.teal050,
  accent: palette.teal500,

  background: palette.bg,
  surface: palette.white,
  border: palette.ink300,

  text: palette.ink900,
  textMuted: palette.ink500,
  textOnPrimary: palette.white,

  income: palette.green,
  expense: palette.red,
  warning: palette.amber,

  credit: palette.green, // saldo credor
  debit: palette.red, // saldo devedor
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  title: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const

export const shadow = {
  card: {
    shadowColor: palette.ink900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const
