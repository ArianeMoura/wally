import { FlatList, Pressable, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { TransactionResponse } from '@wally/contracts'
import {
  Screen,
  AppText,
  Card,
  Row,
  Money,
  EmptyState,
} from '../../src/components/ui'
import {
  useBalanceSummary,
  useTransactions,
  useDeleteTransaction,
} from '../../src/features/transactions/hooks'
import { colors, spacing, radius, shadow } from '../../src/theme/tokens'

export default function Wallet() {
  const { t } = useTranslation()
  const router = useRouter()
  const summary = useBalanceSummary()
  const transactions = useTransactions()
  const del = useDeleteTransaction()

  const items = transactions.data?.items ?? []

  return (
    <Screen>
      <Row style={{ marginBottom: spacing.lg }}>
        <AppText variant="h2">{t('wallet.title')}</AppText>
      </Row>

      <Card style={{ marginBottom: spacing.lg }}>
        <AppText variant="label" color={colors.textMuted}>
          {t('wallet.balance')}
        </AppText>
        <Money
          cents={summary.data?.balanceCents ?? 0}
          variant="h1"
          colorBySign
        />
        <Row style={{ marginTop: spacing.md }}>
          <View>
            <AppText variant="caption" color={colors.textMuted}>
              {t('wallet.income')}
            </AppText>
            <Money cents={summary.data?.incomeCents ?? 0} variant="title" />
          </View>
          <View>
            <AppText variant="caption" color={colors.textMuted}>
              {t('wallet.expense')}
            </AppText>
            <Money
              cents={-(summary.data?.expenseCents ?? 0)}
              variant="title"
              colorBySign
            />
          </View>
        </Row>
      </Card>

      <Row style={{ marginBottom: spacing.md }}>
        <AppText variant="title">{t('wallet.transactions')}</AppText>
      </Row>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          transactions.isLoading ? null : (
            <EmptyState message={t('wallet.noTransactions')} />
          )
        }
        renderItem={({ item }) => (
          <TransactionRow item={item} onDelete={() => del.mutate(item.id)} />
        )}
      />

      <Pressable
        onPress={() => router.push('/add-transacao')}
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

function TransactionRow({
  item,
  onDelete,
}: {
  item: TransactionResponse
  onDelete: () => void
}) {
  const signed = item.type === 'expense' ? -item.amountCents : item.amountCents
  return (
    <Card style={{ paddingVertical: spacing.md }}>
      <Row>
        <View style={{ flex: 1 }}>
          <AppText variant="body">{item.description}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {new Date(item.occurredAt).toLocaleDateString('pt-BR')}
          </AppText>
        </View>
        <Money cents={signed} variant="title" colorBySign />
        <Pressable onPress={onDelete} style={{ marginLeft: spacing.md }}>
          <MaterialIcons
            name="delete-outline"
            size={22}
            color={colors.textMuted}
          />
        </Pressable>
      </Row>
    </Card>
  )
}
