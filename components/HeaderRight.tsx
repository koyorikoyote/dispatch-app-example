import React, { useState, useRef } from "react"
import { View, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { SideMenu } from "./SideMenu"
import { NotificationBell, NotificationBellRef } from "./NotificationBell"
import { NotificationPanel } from "./NotificationPanel"
import { styles } from "../styles/globalStyles"
import { useTheme } from "../contexts/ThemeContext"

export function HeaderRight() {
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationBellRef = useRef<NotificationBellRef>(null)
  const { isDarkMode } = useTheme()

  // Theme-aware icon color
  const iconColor = isDarkMode ? "#fff" : "#333"

  const handleNotificationPress = () => {
    setShowNotifications(true)
  }

  const handleNotificationClose = () => {
    setShowNotifications(false)
  }

  const handleUnreadCountChange = (count: number) => {
    // Update the bell component
    if (notificationBellRef.current?.updateUnreadCount) {
      notificationBellRef.current.updateUnreadCount(count)
    }
  }

  return (
    <View style={styles.headerRight}>
      <NotificationBell 
        ref={notificationBellRef}
        onPress={handleNotificationPress}
      />

      <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
        <Ionicons name="menu" size={24} color={iconColor} />
      </TouchableOpacity>

      <SideMenu visible={showMenu} onClose={() => setShowMenu(false)} />
      
      <NotificationPanel
        visible={showNotifications}
        onClose={handleNotificationClose}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </View>
  )
}
