import React from 'react';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '../../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = ''
}) => {
  const validation = validatePassword(password);

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              validation.strength === 'weak' ? 'bg-red-500 w-1/3' :
              validation.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
              'bg-green-500 w-full'
            }`}
          />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPasswordStrengthColor(validation.strength)}`}>
          {validation.strength.toUpperCase()}
        </span>
      </div>

      {/* Strength Text */}
      <p className="text-sm text-gray-600">
        {getPasswordStrengthText(validation.strength)}
      </p>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <ul className="text-sm text-red-600 space-y-1">
          {validation.errors.map((error, index) => (
            <li key={index} className="flex items-start">
              <span className="text-red-500 mr-1">•</span>
              {error}
            </li>
          ))}
        </ul>
      )}

      {/* Requirements Checklist */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center">
          <span className={password.length >= 12 ? 'text-green-500' : 'text-gray-400'}>
            {password.length >= 12 ? '✓' : '○'}
          </span>
          <span className="ml-2">At least 12 characters</span>
        </div>
        <div className="flex items-center">
          <span className={/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
            {/[a-z]/.test(password) ? '✓' : '○'}
          </span>
          <span className="ml-2">One lowercase letter</span>
        </div>
        <div className="flex items-center">
          <span className={/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
            {/[A-Z]/.test(password) ? '✓' : '○'}
          </span>
          <span className="ml-2">One uppercase letter</span>
        </div>
        <div className="flex items-center">
          <span className={/\d/.test(password) ? 'text-green-500' : 'text-gray-400'}>
            {/\d/.test(password) ? '✓' : '○'}
          </span>
          <span className="ml-2">One number</span>
        </div>
        <div className="flex items-center">
          <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
            {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'}
          </span>
          <span className="ml-2">One special character</span>
        </div>
      </div>
    </div>
  );
};