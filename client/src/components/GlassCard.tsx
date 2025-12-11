import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'gradient';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default'
}) => {
  const baseClasses = 'glass-card rounded-xl transition-all duration-300';
  const variantClasses = {
    default: '',
    elevated: 'shadow-lg hover:shadow-xl',
    gradient: 'bg-gradient-to-br from-white/10 to-white/5'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;