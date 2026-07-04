import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import type { TransactionType } from '@wally/contracts'
import { Screen, AppText, Input, Button, Row } from '../src/components/ui'
import { useCreateTransaction } from '../src/features/transactions/hooks'
import { parseAmountToCents } from '../src/lib/money'
import { colors, spacing, radius } from '../src/theme/tokens'

export default function AddTransacao() {
  const { t } = useTranslation()
  const router = useRouter()
  const create = useCreateTransaction()

  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = () => {
    const amountCents = parseAmountToCents(amount)
    if (!amountCents) return setError('Valor inválido')
    if (!description.trim()) return setError('Descrição obrigatória')
    setError(null)
    create.mutate(
      { type, amountCents, description: description.trim() },
      { onSuccess: () => router.back() },
    )
  }

  return (
    <Screen scroll>
      <AppText variant="h2" style={{ marginBottom: spacing.lg }}>
        {t('wallet.newTransaction')}
      </AppText>

      <Row style={{ gap: spacing.md, marginBottom: spacing.lg }}>
        <TypeChip
          label={t('wallet.typeExpense')}
          active={type === 'expense'}
          color={colors.expense}
          onPress={() => setType('expense')}
        />
        <TypeChip
          label={t('wallet.typeIncome')}
          active={type === 'income'}
          color={colors.income}
          onPress={() => setType('income')}
        />
      </Row>

      <View style={{ gap: spacing.md }}>
        <Input
          label={`${t('wallet.amount')} (R$)`}
          keyboardType="decimal-pad"
          placeholder="0,00"
          value={amount}
          onChangeText={setAmount}
        />
        <Input
          label={t('wallet.description')}
          value={description}
          onChangeText={setDescription}
        />
        {error ? (
          <AppText variant="caption" color={colors.expense}>
            {error}
          </AppText>
        ) : null}
        <Button
          title={t('common.save')}
          onPress={onSubmit}
          loading={create.isPending}
        />
        <Button title={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  )
}

function TypeChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string
  active: boolean
  color: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 44,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? color : colors.surface,
        borderWidth: 1,
        borderColor: active ? color : colors.border,
      }}
    >
      <AppText
        variant="label"
        color={active ? colors.textOnPrimary : colors.textMuted}
      >
        {label}
      </AppText>
    </Pressable>
  )
}
