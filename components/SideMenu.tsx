"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Switch,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { styles } from "../styles/globalStyles";
import { usePlatform } from "../utils/platform";

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { isWeb } = usePlatform();
  const router = useRouter();
  const [pushNotifications, setPushNotifications] = useState(true);
  // Map the language context to the UI state
  const activeLanguage = lang === "ja" ? "Japanese" : "English";

  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    try {
      // Platform-specific logout behavior
      if (isWeb) {
        // Web doesn't need confirmation dialog
        onClose(); // Close the menu first
        await logout(); // Clear auth state
        router.replace("/login"); // Explicitly navigate to login page
      } else {
        // On mobile, we can use the platform's native confirmation
        onClose(); // Close the menu first
        await logout(); // Clear auth state
        router.replace("/login"); // Explicitly navigate to login page
      }
    } catch (error) {
      console.error("Logout error:", error);
      console.error(t("auth.logoutError"));
    }
  };



  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Background overlay that closes the menu when clicked */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Menu content - separate from the background */}
        <Animated.View
          style={[
            styles.sideMenu,
            {
              backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
              transform: [
                { translateX: slideAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          <View
            style={{
              ...styles.menuHeader,
              borderBottomColor: isDarkMode ? "#333" : "#eee",
              borderBottomWidth: 1,
            }}
          >
            <Text
              style={{
                ...styles.menuTitle,
                color: isDarkMode ? "#fff" : "#000",
              }}
            >
              {t("navigation.menu")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={isDarkMode ? "#fff" : "#333"}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              ...styles.userProfile,
              backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
            }}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>TH</Text>
            </View>
            <View>
              <Text
                style={{
                  ...styles.userName,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {user?.name}
              </Text>
              <Text
                style={{
                  ...styles.userRole,
                  color: "#666",
                }}
              >
                {user?.role === "user" ? t("role.user") : t("role.supervisor")}
              </Text>
              <Text
                style={{
                  ...styles.userMode,
                  color: "#ff4500",
                }}
              >
                {t("role.userMode")}
              </Text>
            </View>
          </View>

          <View style={styles.menuSection}>
            <View style={styles.menuSectionHeader}>
              <Ionicons name="person" size={20} color="#ff4500" />
              <Text
                style={{
                  ...styles.menuSectionTitle,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {t("navigation.authentication")}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                ...styles.menuItem,
                backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
              }}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons
                name="log-out"
                size={20}
                color={isDarkMode ? "#aaa" : "#666"}
              />
              <Text
                style={{
                  ...styles.menuItemText,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {t("navigation.logout")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuSection}>
            <View style={styles.menuSectionHeader}>
              <Ionicons name="settings-outline" size={20} color="#ff4500" />
              <Text
                style={{
                  ...styles.menuSectionTitle,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {t("navigation.settings")}
              </Text>
            </View>

            <View
              style={{
                ...styles.menuItem,
                backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
              }}
            >
              <Ionicons
                name={
                  pushNotifications ? "notifications" : "notifications-outline"
                }
                size={20}
                color={pushNotifications ? "#ff4500" : "#666"}
              />
              <Text
                style={{
                  ...styles.menuItemText,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {t("navigation.pushNotifications")}
              </Text>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#767577", true: "#ff4500" }}
              />
            </View>

            <TouchableOpacity
              style={{
                ...styles.menuItem,
                backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
              }}
            >
              <Text
                style={{
                  ...styles.menuItemText,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {t("navigation.changePassword")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuSection}>
            <View style={styles.menuSectionHeader}>
              <Ionicons name="language-outline" size={20} color="#ff4500" />
              <Text
                style={{
                  ...styles.menuSectionTitle,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {t("navigation.language")}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                {
                  ...styles.menuItem,
                  backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
                },
                activeLanguage === "Japanese" && {
                  backgroundColor: isDarkMode ? "#3d3d3e" : "#f0f0f0",
                },
              ]}
              onPress={() => {
                if (lang !== "ja") {
                  setLang("ja");
                }
              }}
            >
              <Text style={styles.flagEmoji}>🇯🇵</Text>
              <Text
                style={{
                  ...styles.menuItemText,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                Japanese
              </Text>
              {activeLanguage === "Japanese" && (
                <Ionicons name="checkmark" size={18} color="#ff4500" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                {
                  ...styles.menuItem,
                  backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
                },
                activeLanguage === "English" && {
                  backgroundColor: isDarkMode ? "#3d3d3e" : "#f0f0f0",
                },
              ]}
              onPress={() => {
                if (lang !== "en") {
                  setLang("en");
                }
              }}
            >
              <Text style={styles.flagEmoji}>🇺🇸</Text>
              <Text
                style={{
                  ...styles.menuItemText,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                English
              </Text>
              {activeLanguage === "English" && (
                <Ionicons name="checkmark" size={18} color="#ff4500" />
              )}
            </TouchableOpacity>
          </View>



          <View style={styles.menuFooter}>
            <Text style={styles.appVersion}>{t("navigation.appVersion")}</Text>
            <Text style={styles.appSubtitle}>{t("navigation.appSubtitle")}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
