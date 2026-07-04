import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useSession } from '../src/store/session'
import { colors } from '../src/theme/tokens'

export default function Index() {
  const hydrated = useSession((s) => s.hydrated)
  const accessToken = useSession((s) => s.accessToken)

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return <Redirect href={accessToken ? '/(tabs)' : '/(auth)/login'} />
}
