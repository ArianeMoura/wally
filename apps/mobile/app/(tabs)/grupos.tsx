import { FlatList, Pressable, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Screen, AppText, Card, Row, EmptyState } from '../../src/components/ui'
import { useGroups } from '../../src/features/groups/hooks'
import { colors, spacing, radius, shadow } from '../../src/theme/tokens'

export default function Grupos() {
  const { t } = useTranslation()
  const router = useRouter()
  const groups = useGroups()
  const items = groups.data ?? []

  return (
    <Screen>
      <Row style={{ marginBottom: spacing.lg }}>
        <AppText variant="h2">{t('groups.title')}</AppText>
      </Row>

      <FlatList
        data={items}
        keyExtractor={(g) => g.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          groups.isLoading ? null : (
            <EmptyState message={t('groups.noGroups')} />
          )
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/grupo?id=${item.id}`)}>
            <Card>
              <Row>
                <AppText variant="title">{item.name}</AppText>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textMuted}
                />
              </Row>
            </Card>
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => router.push('/criar-grupo')}
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
