"use client";

import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { usersApi } from "../api/users";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { User } from "../types/api";

interface EmployeeDetailsProps {
  user: User;
  onBack: () => void;
}

export function EmployeeDetails({ user: initialUser, onBack }: EmployeeDetailsProps) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { error, handleError, clearError } = useErrorHandler();
  
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch detailed user data from API
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!initialUser?.id) return;
      
      try {
        setIsLoading(true);
        clearError();
        
        const detailedUser = await usersApi.getUser(initialUser.id);
        setUser(detailedUser);
      } catch (err) {
        handleError(err);
        // Keep the initial user data if API call fails
        setUser(initialUser);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [initialUser?.id, handleError, clearError]);

  // Apply theme-aware styles
  const containerStyle = {
    ...styles.container,
    backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
  };

  const cardStyle = {
    ...styles.card,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    borderColor: isDarkMode ? "#444" : "#ddd",
  };

  const nameStyle = {
    ...styles.name,
    color: isDarkMode ? "#fff" : "#000",
  };

  const roleStyle = {
    ...styles.role,
    color: isDarkMode ? "#aaa" : "#666",
  };

  const infoLabelStyle = {
    ...styles.infoLabel,
    color: isDarkMode ? "#aaa" : "#666",
  };

  const infoValueStyle = {
    ...styles.infoValue,
    color: isDarkMode ? "#fff" : "#000",
  };
  
  const infoRowStyle = {
    ...styles.infoRow,
    borderBottomColor: isDarkMode ? "#444" : "#ddd",
  };

  const buttonStyle = {
    ...styles.button,
    backgroundColor: "#ff4500",
  };

  const buttonTextStyle = {
    ...styles.buttonText,
    color: "#fff",
  };

  const backButtonStyle = {
    ...styles.backButton,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    borderColor: isDarkMode ? "#444" : "#ddd",
  };

  const backButtonTextStyle = {
    ...styles.backButtonText,
    color: isDarkMode ? "#fff" : "#000",
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={containerStyle}>
        <TouchableOpacity style={backButtonStyle} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? "#fff" : "#000"} />
          <Text style={backButtonTextStyle}>{t("employee.backToSearch")}</Text>
        </TouchableOpacity>
        <View style={[cardStyle, { padding: 24, alignItems: "center" }]}>
          <ActivityIndicator size="large" color="#ff4500" />
          <Text style={[nameStyle, { marginTop: 16 }]}>{t("common.status.loading")}</Text>
        </View>
      </View>
    );
  }

  // Ensure user is defined before accessing properties
  if (!user) {
    return (
      <View style={containerStyle}>
        <TouchableOpacity style={backButtonStyle} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? "#fff" : "#000"} />
          <Text style={backButtonTextStyle}>{t("employee.backToSearch")}</Text>
        </TouchableOpacity>
        <View style={[cardStyle, { padding: 24, alignItems: "center" }]}>
          <Text style={nameStyle}>{error || t("employee.errorNoData")}</Text>
        </View>
      </View>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Map user data to display fields
  const employeeInfo = {
    email: user.email || "N/A",
    phone: user.phone || "N/A",
    address: user.address || "N/A",
    joinDate: formatDate(user.joinDate) || "N/A",
    department: user.role === "USER" ? "Field Operations" : "Management",
    status: user.status === "ACTIVE" ? "Active" : user.status || "Active",
    recentActivity: "Last submission: 2 days ago", // This would come from submissions API in a real implementation
  };

  return (
    <ScrollView style={containerStyle}>
      <TouchableOpacity style={backButtonStyle} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={isDarkMode ? "#fff" : "#000"} />
        <Text style={backButtonTextStyle}>{t("employee.backToSearch")}</Text>
      </TouchableOpacity>

      <View style={cardStyle}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {user.name
              ? user.name
                  .split(" ")
                  .map((n) => n[0] || "")
                  .join("")
              : "?"}
          </Text>
        </View>

        <Text style={nameStyle}>{user.name}</Text>
        <Text style={roleStyle}>
          {user.role === "USER" ? t("role.user") : t("role.supervisor")}
        </Text>

        <View style={styles.infoContainer}>
          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.employeeId")}</Text>
            <Text style={infoValueStyle}>{user.id}</Text>
          </View>

          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.username")}</Text>
            <Text style={infoValueStyle}>{user.username}</Text>
          </View>

          {user.hourlyRate && (
            <View style={infoRowStyle}>
              <Text style={infoLabelStyle}>{t("employee.hourlyRate")}</Text>
              <Text style={infoValueStyle}>¥{user.hourlyRate}/hr</Text>
            </View>
          )}

          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.email")}</Text>
            <Text style={infoValueStyle}>{employeeInfo.email}</Text>
          </View>

          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.phone")}</Text>
            <Text style={infoValueStyle}>{employeeInfo.phone}</Text>
          </View>

          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.address")}</Text>
            <Text style={infoValueStyle}>{employeeInfo.address}</Text>
          </View>

          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.joinDate")}</Text>
            <Text style={infoValueStyle}>{employeeInfo.joinDate}</Text>
          </View>

          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.department")}</Text>
            <Text style={infoValueStyle}>{employeeInfo.department === "Field Operations" ? t("employee.fieldOperations") : t("employee.management")}</Text>
          </View>

          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.status")}</Text>
            <Text style={[infoValueStyle, { color: employeeInfo.status === "Active" ? "#4CAF50" : "#ff4500" }]}>
              {employeeInfo.status === "Active" ? t("employee.active") : employeeInfo.status}
            </Text>
          </View>

          <View style={infoRowStyle}>
            <Text style={infoLabelStyle}>{t("employee.recentActivity")}</Text>
            <Text style={infoValueStyle}>{employeeInfo.recentActivity}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={buttonStyle}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={buttonTextStyle}>{t("employee.viewSubmissions")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={buttonStyle}>
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={buttonTextStyle}>{t("employee.contact")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ff4500",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    marginBottom: 24,
  },
  infoContainer: {
    width: "100%",
    marginTop: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333", // This will be overridden dynamically
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 24,
    gap: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});