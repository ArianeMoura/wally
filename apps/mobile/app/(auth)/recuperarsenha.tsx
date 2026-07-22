import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Screen, AppText, Input, Button } from '../../src/components/ui'
import { api } from '../../src/lib/api'
import { colors, spacing } from '../../src/theme/tokens'

export default function RecuperarSenha() {
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    setLoading(true)
    try {
      await api.postPublic('/auth/forgot-password', { email })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll>
      <AppText
        variant="h1"
        color={colors.primaryDark}
        style={{ marginBottom: spacing.xl }}
      >
        Recuperar senha
      </AppText>

      {sent ? (
        <AppText variant="body">
          Se o e-mail existir, enviaremos instruções de redefinição.
        </AppText>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Input
            label={t('auth.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Button title="Enviar" onPress={onSubmit} loading={loading} />
        </View>
      )}

      <Button title="Voltar" variant="ghost" onPress={() => router.back()} />
    </Screen>
  )
}
