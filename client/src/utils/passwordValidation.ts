/**
 * Password validation utilities for enhanced security
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  } else if (password.length >= 12) {
    score += 25;
    if (password.length >= 16) score += 10;
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 15;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 15;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 15;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 15;
  }

  // Bonus points for additional complexity
  if (password.length >= 20) score += 5;
  if (/[^\w\s]/.test(password) && /\d/.test(password) && /[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 10; // All character types
  }

  // Common password patterns to avoid
  const commonPatterns = [
    /^password/i, /^123456/, /^qwerty/i, /^admin/i,
    /^user/i, /^login/i, /^welcome/i
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password contains common patterns that are easily guessed');
    score = Math.max(0, score - 20);
  }

  // Sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    score = Math.max(0, score - 10);
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  if (score >= 70) {
    strength = 'strong';
  } else if (score >= 40) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score: Math.min(100, Math.max(0, score))
  };
};

export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'strong': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak': return 'Weak - Easily guessed';
    case 'medium': return 'Medium - Could be stronger';
    case 'strong': return 'Strong - Good security';
    default: return 'Unknown';
  }
};