export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^\+?[\d\s\-()]+$/;
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

export const validators = {
  required: (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  email: (value: string) => {
    if (!value) return null;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value: string) => {
    if (!value) return null;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  password: (value: string) => {
    if (!value) return null;
    if (!passwordRegex.test(value)) {
      return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return null;
  },

  confirmPassword: (value: string, originalPassword: string) => {
    if (!value) return null;
    if (value !== originalPassword) {
      return 'Passwords do not match';
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },

  min: (min: number) => (value: number) => {
    if (value === null || value === undefined) return null;
    if (value < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },

  max: (max: number) => (value: number) => {
    if (value === null || value === undefined) return null;
    if (value > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },

  url: (value: string) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  fileSize: (maxSize: number) => (file: File) => {
    if (!file) return null;
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    return null;
  },

  fileType: (allowedTypes: string[]) => (file: File) => {
    if (!file) return null;
    if (!allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    return null;
  },

  coordinates: (value: { lat: number; lng: number }) => {
    if (!value) return null;
    if (typeof value.lat !== 'number' || typeof value.lng !== 'number') {
      return 'Invalid coordinates';
    }
    if (value.lat < -90 || value.lat > 90) {
      return 'Latitude must be between -90 and 90';
    }
    if (value.lng < -180 || value.lng > 180) {
      return 'Longitude must be between -180 and 180';
    }
    return null;
  },

  zipCode: (value: string) => {
    if (!value) return null;
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(value)) {
      return 'Please enter a valid ZIP code';
    }
    return null;
  },
};

type ValidatorFunction = (
  value: unknown,
  data?: Record<string, unknown>
) => string | null;

export const validateForm = (
  data: Record<string, unknown>,
  rules: Record<string, ValidatorFunction[]>
) => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];

    for (const rule of fieldRules) {
      const error = rule(value, data);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
