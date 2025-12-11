import React, { ReactNode } from 'react';

interface AnimatedFeatureIconProps {
  icon: ReactNode;
  color: string;
  delay?: number; // 0, 1, or 2
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedFeatureIcon: React.FC<AnimatedFeatureIconProps> = ({ 
  icon, 
  color, 
  delay = 0,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const animationClass = 
    delay === 0 ? 'animate-float' : 
    delay === 1 ? 'animate-float-delayed-1' : 
    'animate-float-delayed-2';

  return (
    <div className={`rounded-full ${sizeClasses[size]} ${color} ${animationClass} shadow-md transform gpu-accelerated`}>
      {icon}
    </div>
  );
};

export default AnimatedFeatureIcon;