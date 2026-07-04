import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Screen, AppText, Input, Button } from '../src/components/ui'
import { useCreateGroup } from '../src/features/groups/hooks'
import { spacing } from '../src/theme/tokens'

export default function CriarGrupo() {
  const { t } = useTranslation()
  const router = useRouter()
  const create = useCreateGroup()
  const [name, setName] = useState('')

  const onSubmit = () => {
    if (!name.trim()) return
    create.mutate({ name: name.trim() }, { onSuccess: () => router.back() })
  }

  return (
    <Screen scroll>
      <AppText variant="h2" style={{ marginBottom: spacing.lg }}>
        {t('groups.newGroup')}
      </AppText>
      <View style={{ gap: spacing.md }}>
        <Input
          label={t('groups.groupName')}
          value={name}
          onChangeText={setName}
        />
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
