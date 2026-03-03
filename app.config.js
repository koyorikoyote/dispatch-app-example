module.exports = ({ config }) => {
    const isDev = process.env.NODE_ENV === 'development';

    return {
        ...config,
        expo: {
            name: "Crew App",
            slug: "dispatch-app",
            owner: "laiimas",
            version: "1.0.0",
            updates: {
                url: "https://u.expo.dev/eb17ea4f-539f-4209-a435-353dcf4622eb"
            },
            runtimeVersion: {
                policy: "appVersion"
            },
            extra: {
                eas: {
                    projectId: "eb17ea4f-539f-4209-a435-353dcf4622eb"
                },
                DISPATCH_API_BASE_URL: process.env.DISPATCH_API_BASE_URL // Let api.ts handle fallbacks if not set env var
            },
            orientation: "portrait",
            icon: "./assets/icon.png",
            userInterfaceStyle: "dark",
            splash: {
                image: "./assets/splash.png",
                resizeMode: "contain",
                backgroundColor: "#1a1a1b"
            },
            assetBundlePatterns: ["**/*"],
            ios: {
                supportsTablet: true,
                bundleIdentifier: "com.imas.crewapp",
                buildNumber: "1"
            },
            android: {
                adaptiveIcon: {
                    foregroundImage: "./assets/adaptive-icon.png",
                    backgroundColor: "#1a1a1b"
                },
                package: "com.imas.crewapp",
                versionCode: 1,
                usesCleartextTraffic: true,
                permissions: [
                    "CAMERA",
                    "READ_EXTERNAL_STORAGE",
                    "WRITE_EXTERNAL_STORAGE",
                    "INTERNET",
                    "ACCESS_NETWORK_STATE"
                ]
            },
            web: {
                favicon: "./assets/favicon.png",
                bundler: "metro"
            },
            plugins: [
                "expo-router",
                [
                    "expo-notifications",
                    {
                        icon: "./assets/icon.png",
                        color: "#ff4500"
                    }
                ],
                [
                    "expo-image-picker",
                    {
                        photosPermission: "The app needs access to your photos to upload images.",
                        cameraPermission: "The app needs access to your camera to take photos."
                    }
                ]
            ],
            scheme: "dispatch-app"
        }
    };
};
