"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"

import { api, apiClient } from '../api'
import { useApiErrorHandler } from '../hooks/useErrorHandler'
import { useOfflineMode } from '../hooks/useOfflineMode'
import { useAuth } from './AuthContext'
import { Company } from '../types/api'

interface DataContextType {
  companies: Company[]
  loading: boolean
  error: string | null
  isOnline: boolean
  isRetrying: boolean
  retryCount: number
  loadCompanies: () => Promise<void>
  refreshData: () => Promise<void>
  clearError: () => void
  retryLastOperation: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [lastFailedOperation, setLastFailedOperation] = useState<(() => Promise<void>) | null>(null)

  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const {
    error,
    isRetrying,
    retryCount,
    clearError: clearErrorHandler,
    executeWithRetry
  } = useApiErrorHandler()

  const { isOnline, onNetworkRestore } = useOfflineMode()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const timer = setTimeout(async () => {
        const token = await apiClient.getAuthToken();
        if (token) {
          refreshData()
        }
      }, 200)

      return () => clearTimeout(timer)
    } else if (!authLoading && !isAuthenticated) {
      setCompanies([])
      setLoading(false)
    }

    const unsubscribeNetworkRestore = onNetworkRestore(() => {
      if (isAuthenticated) {
        if (lastFailedOperation) {
          lastFailedOperation()
        } else {
          refreshData()
        }
      }
    })

    return unsubscribeNetworkRestore
  }, [authLoading, isAuthenticated, lastFailedOperation])

  const clearError = useCallback(() => {
    clearErrorHandler()
    setLastFailedOperation(null)
  }, [clearErrorHandler])

  const retryLastOperation = useCallback(async () => {
    if (lastFailedOperation) {
      try {
        await lastFailedOperation()
        setLastFailedOperation(null)
      } catch (error) {
        // Error is already handled by the operation
      }
    }
  }, [lastFailedOperation])

  const companiesLoadingRef = useRef(false)

  const loadCompanies = useCallback(async () => {
    if (companiesLoadingRef.current) {
      return
    }

    companiesLoadingRef.current = true

    const operation = async () => {
      try {
        const allCompanies = await api.companies.getAllCompanies()
        if (Array.isArray(allCompanies)) {
          setCompanies(allCompanies)
        } else {
          setCompanies([])
        }
      } catch (err: any) {
        setCompanies([])
        throw err
      }
    }

    try {
      await executeWithRetry(operation)
    } catch (err: any) {
      setCompanies([])
    } finally {
      companiesLoadingRef.current = false
    }
  }, [executeWithRetry])

  const refreshData = useCallback(async () => {
    setLoading(true)
    try {
      await loadCompanies()
    } finally {
      setLoading(false)
    }
  }, [loadCompanies])

  return (
    <DataContext.Provider
      value={{
        companies,
        loading,
        error,
        isOnline,
        isRetrying,
        retryCount,
        loadCompanies,
        refreshData,
        clearError,
        retryLastOperation,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
