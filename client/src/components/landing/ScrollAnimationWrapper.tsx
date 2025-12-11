import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollAnimationWrapperProps {
  children: ReactNode;
  animation?: 'fade-up' | 'fade-in' | 'slide-in' | 'zoom-in' | 'bounce';
  duration?: number;
  delay?: number;
  threshold?: number; // 0 to 1, percentage of element visible to trigger animation
  once?: boolean;
  className?: string;
}

const ScrollAnimationWrapper: React.FC<ScrollAnimationWrapperProps> = ({
  children,
  animation = 'fade-up',
  duration = 800,
  delay = 0,
  threshold = 0.1,
  once = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            setHasAnimated(true);
          }
        } else {
          if (!once && hasAnimated) {
            setIsVisible(false);
          }
        }
      },
      { 
        root: null,
        rootMargin: '0px',
        threshold 
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once, hasAnimated, threshold]);

  // Get animation classes based on the animation type
  const getAnimationClasses = () => {
    if (!isVisible && (!once || !hasAnimated)) {
      return 'opacity-0 transform';
    }

    let animationClasses = 'opacity-100 transform';
    
    switch (animation) {
      case 'fade-up':
        animationClasses += isVisible ? ' translate-y-0' : ' translate-y-12';
        break;
      case 'fade-in':
        animationClasses += isVisible ? '' : '';
        break;
      case 'slide-in':
        animationClasses += isVisible ? ' translate-x-0' : ' -translate-x-12';
        break;
      case 'zoom-in':
        animationClasses += isVisible ? ' scale-100' : ' scale-75';
        break;
      case 'bounce':
        animationClasses += isVisible ? ' bounce' : '';
        break;
      default:
        animationClasses += isVisible ? ' translate-y-0' : ' translate-y-12';
    }
    
    return animationClasses;
  };

  return (
    <div 
      ref={ref}
      className={`${getAnimationClasses()} gpu-accelerated ${className}`}
      style={{ 
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
};

export default ScrollAnimationWrapper;