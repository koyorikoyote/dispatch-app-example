import { useState, useEffect } from "react";
import { Platform } from "react-native";
import { Stack, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import "../inject-fonts.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

// iOS Safari's bfcache restores the page without hitting the network. After a
// Firebase Hosting deploy that emits new asset hashes, this can hand the user
// stale HTML pointing at files that 404. Force a reload on bfcache restore.
if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("pageshow", (e) => {
    if ((e as PageTransitionEvent).persisted) {
      window.location.reload();
    }
  });
}
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { DataProvider } from "../contexts/DataContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { RefreshProvider } from "../contexts/RefreshContext";
import { EventStreamProvider } from "../contexts/EventStreamContext";
import { SwipeProvider } from "../contexts/SwipeContext";
import { BottomNavigation } from "../components/BottomNavigation";
import { SideMenu } from "../components/SideMenu";
import { SearchDialog } from "../components/SearchDialog";
import { SwipeableFormDialog } from "../components/SwipeableFormDialog";
import { ManualsDialog } from "../components/ManualsDialog";
import { ChangePasswordDialog } from "../components/ChangePasswordDialog";

function ThemedStatusBar() {
  const { isDarkMode } = useTheme();
  return (
    <StatusBar
      style={isDarkMode ? "light" : "dark"}
      backgroundColor={isDarkMode ? "#1a1a1b" : "#ffffff"}
    />
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showManualsDialog, setShowManualsDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);

  const handleSearchPress = () => {
    setShowSearchDialog(true);
  };

  const handleAddNewPress = () => {
    setShowFormDialog(true);
  };

  const handleManualsPress = () => {
    setShowManualsDialog(true);
  };

  const handleSettingsPress = () => {
    setShowMenu(true);
  };

  return (
    <>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="submissions" />
      </Stack>

      {isAuthenticated && (
        <>
          <BottomNavigation
            onSearchPress={handleSearchPress}
            onAddNewPress={handleAddNewPress}
            onManualsPress={handleManualsPress}
            onSettingsPress={handleSettingsPress}
          />
          <SideMenu
            visible={showMenu}
            onClose={() => setShowMenu(false)}
            onChangePassword={() => setShowChangePasswordDialog(true)}
          />
          <SearchDialog
            visible={showSearchDialog}
            onClose={() => setShowSearchDialog(false)}
          />
          <SwipeableFormDialog
            visible={showFormDialog}
            onClose={() => setShowFormDialog(false)}
          />
          <ManualsDialog
            visible={showManualsDialog}
            onClose={() => setShowManualsDialog(false)}
          />
          <ChangePasswordDialog
            visible={showChangePasswordDialog}
            onClose={() => setShowChangePasswordDialog(false)}
          />
        </>
      )}
    </>
  );
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DataProvider>
                <RefreshProvider>
                  <EventStreamProvider>
                    <SwipeProvider>
                      <AppContent />
                    </SwipeProvider>
                  </EventStreamProvider>
                </RefreshProvider>
              </DataProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
