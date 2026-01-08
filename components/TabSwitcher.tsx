import { View, TouchableOpacity, Text } from "react-native"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { styles } from "../styles/globalStyles"

interface TabSwitcherProps {
  tabs: string[]
  activeTab: number
  onTabChange: (index: number) => void
}

export function TabSwitcher({ tabs, activeTab, onTabChange }: TabSwitcherProps) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  
  // Theme-aware styles
  const tabSwitcherStyle = {
    ...styles.tabSwitcher,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
  };
  
  const tabStyle = {
    ...styles.tab,
  };
  
  const activeTabStyle = {
    ...styles.activeTab,
    backgroundColor: "#ff4500",
  };
  
  const tabTextStyle = {
    ...styles.tabText,
    color: isDarkMode ? "#aaa" : "#666",
  };
  
  const activeTabTextStyle = {
    ...styles.activeTabText,
    color: "#fff",
  };
  
  return (
    <View style={tabSwitcherStyle}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[tabStyle, activeTab === index && activeTabStyle]}
          onPress={() => onTabChange(index)}
        >
          <Text style={[tabTextStyle, activeTab === index && activeTabTextStyle]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
