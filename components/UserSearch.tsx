"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { usePlatform } from "../utils/platform";
import { usersApi } from "../api/users";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { User } from "../types/api";
import { UserCardSkeleton } from "./SkeletonLoader";
import { NoUsersFoundEmpty } from "./EmptyState";

interface UserSearchProps {
  onSelectUser: (user: User) => void;
  initialSearchQuery?: string;
  initialSearchType?: "user" | "supervisor";
  initialUsers?: User[];
  onSearchStateChange?: (
    searchQuery: string,
    searchType: "user" | "supervisor",
    users: User[]
  ) => void;
}

export function UserSearch({
  onSelectUser,
  initialSearchQuery = "",
  initialSearchType = "user",
  initialUsers = [],
  onSearchStateChange,
}: UserSearchProps) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { isWeb } = usePlatform();
  const { error, handleError, clearError } = useErrorHandler();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [searchType, setSearchType] = useState<"user" | "supervisor">(
    initialSearchType
  );
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isInitialLoad, setIsInitialLoad] = useState(initialSearchQuery === "");

  // Debounce timer ref for search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply theme-aware styles
  const containerStyle = {
    ...styles.container,
    backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
  };

  const inputContainerStyle = {
    ...styles.inputContainer,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    borderColor: isDarkMode ? "#444" : "#ddd",
  };

  // Use the isWeb flag to apply web-specific styles
  const inputStyle = {
    ...styles.input,
    color: isDarkMode ? "#fff" : "#000",
    ...(isWeb ? { outline: "none" } : {}),
  };

  const toggleButtonStyle = {
    ...styles.toggleButton,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    borderColor: isDarkMode ? "#444" : "#ddd",
  };

  const activeToggleStyle = {
    backgroundColor: "#ff4500",
  };

  const toggleTextStyle = {
    ...styles.toggleText,
    color: isDarkMode ? "#fff" : "#000",
  };

  const activeToggleTextStyle = {
    color: "#fff",
  };

  const cardStyle = {
    ...styles.userCard,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    borderColor: isDarkMode ? "#444" : "#ddd",
  };

  const nameStyle = {
    ...styles.userName,
    color: isDarkMode ? "#fff" : "#000",
  };

  const roleStyle = {
    ...styles.userRole,
    color: isDarkMode ? "#aaa" : "#666",
  };

  const emptyTextStyle = {
    ...styles.emptyText,
    color: isDarkMode ? "#aaa" : "#666",
  };

  // AbortController ref to cancel previous requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Rate limiting and circuit breaker state
  const rateLimitRef = useRef({
    lastRequestTime: 0,
    requestCount: 0,
    resetTime: 0,
    isCircuitOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
  });

  // Search users via API with enhanced error handling and rate limiting
  const searchUsersRef = useRef<(query: string, role: string) => Promise<void>>(
    async () => {}
  );

  searchUsersRef.current = async (query: string, role: string) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      setUsers([]);
      setIsInitialLoad(false);
      clearError();
      return;
    }

    // Don't search if query is too short
    if (query.trim().length < 2) {
      setUsers([]);
      setIsInitialLoad(false);
      clearError();
      return;
    }

    const now = Date.now();
    const rateLimit = rateLimitRef.current;

    console.log(`Search attempt - Query: "${query}", Role: "${role}"`);
    console.log(
      `Rate limit state - resetTime: ${rateLimit.resetTime}, requestCount: ${rateLimit.requestCount}, isCircuitOpen: ${rateLimit.isCircuitOpen}`
    );

    // Circuit breaker: if too many failures, wait before trying again
    if (rateLimit.isCircuitOpen) {
      const timeSinceLastFailure = now - rateLimit.lastFailureTime;
      if (timeSinceLastFailure < 15000) {
        // 15 second circuit breaker (reduced from 30s)
        handleError(
          new Error("Search temporarily unavailable"),
          "Search is temporarily unavailable. Please wait a moment and try again."
        );
        return;
      } else {
        // Reset circuit breaker
        rateLimit.isCircuitOpen = false;
        rateLimit.failureCount = 0;
      }
    }

    // Check if we're still in a server-imposed rate limit period
    if (rateLimit.resetTime > 0 && now < rateLimit.resetTime) {
      const remainingTime = Math.ceil((rateLimit.resetTime - now) / 1000);
      console.log(`Rate limit still active, ${remainingTime}s remaining`);
      handleError(
        new Error("Rate limit active"),
        `Search rate limit is active. Please wait ${remainingTime} more seconds before trying again.`
      );
      return;
    }

    // If server-imposed rate limit has expired, reset to normal rate limiting
    if (rateLimit.resetTime > 0 && rateLimit.resetTime <= now) {
      // Server-imposed timeout has expired, reset to normal rate limiting
      console.log(
        "Server-imposed rate limit expired, resetting to normal rate limiting"
      );
      rateLimit.resetTime = 0; // Set to 0 to indicate no server-imposed limit
      rateLimit.requestCount = 0;
    }

    // Rate limiting: max 20 requests per minute (increased from 10)
    if (now - rateLimit.resetTime > 60000) {
      // Reset rate limit window
      rateLimit.requestCount = 0;
      rateLimit.resetTime = now;
    }

    if (rateLimit.requestCount >= 20) {
      handleError(
        new Error("Rate limit exceeded"),
        "Too many search requests. Please wait a moment before searching again."
      );
      return;
    }

    // Minimum time between requests (250ms)
    const timeSinceLastRequest = now - rateLimit.lastRequestTime;
    if (timeSinceLastRequest < 250) {
      // Wait before making the request
      await new Promise((resolve) =>
        setTimeout(resolve, 250 - timeSinceLastRequest)
      );
    }

    // Update rate limiting counters
    rateLimit.requestCount++;
    rateLimit.lastRequestTime = Date.now();

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;

    try {
      setIsLoading(true);
      clearError();

      // Map role types to API role values
      const apiRole = role === "user" ? "USER" : "SUPERVISOR";

      const response = await usersApi.searchUsers(query.trim(), {
        role: apiRole,
        limit: 20, // Limit to 20 results as per original logic
      });

      // Only update state if this request wasn't cancelled
      if (!currentController.signal.aborted) {
        setUsers(response.data || []);
        setIsInitialLoad(false);

        // Reset failure count and rate limiting on successful request
        rateLimit.failureCount = 0;
        rateLimit.isCircuitOpen = false;
        rateLimit.resetTime = 0; // Clear any server-imposed rate limit

        console.log("Search successful - rate limiting reset");
      }
    } catch (err: any) {
      // Don't handle errors for cancelled requests
      if (currentController.signal.aborted) {
        return;
      }

      // Update failure tracking
      rateLimit.failureCount++;
      rateLimit.lastFailureTime = Date.now();

      // Open circuit breaker after 5 consecutive failures (increased from 3)
      if (rateLimit.failureCount >= 5) {
        rateLimit.isCircuitOpen = true;
      }

      // Handle specific search errors with consistent 15-second timeout
      if (err?.response?.status === 429) {
        // Rate limited by server - use consistent 15-second timeout
        const retryAfter = 15; // Fixed 15-second timeout

        console.log(`429 error received, setting 15-second timeout`);

        handleError(
          err,
          `Search rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
        );

        // Set server-imposed rate limit timeout
        const newResetTime = Date.now() + retryAfter * 1000;
        console.log(
          `Setting rate limit until: ${new Date(
            newResetTime
          ).toLocaleTimeString()}`
        );
        rateLimit.resetTime = newResetTime;
        rateLimit.requestCount = 0; // Reset counter for when the timeout expires

        // Reset failure count to prevent circuit breaker from triggering
        rateLimit.failureCount = 0;
        rateLimit.isCircuitOpen = false;
      } else if (err?.response?.status === 400) {
        handleError(
          err,
          "Invalid search query. Please try a different search term."
        );
      } else if (err?.response?.status === 404) {
        handleError(err, "No users found matching your search criteria.");
      } else if (
        err?.response?.status === 503 ||
        err?.response?.status === 502
      ) {
        handleError(
          err,
          "Search service is temporarily unavailable. Please try again in a few moments."
        );
      } else if (err?.isNetworkError || err?.code === "NETWORK_ERROR") {
        handleError(
          err,
          "Unable to search users. Please check your internet connection and try again."
        );
      } else if (
        err?.code === "ECONNABORTED" ||
        err?.message?.includes("timeout")
      ) {
        handleError(
          err,
          "Search request timed out. Please try again with a shorter search term."
        );
      } else {
        handleError(err, "Search failed. Please try again in a few moments.");
      }

      setUsers([]);
      setIsInitialLoad(false);
    } finally {
      // Only update loading state if this request wasn't cancelled
      if (!currentController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const searchUsers = useCallback((query: string, role: string) => {
    if (searchUsersRef.current) {
      return searchUsersRef.current(query, role);
    } else {
      console.error(`searchUsersRef.current is null!`);
      return Promise.resolve();
    }
  }, []);

  // Debounced search effect - triggers search 500ms after user stops typing
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setUsers([]);
      setIsInitialLoad(true);
      clearError();
      return;
    }

    // Set up new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      const currentQuery = searchQuery.trim();
      const currentType = searchType;

      if (currentQuery.length >= 2) {
        try {
          // Use searchUsersRef for reliable execution
          if (searchUsersRef.current) {
            searchUsersRef.current(currentQuery, currentType);
          } else {
            // Fallback to searchUsers function
            searchUsers(currentQuery, currentType);
          }
        } catch (error) {
          console.error(`Debounced search failed:`, error);
          // Last resort: try again with delay
          setTimeout(() => {
            searchUsers(currentQuery, currentType);
          }, 100);
        }
      }
    }, 500); // 500ms debounce for search

    // Cleanup function to clear timer if component unmounts or searchQuery changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, searchType, searchUsers, clearError]);

  // Reset rate limiting when component becomes active again
  useEffect(() => {
    const resetRateLimiting = () => {
      const now = Date.now();
      const rateLimit = rateLimitRef.current;

      // If it's been more than 2 minutes since last activity, reset everything (reduced from 5 minutes)
      if (now - rateLimit.lastRequestTime > 120000) {
        rateLimit.requestCount = 0;
        rateLimit.resetTime = now;
        rateLimit.isCircuitOpen = false;
        rateLimit.failureCount = 0;
      }
    };

    resetRateLimiting();
  }, [searchType]); // Only reset on search type change, not query change

  // Cleanup effect to cancel pending requests and timers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Manual search trigger function with enhanced reliability
  const triggerSearch = useCallback(() => {
    const currentQuery = searchQuery.trim();
    const currentType = searchType;

    if (currentQuery.length >= 2) {
      // Use searchUsersRef directly for more reliable execution
      searchUsersRef.current?.(currentQuery, currentType);
    } else if (currentQuery.length === 0) {
      // Clear results when search is empty
      setUsers([]);
      setIsInitialLoad(true);
      clearError();
    }
  }, [searchQuery, searchType, clearError]);

  // Handle search input submission (Enter key or mobile Done button)
  const handleSearchSubmit = useCallback(() => {
    triggerSearch();
  }, [triggerSearch]);

  // Notify parent component of search state changes with ref to prevent excessive calls
  const onSearchStateChangeRef = useRef(onSearchStateChange);
  onSearchStateChangeRef.current = onSearchStateChange;

  useEffect(() => {
    if (onSearchStateChangeRef.current) {
      onSearchStateChangeRef.current(searchQuery, searchType, users);
    }
  }, [searchQuery, searchType, users]);

  // Filter users based on search query and type (for display logic)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return users;
  }, [searchQuery, users]);

  // Reset search state and rate limiting
  const resetSearchState = useCallback(() => {
    // Reset component state
    setSearchQuery("");
    setUsers([]);
    setIsInitialLoad(true);
    clearError();

    // Reset rate limiting and circuit breaker
    const rateLimit = rateLimitRef.current;
    rateLimit.requestCount = 0;
    rateLimit.resetTime = 0; // Set to 0 to clear server-imposed rate limit
    rateLimit.isCircuitOpen = false;
    rateLimit.failureCount = 0;
    rateLimit.lastFailureTime = 0;

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    console.log("Search state and rate limiting completely reset");
  }, [clearError]);

  // Toggle between worker and supervisor search with immediate execution
  const toggleSearchType = useCallback(
    (newType: "user" | "supervisor") => {
      // Don't toggle if already the same type
      if (newType === searchType) {
        return;
      }

      // Capture current query before any state changes
      const currentQuery = searchQuery.trim();

      // Update the search type
      setSearchType(newType);

      // If there's a valid search query, trigger search with new type
      if (currentQuery.length >= 2) {
        // Use a small delay to ensure state updates are processed
        setTimeout(() => {
          try {
            // Primary approach: use ref
            if (searchUsersRef.current) {
              searchUsersRef.current(currentQuery, newType);
            } else {
              // Fallback: use the stable searchUsers function
              searchUsers(currentQuery, newType);
            }
          } catch (error) {
            console.error(`Toggle search failed:`, error);
            // Last resort: try again with longer delay
            setTimeout(() => {
              searchUsers(currentQuery, newType);
            }, 200);
          }
        }, 50);
      } else {
        // Clear results if no valid query
        setUsers([]);
        setIsInitialLoad(true);
        clearError();
      }
    },
    [searchQuery, searchType, searchUsers, clearError]
  );

  // Render each user item
  // Retry mechanism - only makes server request if rate limit has expired
  const retrySearch = useCallback(() => {
    const currentQuery = searchQuery.trim();
    const currentType = searchType;
    const now = Date.now();
    const rateLimit = rateLimitRef.current;

    if (currentQuery.length >= 2) {
      // Check if we're still in a rate limit period
      if (rateLimit.resetTime > 0 && now < rateLimit.resetTime) {
        const remainingTime = Math.ceil((rateLimit.resetTime - now) / 1000);
        console.log(
          `Try Again clicked but rate limit still active, ${remainingTime}s remaining`
        );
        handleError(
          new Error("Rate limit active"),
          `Search rate limit is still active. Please wait ${remainingTime} more seconds before trying again.`
        );
        return; // Don't make server request
      }

      console.log("Retrying search - rate limit expired");
      searchUsersRef.current?.(currentQuery, currentType);
    }
  }, [searchQuery, searchType, handleError]);

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => onSelectUser(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={nameStyle}>{item.name}</Text>
        <Text style={roleStyle}>
          {item.role === "USER" ? t("role.user") : t("role.supervisor")}
          {item.hourlyRate ? ` • ¥${item.hourlyRate}/hr` : ""}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDarkMode ? "#666" : "#999"}
      />
    </TouchableOpacity>
  );

  return (
    <View style={containerStyle}>
      <View style={styles.searchHeader}>
        <View style={inputContainerStyle}>
          <Ionicons
            name="search-outline"
            size={20}
            color={isDarkMode ? "#666" : "#999"}
            style={styles.searchIcon}
          />
          <TextInput
            style={inputStyle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            placeholder={
              searchType === "user"
                ? t("userSearch.searchWorkers")
                : t("userSearch.searchSupervisors")
            }
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={isDarkMode ? "#666" : "#999"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSearchSubmit}
                style={[styles.clearButton, { marginLeft: 4 }]}
                disabled={searchQuery.trim().length < 2}
              >
                <Ionicons
                  name="search"
                  size={18}
                  color={
                    searchQuery.trim().length >= 2
                      ? "#ff4500"
                      : isDarkMode
                      ? "#444"
                      : "#ccc"
                  }
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            toggleButtonStyle,
            searchType === "user" ? activeToggleStyle : null,
          ]}
          onPress={() => toggleSearchType("user")}
        >
          <Text
            style={[
              toggleTextStyle,
              searchType === "user" ? activeToggleTextStyle : null,
            ]}
          >
            {t("userSearch.workers")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            toggleButtonStyle,
            searchType === "supervisor" ? activeToggleStyle : null,
          ]}
          onPress={() => toggleSearchType("supervisor")}
        >
          <Text
            style={[
              toggleTextStyle,
              searchType === "supervisor" ? activeToggleTextStyle : null,
            ]}
          >
            {t("userSearch.supervisors")}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && isInitialLoad ? (
        // Show skeleton loaders for initial search
        <View style={styles.listContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <UserCardSkeleton key={index} />
          ))}
        </View>
      ) : isLoading ? (
        // Show spinner for subsequent searches
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4500" />
          <Text
            style={[
              styles.loadingText,
              { color: isDarkMode ? "#aaa" : "#666" },
            ]}
          >
            {t("userSearch.searching")}
          </Text>
        </View>
      ) : searchQuery.length > 0 ? (
        searchQuery.trim().length < 2 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search"
              size={48}
              color={isDarkMode ? "#444" : "#ddd"}
            />
            <Text style={emptyTextStyle}>
              Enter at least 2 characters and press search or Enter
            </Text>
          </View>
        ) : filteredUsers.length > 0 ? (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={isDarkMode ? "#ff6b6b" : "#e74c3c"}
            />
            <Text
              style={[
                styles.errorTitle,
                { color: isDarkMode ? "#ff6b6b" : "#e74c3c" },
              ]}
            >
              {t("userSearch.searchError")}
            </Text>
            <Text
              style={[
                styles.errorMessage,
                { color: isDarkMode ? "#aaa" : "#666" },
              ]}
            >
              {error}
            </Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={retrySearch}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {rateLimitRef.current.isCircuitOpen && (
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: "#6c757d", marginLeft: 8 },
                  ]}
                  onPress={resetSearchState}
                >
                  <Text style={styles.retryButtonText}>Reset Search</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <NoUsersFoundEmpty searchQuery={searchQuery} />
        )
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={searchType === "user" ? "people" : "people-outline"}
            size={48}
            color={isDarkMode ? "#444" : "#ddd"}
          />
          <Text style={emptyTextStyle}>
            {searchType === "user"
              ? "Enter a name and press search or Enter to find workers"
              : "Enter a name and press search or Enter to find supervisors"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    paddingBottom: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ff4500",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#ff4500",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
});
