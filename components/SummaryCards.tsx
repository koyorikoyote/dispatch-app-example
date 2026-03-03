import { View, Text } from "react-native"
import { useData } from "../contexts/DataContext"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { styles } from "../styles/globalStyles"

export function SummaryCards() {
  // @ts-ignore - submissions missing from DataContext
  const { submissions, loading } = useData()
  const { isDarkMode } = useTheme()
  const { t } = useLanguage()

  // Calculate summary data from actual submissions
  const calculateSummaryData = () => {
    if (!submissions || submissions.length === 0) {
      return { thisWeekHours: 0, weekSalary: 0, newReports: 0 }
    }

    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    startOfWeek.setHours(0, 0, 0, 0)

    const thisWeekSubmissions = submissions.filter((submission: any) => {
      const submissionDate = new Date(submission.date)
      return submissionDate >= startOfWeek
    })

    // Calculate total hours for this week
    const thisWeekHours = thisWeekSubmissions.reduce((total: number, submission: any) => {
      const start = new Date(`2000-01-01 ${submission.startTime}`)
      const end = new Date(`2000-01-01 ${submission.endTime}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + (hours > 0 ? hours : 0)
    }, 0)

    // Calculate estimated salary (assuming average hourly rate)
    const averageHourlyRate = 800 // Default rate, could be calculated from user data
    const weekSalary = thisWeekHours * averageHourlyRate

    // Count new reports (submitted status from this week)
    const newReports = thisWeekSubmissions.filter((s: any) => s.status === 'SUBMITTED').length

    return { thisWeekHours, weekSalary, newReports }
  }

  const { thisWeekHours, weekSalary, newReports } = calculateSummaryData()

  // Theme-aware styles
  const containerStyle = {
    ...styles.summaryContainer,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
  }

  const labelStyle = {
    ...styles.summaryLabel,
    color: isDarkMode ? "#aaa" : "#666",
  }

  return (
    <View style={containerStyle}>
      <View style={styles.summaryCard}>
        <Text style={[styles.summaryNumber, { color: "#FF9800" }]}>
          {loading ? "..." : `${Math.round(thisWeekHours)}h`}
        </Text>
        <Text style={labelStyle}>{t("summary.thisWeek")}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={[styles.summaryNumber, { color: "#4CAF50" }]}>
          {loading ? "..." : `¥${weekSalary.toLocaleString()}`}
        </Text>
        <Text style={labelStyle}>{t("summary.weekSalary")}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={[styles.summaryNumber, { color: "#2196F3" }]}>
          {loading ? "..." : newReports}
        </Text>
        <Text style={labelStyle}>{t("summary.newReports")}</Text>
      </View>
    </View>
  )
}
