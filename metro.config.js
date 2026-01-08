const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// Fix source map issues in web development
config.resolver.platforms = ["ios", "android", "native", "web"]

// Disable source maps for web to prevent 404 errors
if (process.env.EXPO_PLATFORM === "web") {
  config.serializer = {
    ...config.serializer,
    createModuleIdFactory: () => (path) => {
      return path
    },
  }
}

module.exports = config
