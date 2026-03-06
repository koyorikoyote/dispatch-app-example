"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { styles } from "../styles/globalStyles";
import { Ionicons } from "@expo/vector-icons";
import { usePlatform } from "../utils/platform";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, error: contextError } = useAuth();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  // Theme-aware styles
  const containerStyle = {
    ...styles.container,
    backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
  };

  const { isWeb } = usePlatform();

  const inputStyle = {
    ...styles.input,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    color: isDarkMode ? "#fff" : "#000",
    borderColor: isDarkMode ? "#333" : "#ddd",
    ...(isWeb ? { outline: 'none' } : {}),
  };

  const titleStyle = {
    ...styles.appTitle,
    color: isDarkMode ? "#fff" : "#000",
  };

  const subtitleStyle = {
    ...styles.appSubtitle,
    color: isDarkMode ? "#666" : "#999",
  };

  const displayError = (() => {
    const err = localError || contextError;
    if (!err) return null;
    if (err.includes("Invalid credentials")) return t("auth.errors.invalidCredentials");
    if (err.includes("Network error") || err.includes("No internet")) return t("network.noConnection");
    return err;
  })();

  const handleLogin = async () => {
    setLocalError(null);
    if (!username || !password) {
      setLocalError(t("auth.errors.emptyFields"));
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      // Wait, login function in AuthContext catches errors and stores it in context.error, returning false.
      if (success) {
        router.replace("/");
      }
    } catch (error) {
      setLocalError(t("auth.errors.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: any) => {
    if (isWeb && event.nativeEvent.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <KeyboardAvoidingView
      style={containerStyle}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={titleStyle}>{t("auth.title")}</Text>
          <Text style={subtitleStyle}>{t("auth.subtitle")}</Text>
        </View>

        <View style={styles.formContainer}>
          {Boolean(displayError) && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255, 68, 68, 0.1)",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              gap: 8,
            }}>
              <Ionicons name="alert-circle" size={20} color="#ff4444" />
              <Text style={{
                color: "#ff4444",
                fontSize: 14,
                flex: 1,
              }}>{displayError}</Text>
            </View>
          )}

          <View style={inputStyle}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="person"
                size={20}
                color={isDarkMode ? "#666" : "#999"}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={{
                  flex: 1,
                  color: isDarkMode ? "#fff" : "#000",
                  height: 40,
                  ...(isWeb ? { outline: 'none' } : {}),
                }}
                placeholder={t("auth.username")}
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
                value={username}
                onChangeText={setUsername}
                onKeyPress={handleKeyPress}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={inputStyle}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={isDarkMode ? "#666" : "#999"}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={{
                  flex: 1,
                  color: isDarkMode ? "#fff" : "#000",
                  height: 40,
                  ...(isWeb ? { outline: 'none' } : {}),
                }}
                placeholder={t("auth.password")}
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
                value={password}
                onChangeText={setPassword}
                onKeyPress={handleKeyPress}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Ionicons
              name="log-in"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.buttonText}>
              {isLoading ? t("auth.loggingIn") : t("auth.login")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>{t("auth.forgotPassword")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
