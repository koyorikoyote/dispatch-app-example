/**
 * Error Handling Example Component
 * Demonstrates comprehensive error handling features
 * This is for testing purposes and should not be included in production
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useApiErrorHandler } from '../hooks/useErrorHandler';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { OfflineIndicator, OfflineBanner } from './OfflineIndicator';
import { ErrorBoundary } from './ErrorBoundary';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export function ErrorHandlingExample() {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [result, setResult] = useState<string>('');
  
  const {
    error,
    isRetrying,
    retryCount,
    isOffline,
    handleError,
    clearError,
    showErrorAlert,
    executeWithRetry,
  } = useApiErrorHandler();

  const { getOfflineMessage, showOfflineAlert } = useOfflineMode();

  // Simulate different types of errors
  const simulateNetworkError = async () => {
    try {
      await executeWithRetry(
        () => Promise.reject({ isNetworkError: true, message: 'Network failed' }),
        { maxRetries: 2 }
      );
    } catch (err) {
      setResult('Network error handled');
    }
  };

  const simulateServerError = async () => {
    try {
      await executeWithRetry(
        () => Promise.reject({ response: { status: 500 }, message: 'Server error' }),
        { maxRetries: 1 }
      );
    } catch (err) {
      setResult('Server error handled');
    }
  };

  const simulateValidationError = async () => {
    try {
      await executeWithRetry(
        () => Promise.reject({ 
          response: { 
            status: 400, 
            data: { error: 'Invalid input data' } 
          } 
        }),
        { showAlert: true }
      );
    } catch (err) {
      setResult('Validation error handled');
    }
  };

  const simulateSuccess = async () => {
    try {
      const response = await executeWithRetry(
        () => Promise.resolve('Operation successful!'),
        { maxRetries: 1 }
      );
      setResult(response);
      clearError();
    } catch (err) {
      setResult('Unexpected error');
    }
  };

  const throwReactError = () => {
    throw new Error('React component error for testing ErrorBoundary');
  };

  const containerStyle = {
    ...styles.container,
    backgroundColor: isDarkMode ? '#1a1a1b' : '#ffffff',
  };

  const textStyle = {
    ...styles.text,
    color: isDarkMode ? '#fff' : '#000',
  };

  const errorTextStyle = {
    ...styles.errorText,
    color: '#f44336',
  };

  const successTextStyle = {
    ...styles.successText,
    color: '#4caf50',
  };

  return (
    <ErrorBoundary>
      <ScrollView style={containerStyle}>
        <Text style={[textStyle, styles.title]}>Error Handling Demo</Text>
        
        {/* Offline Banner */}
        <OfflineBanner onRetry={() => setResult('Retry triggered from banner')} />
        
        {/* Status Display */}
        <View style={styles.statusContainer}>
          <Text style={textStyle}>Status:</Text>
          {isOffline && <OfflineIndicator showDuration={true} />}
          {isRetrying && (
            <Text style={textStyle}>
              {t('common.status.retrying')} ({retryCount}/3)
            </Text>
          )}
          {error && <Text style={errorTextStyle}>Error: {error}</Text>}
          {result && <Text style={successTextStyle}>Result: {result}</Text>}
        </View>

        {/* Test Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={simulateNetworkError}>
            <Text style={styles.buttonText}>Test Network Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={simulateServerError}>
            <Text style={styles.buttonText}>Test Server Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={simulateValidationError}>
            <Text style={styles.buttonText}>Test Validation Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={simulateSuccess}>
            <Text style={styles.buttonText}>Test Success</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={throwReactError}>
            <Text style={styles.buttonText}>Test React Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={showOfflineAlert}>
            <Text style={styles.buttonText}>Show Offline Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={clearError}>
            <Text style={styles.buttonText}>Clear Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => setResult('')}>
            <Text style={styles.buttonText}>Clear Result</Text>
          </TouchableOpacity>
        </View>

        {/* Offline Information */}
        {isOffline && (
          <View style={styles.offlineInfo}>
            <Text style={textStyle}>Offline Information:</Text>
            <Text style={textStyle}>Message: {getOfflineMessage()}</Text>
          </View>
        )}
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#ff4500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
  },
  offlineInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    gap: 4,
  },
});