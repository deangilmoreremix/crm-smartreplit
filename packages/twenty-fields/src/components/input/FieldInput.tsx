import React from 'react';
import { FieldMetadataType } from '../../types/FieldMetadataType';

export interface FieldInputProps {
  fieldType: FieldMetadataType;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  options?: string[]; // For SELECT/MULTI_SELECT
}

export const FieldInput: React.FC<FieldInputProps> = ({
  fieldType,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className = '',
  options = [],
}) => {
  const baseInputClasses = `
    w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    dark:bg-gray-800 dark:border-gray-600 dark:text-white
    dark:focus:ring-blue-400 dark:focus:border-blue-400
    ${className}
  `;

  switch (fieldType) {
    case FieldMetadataType.TEXT:
    case FieldMetadataType.RICH_TEXT:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC:
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number((e.target as HTMLInputElement).value) || 0)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.CURRENCY:
      return (
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number((e.target as HTMLInputElement).value) || 0)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${baseInputClasses} pl-8`}
          />
        </div>
      );

    case FieldMetadataType.DATE:
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.DATE_TIME:
      return (
        <input
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.BOOLEAN:
      return (
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
      );

    case FieldMetadataType.SELECT:
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case FieldMetadataType.MULTI_SELECT:
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={(value || []).includes(option)}
                onChange={(e) => {
                  const currentValues = value || [];
                  if ((e.target as HTMLInputElement).checked) {
                    onChange([...currentValues, option]);
                  } else {
                    onChange(currentValues.filter((v: string) => v !== option));
                  }
                }}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
            </label>
          ))}
        </div>
      );

    case FieldMetadataType.RATING:
      return (
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              disabled={disabled}
              className={`text-2xl ${
                star <= (value || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
              } hover:text-yellow-400 transition-colors`}
            >
              ★
            </button>
          ))}
        </div>
      );

    case FieldMetadataType.EMAILS:
      return (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder || 'email@example.com'}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.PHONES:
      return (
        <input
          type="tel"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder || '+1 (555) 123-4567'}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.LINKS:
      return (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder || 'https://example.com'}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC:
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.CURRENCY:
      return (
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${baseInputClasses} pl-8`}
          />
        </div>
      );

    case FieldMetadataType.DATE:
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.DATE_TIME:
      return (
        <input
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.BOOLEAN:
      return (
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
      );

    case FieldMetadataType.SELECT:
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case FieldMetadataType.MULTI_SELECT:
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={(value || []).includes(option)}
                onChange={(e) => {
                  const currentValues = value || [];
                  if (e.target.checked) {
                    onChange([...currentValues, option]);
                  } else {
                    onChange(currentValues.filter((v: string) => v !== option));
                  }
                }}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
            </label>
          ))}
        </div>
      );

    case FieldMetadataType.RATING:
      return (
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              disabled={disabled}
              className={`text-2xl ${
                star <= (value || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
              } hover:text-yellow-400 transition-colors`}
            >
              ★
            </button>
          ))}
        </div>
      );

    case FieldMetadataType.EMAILS:
      return (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'email@example.com'}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.PHONES:
      return (
        <input
          type="tel"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '+1 (555) 123-4567'}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case FieldMetadataType.URL:
    case FieldMetadataType.LINKS:
      return (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'https://example.com'}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      );
  }
};
