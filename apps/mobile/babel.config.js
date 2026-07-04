// Config de dev do Wally 2.0. A URL da API vem de EXPO_PUBLIC_API_URL
// (variável pública do Expo), não mais do plugin dotenv-import.
// O plugin do reanimated deve ser o último da lista.
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
