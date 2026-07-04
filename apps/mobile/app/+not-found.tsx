import { Link } from 'expo-router'
import { Screen, AppText, Row } from '../src/components/ui'
import { colors, spacing } from '../src/theme/tokens'

export default function NotFound() {
  return (
    <Screen>
      <Row style={{ flex: 1, justifyContent: 'center' }}>
        <AppText variant="title">Página não encontrada</AppText>
      </Row>
      <Link href="/" style={{ marginTop: spacing.lg }}>
        <AppText color={colors.primary}>Voltar ao início</AppText>
      </Link>
    </Screen>
  )
}
