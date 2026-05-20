/**
 * Form Validation Components
 * Reusable components for form validation and error display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ValidationError } from '../../utils/validation';

interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  style?: any;
  textStyle?: any;
}

/**
 * Display validation errors in a formatted list
 */
export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  errors,
  style,
  textStyle,
}) => {
  if (errors.length === 0) {
    return null;
  }

  return (
    <View style={[styles.errorContainer, style]}>
      {errors.map((error, index) => (
        <Text key={`${error.field}-${index}`} style={[styles.errorText, textStyle]}>
          • {error.message}
        </Text>
      ))}
    </View>
  );
};

interface FieldErrorProps {
  error?: string;
  style?: any;
  textStyle?: any;
}

/**
 * Display a single field error
 */
export const FieldError: React.FC<FieldErrorProps> = ({
  error,
  style,
  textStyle,
}) => {
  if (!error) {
    return null;
  }

  return (
    <View style={[styles.fieldErrorContainer, style]}>
      <Text style={[styles.fieldErrorText, textStyle]}>{error}</Text>
    </View>
  );
};

interface FormErrorSummaryProps {
  errors: ValidationError[];
  title?: string;
  style?: any;
  titleStyle?: any;
  errorStyle?: any;
}

/**
 * Display a summary of all form errors
 */
export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  title = 'Please fix the following issues:',
  style,
  titleStyle,
  errorStyle,
}) => {
  if (errors.length === 0) {
    return null;
  }

  return (
    <View style={[styles.summaryContainer, style]}>
      <Text style={[styles.summaryTitle, titleStyle]}>{title}</Text>
      <ValidationErrorDisplay errors={errors} style={errorStyle} />
    </View>
  );
};

interface ValidationStatusProps {
  isValid: boolean;
  validMessage?: string;
  style?: any;
  validStyle?: any;
  invalidStyle?: any;
}

/**
 * Display validation status indicator
 */
export const ValidationStatus: React.FC<ValidationStatusProps> = ({
  isValid,
  validMessage = 'All fields are valid',
  style,
  validStyle,
  invalidStyle,
}) => {
  return (
    <View style={[styles.statusContainer, style]}>
      <View
        style={[
          styles.statusIndicator,
          isValid ? styles.validIndicator : styles.invalidIndicator,
          isValid ? validStyle : invalidStyle,
        ]}
      />
      {isValid && (
        <Text style={[styles.statusText, styles.validText]}>{validMessage}</Text>
      )}
    </View>
  );
};

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: any;
  labelStyle?: any;
  errorStyle?: any;
}

/**
 * Wrapper component for form fields with label and error display
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  style,
  labelStyle,
  errorStyle,
}) => {
  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={[styles.fieldLabel, labelStyle]}>
        {label}
        {required && <Text style={styles.requiredIndicator}> *</Text>}
      </Text>
      {children}
      <FieldError error={error} style={errorStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    lineHeight: 20,
  },
  fieldErrorContainer: {
    marginTop: 4,
  },
  fieldErrorText: {
    color: '#f44336',
    fontSize: 12,
    fontStyle: 'italic',
  },
  summaryContainer: {
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  summaryTitle: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  validIndicator: {
    backgroundColor: '#4caf50',
  },
  invalidIndicator: {
    backgroundColor: '#f44336',
  },
  statusText: {
    fontSize: 14,
  },
  validText: {
    color: '#2e7d32',
  },
  fieldContainer: {
    marginVertical: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  requiredIndicator: {
    color: '#f44336',
    fontWeight: 'bold',
  },
});

/**
 * Hook for managing form validation state
 */
export const useFormValidation = (initialErrors: ValidationError[] = []) => {
  const [errors, setErrors] = React.useState<ValidationError[]>(initialErrors);
  const [isValid, setIsValid] = React.useState(initialErrors.length === 0);

  const updateErrors = React.useCallback((newErrors: ValidationError[]) => {
    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
    setIsValid(true);
  }, []);

  const addError = React.useCallback((field: string, message: string) => {
    setErrors(prev => {
      const filtered = prev.filter(err => err.field !== field);
      return [...filtered, { field, message }];
    });
    setIsValid(false);
  }, []);

  const removeError = React.useCallback((field: string) => {
    setErrors(prev => {
      const filtered = prev.filter(err => err.field !== field);
      setIsValid(filtered.length === 0);
      return filtered;
    });
  }, []);

  const getFieldError = React.useCallback((field: string): string | undefined => {
    const error = errors.find(err => err.field === field);
    return error?.message;
  }, [errors]);

  const hasFieldError = React.useCallback((field: string): boolean => {
    return errors.some(err => err.field === field);
  }, [errors]);

  return {
    errors,
    isValid,
    updateErrors,
    clearErrors,
    addError,
    removeError,
    getFieldError,
    hasFieldError,
  };
};