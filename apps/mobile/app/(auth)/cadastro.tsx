import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpBody, type SignUpBody } from '@wally/contracts'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Screen, AppText, Input, Button } from '../../src/components/ui'
import { useSignUp } from '../../src/features/auth/hooks'
import { colors, spacing } from '../../src/theme/tokens'

export default function Cadastro() {
  const { t } = useTranslation()
  const router = useRouter()
  const signUp = useSignUp()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpBody>({
    resolver: zodResolver(signUpBody),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = (data: SignUpBody) => {
    signUp.mutate(data, { onSuccess: () => router.replace('/(tabs)') })
  }

  return (
    <Screen scroll>
      <AppText
        variant="h1"
        color={colors.primaryDark}
        style={{ marginBottom: spacing.xl }}
      >
        {t('auth.signUpTitle')}
      </AppText>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.name')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />
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

      {signUp.isError ? (
        <AppText variant="caption" color={colors.expense}>
          {signUp.error instanceof Error
            ? signUp.error.message
            : t('common.error')}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Button
          title={t('auth.signUp')}
          onPress={handleSubmit(onSubmit)}
          loading={signUp.isPending}
        />
        <Button
          title={t('auth.hasAccount')}
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  )
}
