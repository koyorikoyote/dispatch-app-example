import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // Base styles
  container: {
    flex: 1,
    backgroundColor: "#1a1a1b",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },

  // Login styles
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ff4500",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },

  // Form styles
  input: {
    backgroundColor: "#2d2d2e",
    borderRadius: 8,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#ff4500",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#ff4500",
    fontSize: 16,
  },

  // Header styles
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  notificationButton: {
    marginRight: 16,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ff4500",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  menuButton: {
    padding: 4,
  },

  // Side menu styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  sideMenu: {
    backgroundColor: "#1a1a1b",
    height: Math.min(height * 0.85, height - 100),
    width: Math.min(width * 0.68, 280),
    borderRadius: 16,
    padding: 16,
    marginBottom: 80,
    marginRight: 16,
    maxHeight: height - 100,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 16, // Reduced from 20
    fontWeight: "bold",
    color: "#fff",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24, // Reduced from 30
    padding: 12, // Reduced from 16
    backgroundColor: "#2d2d2e",
    borderRadius: 10, // Reduced from 12
  },
  userAvatar: {
    width: 40, // Reduced from 50
    height: 40, // Reduced from 50
    borderRadius: 20, // Reduced from 25
    backgroundColor: "#ff4500",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12, // Reduced from 16
  },
  userAvatarText: {
    color: "#fff",
    fontSize: 14, // Reduced from 18
    fontWeight: "bold",
  },
  userName: {
    fontSize: 14, // Reduced from 18
    fontWeight: "bold",
    color: "#fff",
  },
  userRole: {
    fontSize: 12, // Reduced from 14
    color: "#666",
  },
  userMode: {
    fontSize: 10, // Reduced from 12
    color: "#ff4500",
  },
  menuSection: {
    marginBottom: 16, // Reduced from 20
  },
  menuSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10, // Reduced from 12
  },
  menuSectionTitle: {
    fontSize: 14, // Reduced from 16
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 6, // Reduced from 8
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10, // Reduced from 12
    paddingHorizontal: 12, // Reduced from 16
    backgroundColor: "#2d2d2e",
    borderRadius: 6, // Reduced from 8
    marginBottom: 6, // Reduced from 8
  },
  menuItemText: {
    fontSize: 13, // Reduced from 16
    color: "#fff",
    marginLeft: 10, // Reduced from 12
    flex: 1,
  },
  flagEmoji: {
    fontSize: 16, // Reduced from 20
    marginRight: 6, // Reduced from 8
  },
  adminSection: {
    backgroundColor: "#2d2d2e",
    borderRadius: 10, // Reduced from 12
    padding: 12, // Reduced from 16
    marginBottom: 16, // Reduced from 20
    borderWidth: 1,
    borderColor: "#ff4500",
  },
  switchUserButton: {
    backgroundColor: "#ff4500",
    borderRadius: 6, // Reduced from 8
    padding: 10, // Reduced from 12
    alignItems: "center",
    marginTop: 6, // Reduced from 8
  },
  switchUserText: {
    color: "#fff",
    fontSize: 12, // Reduced from 14
    fontWeight: "bold",
  },
  menuFooter: {
    alignItems: "center",
    marginTop: "auto",
  },
  appVersion: {
    fontSize: 11, // Reduced from 14
    color: "#666",
  },

  // Title styles
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    paddingHorizontal: 16,
  },

  // Section styles
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },

  // Date and time styles
  dateButton: {
    backgroundColor: "#2d2d2e",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  dateText: {
    color: "#fff",
    fontSize: 16,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeInput: {
    flex: 0.48,
  },

  // Picker styles
  pickerContainer: {
    backgroundColor: "#2d2d2e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
  },
  picker: {
    color: "#fff",
    height: 50,
  },

  // Button row styles
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  // Submission card styles
  submissionCard: {
    backgroundColor: "#2d2d2e",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  submissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  submissionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
  timestampText: {
    fontSize: 12,
    color: "#666",
  },
  submissionInfo: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 8,
  },
  companyInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  companyText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 8,
  },
  salaryInfo: {
    alignItems: "flex-end",
  },
  salaryText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  submissionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
  },

  // Expanded content styles
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    padding: 16,
  },
  issuesSection: {
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff4500",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 18,
  },
  progressText: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 4,
  },

  // Comment styles
  comment: {
    backgroundColor: "#1a1a1b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ff4500",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  commentAvatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ff4500",
  },
  commentTime: {
    fontSize: 10,
    color: "#666",
  },
  commentContent: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 18,
  },
  commentInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: "#1a1a1b",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    marginRight: 8,
    maxHeight: 80,
  },
  commentButton: {
    backgroundColor: "#ff4500",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Summary styles
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#2d2d2e",
    marginBottom: 16,
  },
  summaryCard: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  // Tab switcher styles
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#2d2d2e",
    borderRadius: 8,
    margin: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#ff4500",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Filter styles
  filterSection: {
    backgroundColor: "#2d2d2e",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  clearFilterText: {
    fontSize: 14,
    color: "#ff4500",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: "#666",
  },
  filterValue: {
    fontSize: 14,
    color: "#fff",
  },

  // Date range styles
  dateRangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateRangeInput: {
    flex: 0.48,
  },
  quickDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  quickDateButton: {
    backgroundColor: "#1a1a1b",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickDateText: {
    fontSize: 12,
    color: "#666",
  },

  // Hours range styles
  hoursRangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hoursInput: {
    flex: 0.48,
  },

  // Summary section styles
  summarySection: {
    backgroundColor: "#2d2d2e",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  // Apply filter button
  applyFilterButton: {
    marginHorizontal: 16,
    marginBottom: 20,
  },

  // Personal memos styles
  memosContainer: {
    flex: 1,
    padding: 16,
  },
  memoInput: {
    marginBottom: 20,
  },
  memoTextInput: {
    backgroundColor: "#2d2d2e",
    borderRadius: 8,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  saveMemoButton: {
    backgroundColor: "#ff4500",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  saveMemoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  memosList: {
    flex: 1,
  },
  memoItem: {
    backgroundColor: "#2d2d2e",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  memoContent: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
    marginBottom: 8,
  },
  memoDate: {
    fontSize: 12,
    color: "#666",
  },

  // Employee details styles
  employeeDetails: {
    flex: 1,
    padding: 16,
  },
  employeeCard: {
    backgroundColor: "#2d2d2e",
    borderRadius: 12,
    padding: 20,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  employeeRole: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  employeeInfo: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
});
