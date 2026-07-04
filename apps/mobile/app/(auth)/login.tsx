import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInBody, type SignInBody } from '@wally/contracts'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Screen, AppText, Input, Button } from '../../src/components/ui'
import { useSignIn } from '../../src/features/auth/hooks'
import { colors, spacing } from '../../src/theme/tokens'

export default function Login() {
  const { t } = useTranslation()
  const router = useRouter()
  const signIn = useSignIn()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInBody>({
    resolver: zodResolver(signInBody),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (data: SignInBody) => {
    signIn.mutate(data, {
      onSuccess: () => router.replace('/(tabs)'),
    })
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs, marginBottom: spacing.xl }}>
        <AppText variant="h1" color={colors.primaryDark}>
          {t('common.appName')}
        </AppText>
        <AppText variant="body" color={colors.textMuted}>
          {t('auth.welcome')}
        </AppText>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.password')}
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />

      {signIn.isError ? (
        <AppText variant="caption" color={colors.expense}>
          {t('auth.invalidCredentials')}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Button
          title={t('auth.signIn')}
          onPress={handleSubmit(onSubmit)}
          loading={signIn.isPending}
        />
        <Button
          title={t('auth.noAccount')}
          variant="ghost"
          onPress={() => router.push('/(auth)/cadastro')}
        />
      </View>
    </Screen>
  )
}
