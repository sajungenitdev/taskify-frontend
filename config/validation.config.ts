// config/validation.config.ts

export interface ValidationRule {
  id: string;
  field: string;
  type: 'email' | 'password' | 'required' | 'custom';
  condition?: (value: any) => boolean;
  message: string;
  priority: number;
}

export interface ValidationMessages {
  email: {
    required: string;
    invalidFormat: string;
    disposable: string;
    notFound: string;
    invalidCredentials: string;
  };
  password: {
    required: string;
    minLength: string;
    uppercase: string;
    lowercase: string;
    number: string;
    specialChar: string;
    invalidCredentials: string;
    wrongPassword: string;
  };
  general: {
    invalidCredentials: string;
    networkError: string;
    serverError: string;
  };
}

export const validationMessages: ValidationMessages = {
  email: {
    required: 'Email address is required',
    invalidFormat: 'Please enter a valid email address (e.g., name@domain.com)',
    disposable: 'Please use a valid email address. Temporary email services are not allowed.',
    notFound: 'No account found with this email address',
    invalidCredentials: 'Invalid email address. Please check and try again.',
  },
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters long',
    uppercase: 'Password must contain at least one uppercase letter (A-Z)',
    lowercase: 'Password must contain at least one lowercase letter (a-z)',
    number: 'Password must contain at least one number (0-9)',
    specialChar: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
    invalidCredentials: 'Invalid password. Please try again.',
    wrongPassword: 'The password you entered is incorrect. Please try again.',
  },
  general: {
    invalidCredentials: 'Invalid credentials. Please check your email and password.',
    networkError: 'Network error. Please check your connection and try again.',
    serverError: 'Server error. Please try again later.',
  },
};

// Disposable/Temporary email domains
export const disposableDomains = [
  'mailinator.com',
  'mailnator.com',
  'mailnator.net',
  'mailnator.org',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'guerrillamail.org',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'tempmail.org',
  'throwawaymail.com',
  'throwawaymail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'jetable.com',
  'jetable.net',
  'jetable.org',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'mailexpire.com',
  'mailexpire.net',
  'mailexpire.org',
  'mailcatch.com',
  'mailcatch.net',
  'mailcatch.org',
  'maildrop.cc',
  'maildrop.com',
  'maildrop.net',
  'maildrop.org',
  'spambox.us',
  'spambox.com',
  'spambox.net',
  'spambox.org',
  'mytrashmail.com',
  'mytrashmail.net',
  'mytrashmail.org',
  'trash2000.com',
  'trash2000.net',
  'trash2000.org',
  'fakeinbox.com',
  'fakeinbox.net',
  'fakeinbox.org',
  'dispostable.com',
  'dispostable.net',
  'dispostable.org',
  'mintemail.com',
  'mintemail.net',
  'mintemail.org',
  'getnada.com',
  'getnada.net',
  'getnada.org',
  'mailnesia.com',
  'mailnesia.net',
  'mailnesia.org',
  'inboxbear.com',
  'inboxbear.net',
  'inboxbear.org',
  'guerrillamail-block.com',
  'guerrillamail-block.net',
  'guerrillamail-block.org',
];

// Password strength rules
export const passwordRules = [
  {
    id: 'minLength',
    test: (password: string) => password.length >= 8,
    message: validationMessages.password.minLength,
  },
  {
    id: 'uppercase',
    test: (password: string) => /[A-Z]/.test(password),
    message: validationMessages.password.uppercase,
  },
  {
    id: 'lowercase',
    test: (password: string) => /[a-z]/.test(password),
    message: validationMessages.password.lowercase,
  },
  {
    id: 'number',
    test: (password: string) => /[0-9]/.test(password),
    message: validationMessages.password.number,
  },
  {
    id: 'specialChar',
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    message: validationMessages.password.specialChar,
  },
];

// Email validation functions
export const emailValidation = {
  validateFormat: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  validateDisposable: (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return !disposableDomains.some(d => domain.includes(d));
  },
  
  getDomainType: (email: string): string => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return 'invalid';
    
    if (disposableDomains.some(d => domain.includes(d))) {
      return 'disposable';
    }
    
    // Add more domain types if needed
    if (domain.endsWith('.edu')) return 'educational';
    if (domain.endsWith('.gov')) return 'government';
    if (domain.endsWith('.org')) return 'organization';
    
    return 'valid';
  },
};

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  field?: string;
  type?: 'error' | 'warning' | 'info';
}

export const createValidationResult = (
  isValid: boolean,
  errors: string[] = [],
  field?: string,
  type: 'error' | 'warning' | 'info' = 'error'
): ValidationResult => ({
  isValid,
  errors,
  field,
  type,
});