import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Screen, AppText, Input, Button } from '../src/components/ui'
import { useGroupMembers, useCreateExpense } from '../src/features/groups/hooks'
import { parseAmountToCents } from '../src/lib/money'
import { colors, spacing } from '../src/theme/tokens'

export default function AddDespesa() {
  const { t } = useTranslation()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const groupId = id ?? ''

  const members = useGroupMembers(groupId)
  const create = useCreateExpense(groupId)

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = () => {
    const amountCents = parseAmountToCents(amount)
    if (!amountCents) return setError('Valor inválido')
    if (!description.trim()) return setError('Descrição obrigatória')
    const participantIds = (members.data ?? []).map((m) => m.userId)
    if (participantIds.length === 0) return setError('Grupo sem membros')
    setError(null)
    create.mutate(
      {
        amountCents,
        description: description.trim(),
        split: { mode: 'equal', participantIds },
      },
      { onSuccess: () => router.back() },
    )
  }

  return (
    <Screen scroll>
      <AppText variant="h2" style={{ marginBottom: spacing.lg }}>
        {t('groups.newExpense')}
      </AppText>
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
        <AppText variant="caption" color={colors.textMuted}>
          {t('groups.splitEqually')} · {(members.data ?? []).length}{' '}
          {t('groups.members').toLowerCase()}
        </AppText>
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
        <Button
          title={t('common.cancel')}
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  )
}
