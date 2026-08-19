// services/validation.service.ts
import { 
  validationMessages, 
  passwordRules, 
  emailValidation,
  createValidationResult,
  ValidationResult
} from '@/config/validation.config';

export class ValidationService {
  private static instance: ValidationService;
  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    // Check if email is empty
    if (!email || email.trim() === '') {
      errors.push(validationMessages.email.required);
      return createValidationResult(false, errors, 'email');
    }

    // Check email format
    if (!emailValidation.validateFormat(email)) {
      errors.push(validationMessages.email.invalidFormat);
      return createValidationResult(false, errors, 'email');
    }

    // Check for disposable email
    if (!emailValidation.validateDisposable(email)) {
      errors.push(validationMessages.email.disposable);
      return createValidationResult(false, errors, 'email');
    }

    return createValidationResult(true, [], 'email');
  }

  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    // Check if password is empty
    if (!password || password.trim() === '') {
      errors.push(validationMessages.password.required);
      return createValidationResult(false, errors, 'password');
    }

    // Check each password rule
    for (const rule of passwordRules) {
      if (!rule.test(password)) {
        errors.push(rule.message);
        return createValidationResult(false, errors, 'password');
      }
    }

    return createValidationResult(true, [], 'password');
  }

  validateLoginCredentials(email: string, password: string): ValidationResult {
    const emailValidation = this.validateEmail(email);
    const passwordValidation = this.validatePassword(password);

    if (!emailValidation.isValid) {
      return emailValidation;
    }

    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    return createValidationResult(true, [], 'credentials');
  }

  getErrorMessage(error: any, email?: string, password?: string): string {
    // Handle network errors
    if (error?.code === 'ECONNREFUSED' || error?.message?.includes('network')) {
      return validationMessages.general.networkError;
    }

    // Handle server errors
    if (error?.status === 500 || error?.status === 502 || error?.status === 503) {
      return validationMessages.general.serverError;
    }

    // Handle authentication errors
    if (error?.status === 401) {
      // Check if it's a password error
      if (password && password.length > 0) {
        return validationMessages.password.wrongPassword;
      }
      // Check if it's an email error
      if (email && email.length > 0) {
        return validationMessages.email.invalidCredentials;
      }
      return validationMessages.general.invalidCredentials;
    }

    // Handle user not found
    if (error?.status === 404) {
      return validationMessages.email.notFound;
    }

    // Handle custom error messages from API
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message) {
        return err.response.data.message;
      }
    }

    return validationMessages.general.invalidCredentials;
  }

  getPasswordStrength(password: string): { 
    score: number; 
    label: string; 
    color: string;
    requirements: { met: boolean; text: string }[];
  } {
    let score = 0;
    const requirements = passwordRules.map(rule => ({
      met: rule.test(password),
      text: rule.message,
    }));

    requirements.forEach(req => {
      if (req.met) score++;
    });

    const percentage = (score / requirements.length) * 100;
    
    let label: string;
    let color: string;
    
    if (percentage === 100) {
      label = 'Strong';
      color = 'bg-green-500';
    } else if (percentage >= 60) {
      label = 'Good';
      color = 'bg-blue-500';
    } else if (percentage >= 40) {
      label = 'Fair';
      color = 'bg-yellow-500';
    } else {
      label = 'Weak';
      color = 'bg-red-500';
    }

    return {
      score: percentage,
      label,
      color,
      requirements,
    };
  }
}

export const validationService = ValidationService.getInstance();