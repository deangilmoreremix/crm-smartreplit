import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { Brain, Users, BarChart3, Zap, Search, Image, Mail, ArrowRight } from 'lucide-react';
import { WhitelabelButton } from '../../types/whitelabel';

interface ParallaxHeroProps {
  title?: string;
  subtitle?: string;
  ctaButtons?: WhitelabelButton[];
}

const ParallaxHero: React.FC<ParallaxHeroProps> = ({
  title = "Experience the Future of Sales Technology",
  subtitle = "Our AI-powered CRM transforms how sales teams work by automating routine tasks, providing deep insights, and helping you close more deals.",
  ctaButtons = []
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [hasRendered, setHasRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);

  // Track when component has rendered
  useEffect(() => {
    console.log("ParallaxHero component mounted");
    setHasRendered(true);
  }, []);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { top } = containerRef.current.getBoundingClientRect();
        
        // Only update if the element is in view
        if (top < window.innerHeight && top > -containerRef.current.clientHeight) {
          setScrollY(window.scrollY);
          console.log("Updating parallax scroll position:", window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Force an initial call to properly position elements
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasRendered]);
  
  const parallaxItems = [
    { 
      icon: <Brain size={40} className="text-indigo-600" />, 
      speed: 0.3, 
      startY: 20, 
      startX: 20,
      label: 'AI Assistant' 
    },
    { 
      icon: <Users size={32} className="text-blue-600" />, 
      speed: 0.2, 
      startY: 60, 
      startX: 15,
      label: 'Contacts' 
    },
    { 
      icon: <BarChart3 size={36} className="text-purple-600" />, 
      speed: 0.4, 
      startY: 30, 
      startX: 80,
      label: 'Analytics' 
    },
    { 
      icon: <Zap size={30} className="text-amber-600" />, 
      speed: 0.25, 
      startY: 70, 
      startX: 85,
      label: 'Automation' 
    },
    { 
      icon: <Search size={28} className="text-cyan-600" />, 
      speed: 0.15, 
      startY: 50, 
      startX: 10,
      label: 'Search' 
    },
    { 
      icon: <Image size={34} className="text-emerald-600" />, 
      speed: 0.35, 
      startY: 80, 
      startX: 70,
      label: 'Visuals' 
    },
    { 
      icon: <Mail size={30} className="text-rose-600" />, 
      speed: 0.3, 
      startY: 40, 
      startX: 90, 
      label: 'Communication'
    }
  ];

  // Log the rendering state and elements
  useEffect(() => {
    if (containerRef.current) {
      console.log("ParallaxHero container element:", containerRef.current);
      const styles = window.getComputedStyle(containerRef.current);
      console.log("Container styles:", {
        position: styles.position,
        background: styles.background,
        backgroundImage: styles.backgroundImage,
        height: styles.height,
        minHeight: styles.minHeight
      });
    }
    
    if (iconsRef.current) {
      console.log("Icons container:", iconsRef.current);
      console.log("Parallax items count:", parallaxItems.length);
      console.log("Parallax icons rendered:", iconsRef.current.querySelectorAll('.absolute').length);
    }
  }, [hasRendered]);

  return (
    <div 
      ref={containerRef}
      className="relative min-h-[600px] overflow-hidden bg-gradient-to-b from-gray-50 to-indigo-50 py-24"
    >
      {/* Debug information */}
      <div 
        style={{ position: 'absolute', top: 5, left: 5, fontSize: '10px', color: '#666', zIndex: 1000, backgroundColor: 'white', padding: '2px 5px', borderRadius: '3px' }}
      >
        ScrollY: {scrollY} | Items: {parallaxItems.length}
      </div>
      
      {/* Parallax Elements */}
      <div ref={iconsRef} className="absolute inset-0 pointer-events-none">
        {parallaxItems.map((item, index) => (
          <div
            key={index}
            className="absolute flex flex-col items-center gpu-accelerated"
            style={{
              top: `${item.startY}%`,
              left: `${item.startX}%`,
              transform: `translateY(${scrollY * item.speed}px) translateZ(0)`,
              transition: 'transform 0.1s linear',
              willChange: 'transform'
            }}
          >
            <div className="p-4 bg-white rounded-full shadow-lg">
              {item.icon}
            </div>
            <div className="mt-2 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium">
              {item.label}
            </div>
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {title.includes('Sales Technology') ? (
              <>Experience the Future of <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Sales Technology</span></>
            ) : (
              title
            )}
          </h1>

          <p className="text-xl text-gray-700 mb-12">
            {subtitle}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {ctaButtons.length > 0 ? (
              ctaButtons.map((button) => (
                <Link
                  key={button.id}
                  to={button.url}
                  style={{ backgroundColor: button.color }}
                  className="
                    px-8 py-4 text-white font-medium rounded-xl
                    hover:shadow-lg transition duration-300 transform hover:translate-y-[-2px]
                    flex items-center
                  "
                >
                  {button.text} <ArrowRight size={18} className="ml-2" />
                </Link>
              ))
            ) : (
              <>
                <Link to="/signin" className="
                  px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl
                  hover:shadow-lg transition duration-300 transform hover:translate-y-[-2px]
                  flex items-center
                ">
                  Sign In to SmartCRM <ArrowRight size={18} className="ml-2" />
                </Link>

                <HashLink to="#features" className="
                  px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl border border-indigo-200
                  hover:border-indigo-300 hover:shadow-md transition duration-300 transform hover:translate-y-[-2px]
                ">
                  Explore Features
                </HashLink>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '8s'}}></div>
      <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '12s', animationDelay: '1s'}}></div>
    </div>
  );
};

export default ParallaxHero;