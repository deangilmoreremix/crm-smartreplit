import React from 'react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type ButtonAccent = 'default' | 'blue' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  accent?: ButtonAccent;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      accent = 'default',
      size = 'md',
      isLoading,
      fullWidth,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          if (accent === 'blue') {
            return 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600';
          }
          if (accent === 'danger') {
            return 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600';
          }
          return 'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary';
        case 'secondary':
          return 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700';
        case 'tertiary':
          return 'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800';
        case 'ghost':
          return 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300';
        case 'danger':
          return 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600';
        default:
          return 'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary';
      }
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          getVariantStyles(),
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';