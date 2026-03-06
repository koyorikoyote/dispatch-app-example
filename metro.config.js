const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// Fix source map issues in web development
config.resolver.platforms = ["ios", "android", "native", "web"]

// Disable source maps for web to prevent 404 errors
if (process.env.EXPO_PLATFORM === "web") {
  // Removed createModuleIdFactory because returning absolute paths as module IDs 
  // breaks expo-asset and @expo/vector-icons URL resolution in the web production build.
}

module.exports = config
