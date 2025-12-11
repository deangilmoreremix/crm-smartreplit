import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

// Use React.memo to prevent unnecessary re-renders
const Avatar: React.FC<AvatarProps> = React.memo(({ 
  src, 
  alt = '', 
  size = 'md', 
  fallback, 
  status, 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  const statusClasses = {
    online: 'bg-green-400',
    offline: 'bg-gray-400',
    busy: 'bg-red-400',
    away: 'bg-yellow-400'
  };

  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-4 h-4'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center`}>
        {src ? (
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextSibling) {
                (target.nextSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full flex items-center justify-center text-white font-medium ${src ? 'hidden' : 'flex'}`}
          style={{ display: src ? 'none' : 'flex' }}
        >
          {fallback || '?'}
        </div>
      </div>
      {status && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${statusSizes[size]} ${statusClasses[status]} rounded-full border-2 border-white dark:border-gray-900`}></div>
      )}
    </div>  
  );  
}, (prevProps, nextProps) => {
  // Custom comparison function to optimize re-renders
  return prevProps.src === nextProps.src && 
         prevProps.size === nextProps.size &&
         prevProps.status === nextProps.status &&
         prevProps.fallback === nextProps.fallback;
});

export default Avatar;