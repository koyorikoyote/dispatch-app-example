"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { authApi } from '../api/auth'
import { apiClient } from '../api/client'
import type { User as ApiUser, LoginResponse } from '../types/api'
import { clearAllSavedStates } from '../utils/statePersistence'

interface User {
  id: number
  username: string
  role: "user" | "supervisor" | "admin"
  userTypeLevel: number
  name: string
  hourlyRate?: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  switchRole: (role: "user" | "supervisor") => Promise<void>
  getAuthToken: () => Promise<string | null>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token storage keys
const TOKEN_KEY = 'auth_token'
const TOKEN_EXPIRY_KEY = 'auth_token_expiry'
const USER_DATA_KEY = 'user_data'

// Helper functions for cross-platform secure storage
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.warn(`Failed to get ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
      throw error;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn(`Failed to delete ${key}:`, error);
    }
  }
};

// Convert API user to local user format
const mapApiUserToUser = (apiUser: ApiUser | LoginResponse['user']): User => ({
  id: apiUser.id,
  username: apiUser.username,
  name: apiUser.name,
  role: apiUser.role as "user" | "supervisor" | "admin",
  userTypeLevel: apiUser.userTypeLevel || 1,
  hourlyRate: apiUser.hourlyRate,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tokenRefreshTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadStoredAuth()
    return () => {
      // Cleanup timer on unmount
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current)
      }
    }
  }, [])

  const loadStoredAuth = async () => {
    try {
      setError(null)

      // Check for stored auth token and expiry using apiClient methods
      const token = await apiClient.getAuthToken()
      const expiryStr = await secureStorage.getItem(TOKEN_EXPIRY_KEY)
      const userData = await secureStorage.getItem(USER_DATA_KEY)

      if (token && expiryStr && userData) {
        const expiry = new Date(expiryStr)
        const now = new Date()

        // Check if token is expired
        if (expiry <= now) {
          // Token expired, try to refresh
          const refreshed = await performTokenRefresh()
          if (!refreshed) {
            // Refresh failed, clear stored data
            await clearStoredAuth()
            return
          }
        } else {
          // Token is valid, restore user
          setUser(JSON.parse(userData))
          // Schedule token refresh before expiry
          scheduleTokenRefresh(expiry)
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load stored auth")
      // Clear potentially corrupted data
      await clearStoredAuth()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)

      // Call backend API for authentication
      const response = await authApi.login({
        username,
        password,
        deviceInfo: `React Native App`, // Could be enhanced with device details
      })



      // Map API user to local user format
      const mappedUser = mapApiUserToUser(response.user)
      setUser(mappedUser)

      // Store authentication data securely
      // Note: authApi.login() already stores the token via apiClient.setAuthToken()
      // We only need to store the expiry and user data
      await secureStorage.setItem(TOKEN_EXPIRY_KEY, response.expiresAt)
      await secureStorage.setItem(USER_DATA_KEY, JSON.stringify(mappedUser))

      // Verify token was stored correctly with multiple attempts
      let storedToken = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!storedToken && attempts < maxAttempts) {
        storedToken = await apiClient.getAuthToken();
        if (!storedToken) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        }
        attempts++;
      }

      if (!storedToken) {
        throw new Error('Failed to store authentication token');
      }

      // Schedule token refresh before expiry
      const expiry = new Date(response.expiresAt)
      scheduleTokenRefresh(expiry)

      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Login failed"
      setError(errorMessage)

      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)

      // Clear refresh timer
      if (tokenRefreshTimer.current) {
        clearTimeout(tokenRefreshTimer.current)
        tokenRefreshTimer.current = null
      }

      // Call backend logout API
      await authApi.logout()

      // Clear local state and storage
      setUser(null)
      await clearStoredAuth()

      // Clear saved navigation and filter states
      await clearAllSavedStates()
    } catch (err: any) {
      // Even if API call fails, clear local data
      setUser(null)
      await clearStoredAuth()

      // Clear saved navigation and filter states even on error
      try {
        await clearAllSavedStates()
      } catch (clearErr) {
        console.warn("Failed to clear saved states on logout:", clearErr)
      }

      const errorMessage = err.response?.data?.error || err.message || "Logout failed"
      setError(errorMessage)

    }
  }

  const switchRole = async (role: "user" | "supervisor") => {
    if (user?.role === "admin") {
      const updatedUser = { ...user, role }
      setUser(updatedUser)

      // Update stored user data in SecureStore
      try {
        await secureStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser))
      } catch (err) {

        setError("Failed to update user role")
      }
    }
  }

  const getAuthToken = async (): Promise<string | null> => {
    try {
      // Use apiClient's method to ensure consistency
      return await apiClient.getAuthToken()
    } catch (err) {

      return null
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    return await performTokenRefresh()
  }

  // Helper functions

  const clearStoredAuth = async () => {
    try {
      // Use apiClient's method to clear token
      await apiClient.clearAuthToken()
      await secureStorage.deleteItem(TOKEN_EXPIRY_KEY)
      await secureStorage.deleteItem(USER_DATA_KEY)
    } catch (err) {
      console.warn("Failed to clear some stored auth data:", err)
    }
  }

  const performTokenRefresh = async (): Promise<boolean> => {
    try {
      const response = await authApi.refreshToken()

      // Map API user to local user format
      const mappedUser = mapApiUserToUser(response.user)
      setUser(mappedUser)

      // Store updated authentication data
      // Note: authApi.refreshToken() already stores the token via apiClient.setAuthToken()
      // We only need to store the expiry and user data
      await secureStorage.setItem(TOKEN_EXPIRY_KEY, response.expiresAt)
      await secureStorage.setItem(USER_DATA_KEY, JSON.stringify(mappedUser))

      // Schedule next refresh
      const expiry = new Date(response.expiresAt)
      scheduleTokenRefresh(expiry)

      return true
    } catch (err: any) {
      // If refresh fails, logout user
      setUser(null)
      await clearStoredAuth()

      const errorMessage = err.response?.data?.error || "Session expired. Please login again."
      setError(errorMessage)

      return false
    }
  }

  const scheduleTokenRefresh = (expiry: Date) => {
    // Clear existing timer
    if (tokenRefreshTimer.current) {
      clearTimeout(tokenRefreshTimer.current)
    }

    // Schedule refresh 5 minutes before expiry
    const now = new Date()
    const refreshTime = new Date(expiry.getTime() - 5 * 60 * 1000) // 5 minutes before expiry
    const delay = Math.max(0, refreshTime.getTime() - now.getTime())

    tokenRefreshTimer.current = setTimeout(async () => {
      await performTokenRefresh()
    }, delay)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        switchRole,
        getAuthToken,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
