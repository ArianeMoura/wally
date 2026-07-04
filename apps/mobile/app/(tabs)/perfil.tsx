import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Screen, AppText, Card, Button } from '../../src/components/ui'
import { useSession } from '../../src/store/session'
import { useLogout } from '../../src/features/auth/hooks'
import { colors, spacing } from '../../src/theme/tokens'

export default function Perfil() {
  const { t } = useTranslation()
  const router = useRouter()
  const user = useSession((s) => s.user)
  const logout = useLogout()

  const onLogout = async () => {
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <Screen>
      <AppText variant="h2" style={{ marginBottom: spacing.lg }}>
        {t('profile.title')}
      </AppText>

      <Card style={{ marginBottom: spacing.xl }}>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="label" color={colors.textMuted}>
            {t('auth.name')}
          </AppText>
          <AppText variant="title">{user?.name ?? '—'}</AppText>
        </View>
        <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
          <AppText variant="label" color={colors.textMuted}>
            {t('auth.email')}
          </AppText>
          <AppText variant="body">{user?.email ?? '—'}</AppText>
        </View>
      </Card>

      <Button title={t('auth.logout')} variant="danger" onPress={onLogout} />
    </Screen>
  )
}
