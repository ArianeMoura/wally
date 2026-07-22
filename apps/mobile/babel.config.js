// The API URL comes from EXPO_PUBLIC_API_URL, an Expo public variable.
// The reanimated plugin must stay last in the list.
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
