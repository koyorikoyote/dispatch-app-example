/**
 * Frontend Validation Utilities
 * Client-side validation to complement backend validation
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class Validator {
  /**
   * Validate a single field
   */
  static validateField(
    fieldName: string,
    value: any,
    rules: ValidationRule
  ): ValidationError | null {
    // Required validation
    if (rules.required && this.isEmpty(value)) {
      return {
        field: fieldName,
        message: `${this.formatFieldName(fieldName)} is required`,
      };
    }

    // Skip other validations if value is empty and not required
    if (this.isEmpty(value) && !rules.required) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be at least ${rules.minLength} characters`,
        };
      }

      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} cannot exceed ${rules.maxLength} characters`,
        };
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return {
          field: fieldName,
          message: this.getPatternErrorMessage(fieldName, rules.pattern),
        };
      }
    }

    // Number validations
    if (typeof value === 'number') {
      // Min value
      if (rules.min !== undefined && value < rules.min) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} must be at least ${rules.min}`,
        };
      }

      // Max value
      if (rules.max !== undefined && value > rules.max) {
        return {
          field: fieldName,
          message: `${this.formatFieldName(fieldName)} cannot exceed ${rules.max}`,
        };
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return {
          field: fieldName,
          message: customError,
        };
      }
    }

    return null;
  }

  /**
   * Validate multiple fields
   */
  static validateFields(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const value = data[fieldName];
      const error = this.validateField(fieldName, value, fieldRules);
      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if value is empty
   */
  private static isEmpty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    );
  }

  /**
   * Format field name for display
   */
  private static formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Get error message for pattern validation
   */
  private static getPatternErrorMessage(fieldName: string, pattern: RegExp): string {
    const formattedName = this.formatFieldName(fieldName);

    // Common pattern error messages
    if (pattern.source.includes('@')) {
      return `${formattedName} must be a valid email address`;
    }

    if (pattern.source.includes('\\d')) {
      return `${formattedName} must contain only numbers`;
    }

    if (pattern.source.includes('[a-zA-Z]')) {
      return `${formattedName} must contain only letters`;
    }

    return `${formattedName} format is invalid`;
  }
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}$/,
  username: /^[a-zA-Z0-9_-]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d+)?$/,
};

// Predefined validation rules for common fields
export const CommonValidationRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: ValidationPatterns.username,
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 128,
  },
  email: {
    required: true,
    pattern: ValidationPatterns.email,
    maxLength: 255,
  },
  phone: {
    pattern: ValidationPatterns.phone,
    maxLength: 20,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  date: {
    required: true,
    pattern: ValidationPatterns.date,
  },
  time: {
    required: true,
    pattern: ValidationPatterns.time,
  },
  companyName: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  address: {
    maxLength: 255,
  },
  comment: {
    required: true,
    minLength: 1,
    maxLength: 500,
  },
  description: {
    maxLength: 1000,
  },
};

// Submission-specific validation
export const SubmissionValidationRules = {
  date: {
    ...CommonValidationRules.date,
    custom: (value: string) => {
      if (!value) return null;

      const submissionDate = new Date(value);
      const today = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setDate(today.getDate() + 30);

      if (submissionDate > maxFutureDate) {
        return 'Submission date cannot be more than 30 days in the future';
      }

      return null;
    },
  },
  startTime: CommonValidationRules.time,
  endTime: {
    ...CommonValidationRules.time,
    custom: (value: string, data?: any) => {
      if (!value || !data?.startTime) return null;

      const start = new Date(`2000-01-01T${data.startTime}:00`);
      const end = new Date(`2000-01-01T${value}:00`);

      if (start >= end) {
        return 'End time must be after start time';
      }

      return null;
    },
  },
  companyId: {
    required: true,
    custom: (value: any) => {
      if (!value || (typeof value === 'number' && value <= 0)) {
        return 'Please select a company';
      }
      return null;
    },
  },
  issues: {
    maxLength: 1000,
  },
  completedToday: {
    maxLength: 1000,
  },
  tomorrowPlan: {
    maxLength: 1000,
  },
};

/**
 * Validate submission data
 */
export const validateSubmission = (data: any): ValidationResult => {
  const rules = { ...SubmissionValidationRules };

  // Add cross-field validation for end time
  if (rules.endTime?.custom) {
    const originalCustom = rules.endTime.custom;
    rules.endTime.custom = (value: string) => originalCustom(value, data);
  }

  return Validator.validateFields(data, rules);
};

/**
 * Validate user data
 */
export const validateUser = (data: any, isUpdate: boolean = false): ValidationResult => {
  const rules: Record<string, ValidationRule> = {
    name: isUpdate ? { ...CommonValidationRules.name, required: false } : CommonValidationRules.name,
    email: isUpdate ? { ...CommonValidationRules.email, required: false } : CommonValidationRules.email,
    phone: CommonValidationRules.phone,
    address: CommonValidationRules.address,
  };

  if (!isUpdate) {
    rules.username = CommonValidationRules.username;
    rules.password = CommonValidationRules.password;
  }

  return Validator.validateFields(data, rules);
};

/**
 * Validate company data
 */
export const validateCompany = (data: any, isUpdate: boolean = false): ValidationResult => {
  const rules = {
    name: isUpdate ? { ...CommonValidationRules.companyName, required: false } : CommonValidationRules.companyName,
    address: CommonValidationRules.address,
    phone: CommonValidationRules.phone,
    email: { ...CommonValidationRules.email, required: false },
    contactPerson: { maxLength: 100 },
  };

  return Validator.validateFields(data, rules);
};

/**
 * Validate comment data
 */
export const validateComment = (data: any): ValidationResult => {
  return Validator.validateFields(data, {
    content: CommonValidationRules.comment,
  });
};