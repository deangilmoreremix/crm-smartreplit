import React, { useEffect, useRef } from 'react';
import LandingHeader from './components/LandingHeader';

const TestLandingPage: React.FC = () => {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Test Landing Page loaded");
    if (bgRef.current) {
      const computedStyle = window.getComputedStyle(bgRef.current);
      console.log("Background computed style:", {
        background: computedStyle.background,
        backgroundImage: computedStyle.backgroundImage,
        opacity: computedStyle.opacity,
        position: computedStyle.position
      });
    }
  }, []);

  return (
    <div className="relative">
      <LandingHeader />
      
      {/* Test section 1: Simple gradient background */}
      <section className="relative h-screen">
        <div 
          ref={bgRef}
          className="absolute inset-0 bg-gradient-to-b from-white to-blue-50"
        ></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <h1 className="text-4xl font-bold text-center">Background Test 1: Gradient</h1>
        </div>
      </section>
      
      {/* Test section 2: Particle background */}
      <section className="relative h-screen">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-blue-500 opacity-20"
              style={{
                width: `${20 + Math.random() * 30}px`,
                height: `${20 + Math.random() * 30}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 5}s ease-in-out ${Math.random() * 2}s infinite`
              }}
            ></div>
          ))}
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <h1 className="text-4xl font-bold text-center">Background Test 2: Particles</h1>
        </div>
      </section>
      
      {/* Test section 3: Image background */}
      <section className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')" 
          }}
        ></div>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="container mx-auto px-4 py-20 relative z-10 text-white">
          <h1 className="text-4xl font-bold text-center">Background Test 3: Image</h1>
        </div>
      </section>
    </div>
  );
};

export default TestLandingPage;