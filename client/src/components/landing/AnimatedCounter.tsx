import React, { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  end, 
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (hasAnimated.current || !countRef.current) return;
      
      const element = countRef.current;
      const elementPosition = element.getBoundingClientRect();
      
      // Check if element is in viewport
      if (elementPosition.top < window.innerHeight) {
        hasAnimated.current = true;
        
        let startTime: number;
        let startValue = 0;
        const endValue = end;
        
        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const easedProgress = easeOutQuart(progress);
          const currentValue = startValue + (endValue - startValue) * easedProgress;
          
          setCount(currentValue);
          
          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        };
        
        window.requestAnimationFrame(step);
      }
    };
    
    // Initial check
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [end, duration]);
  
  // Easing function for smoother animation
  const easeOutQuart = (x: number): number => {
    return 1 - Math.pow(1 - x, 4);
  };
  
  // Format the number with commas and correct decimal places
  const formattedCount = count.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return (
    <span ref={countRef} className="font-bold transition-all duration-200">
      {prefix}{formattedCount}{suffix}
    </span>
  );
};

export default AnimatedCounter;