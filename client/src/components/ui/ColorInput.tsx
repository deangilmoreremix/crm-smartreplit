import React from 'react';
import { Input } from '../components/ui/input';

interface ColorInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  ariaDescribedBy?: string;
}

export const ColorInput: React.FC<ColorInputProps> = ({
  id,
  value,
  onChange,
  label,
  placeholder = '#3B82F6',
  ariaDescribedBy
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1"
          aria-label={`${label} color picker`}
          aria-describedby={ariaDescribedBy}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
      </div>
    </div>
  );
};
