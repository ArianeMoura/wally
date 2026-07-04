import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatCents } from '@wally/core'
import { colors, radius, spacing, typography, shadow } from '../theme/tokens'

type TextVariant = keyof typeof typography

export function AppText({
  variant = 'body',
  color = colors.text,
  children,
  style,
}: {
  variant?: TextVariant
  color?: string
  children: ReactNode
  style?: object
}) {
  return <Text style={[typography[variant], { color }, style]}>{children}</Text>
}

export function Screen({
  children,
  scroll = false,
}: {
  children: ReactNode
  scroll?: boolean
}) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </SafeAreaView>
  )
}

export function Card({
  children,
  style,
}: {
  children: ReactNode
  style?: ViewStyle
}) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  title: string
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
  disabled?: boolean
}) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'ghost' && styles.buttonGhost,
        pressed && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : colors.textOnPrimary} />
      ) : (
        <Text
          style={[
            typography.label,
            { color: variant === 'ghost' ? colors.primary : colors.textOnPrimary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

export function Input({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.inputWrap}>
      {label ? (
        <AppText variant="label" color={colors.textMuted}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...props}
      />
      {error ? (
        <AppText variant="caption" color={colors.expense}>
          {error}
        </AppText>
      ) : null}
    </View>
  )
}

/** Valor monetário formatado (BRL) com cor por sinal. */
export function Money({
  cents,
  colorBySign = false,
  variant = 'title',
}: {
  cents: number
  colorBySign?: boolean
  variant?: TextVariant
}) {
  const color = !colorBySign
    ? colors.text
    : cents > 0
      ? colors.credit
      : cents < 0
        ? colors.debit
        : colors.textMuted
  return (
    <AppText variant={variant} color={color}>
      {formatCents(cents)}
    </AppText>
  )
}

export function Row({
  children,
  style,
}: {
  children: ReactNode
  style?: ViewStyle
}) {
  return <View style={[styles.row, style]}>{children}</View>
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <AppText variant="body" color={colors.textMuted}>
        {message}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg },
  scrollContent: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  button: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonDanger: { backgroundColor: colors.expense },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.5 },
  inputWrap: { gap: spacing.xs },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
  inputError: { borderColor: colors.expense },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empty: { padding: spacing.xl, alignItems: 'center' },
})
