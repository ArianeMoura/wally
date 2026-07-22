import { FlatList, Pressable, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { MemberBalance } from '@wally/contracts'
import {
  Screen,
  AppText,
  Card,
  Row,
  Money,
  EmptyState,
} from '../src/components/ui'
import {
  useGroup,
  useGroupBalances,
  useGroupExpenses,
} from '../src/features/groups/hooks'
import { colors, spacing, radius, shadow } from '../src/theme/tokens'

export default function GrupoDetalhe() {
  const { t } = useTranslation()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const groupId = id ?? ''

  const group = useGroup(groupId)
  const balances = useGroupBalances(groupId)
  const expenses = useGroupExpenses(groupId)

  return (
    <Screen>
      <Row style={{ marginBottom: spacing.lg }}>
        <Pressable
          onPress={() => router.back()}
          style={{ marginRight: spacing.md }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h2">{group.data?.name ?? '—'}</AppText>
      </Row>

      <AppText variant="title" style={{ marginBottom: spacing.md }}>
        {t('groups.balances')}
      </AppText>
      <Card style={{ marginBottom: spacing.lg }}>
        {(balances.data?.balances ?? []).length === 0 ? (
          <EmptyState message={t('common.empty')} />
        ) : (
          (balances.data?.balances ?? []).map((b) => (
            <BalanceRow key={b.userId} balance={b} />
          ))
        )}
      </Card>

      <AppText variant="title" style={{ marginBottom: spacing.md }}>
        {t('groups.expenses')}
      </AppText>
      <FlatList
        data={expenses.data ?? []}
        keyExtractor={(e) => e.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          expenses.isLoading ? null : <EmptyState message={t('common.empty')} />
        }
        renderItem={({ item }) => (
          <Card style={{ paddingVertical: spacing.md }}>
            <Row>
              <AppText variant="body">{item.description}</AppText>
              <Money cents={item.amountCents} variant="title" />
            </Row>
          </Card>
        )}
      />

      <Pressable
        onPress={() => router.push(`/add-despesa?id=${groupId}`)}
        style={{
          position: 'absolute',
          right: spacing.lg,
          bottom: spacing.xl,
          width: 56,
          height: 56,
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadow.card,
        }}
      >
        <MaterialIcons name="add" size={28} color={colors.textOnPrimary} />
      </Pressable>
    </Screen>
  )
}

function BalanceRow({ balance }: { balance: MemberBalance }) {
  const { t } = useTranslation()
  const label =
    balance.balanceCents > 0
      ? t('groups.creditor')
      : balance.balanceCents < 0
        ? t('groups.debtor')
        : t('groups.settled')
  return (
    <Row style={{ paddingVertical: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <AppText variant="body">{balance.userId.slice(0, 8)}…</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {label}
        </AppText>
      </View>
      <Money cents={balance.balanceCents} variant="title" colorBySign />
    </Row>
  )
}
