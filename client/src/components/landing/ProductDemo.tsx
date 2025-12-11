import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Mail, Calendar, Briefcase, Users, Brain, CheckCircle, BarChart3, Target } from 'lucide-react';

interface DemoSlide {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

const ProductDemo: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  
  const slides: DemoSlide[] = [
    {
      title: "AI-Powered CRM Dashboard",
      description: "Get a complete overview of your sales pipeline with real-time analytics and AI insights",
      image: "https://images.pexels.com/photos/6476582/pexels-photo-6476582.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Smart Lead Management",
      description: "Prioritize your leads with AI scoring and get personalized engagement recommendations",
      image: "https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      icon: <Users className="h-6 w-6 text-indigo-600" />
    },
    {
      title: "AI Deal Intelligence",
      description: "Get strategic insights and recommendations to close deals faster",
      image: "https://images.pexels.com/photos/8370380/pexels-photo-8370380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      icon: <Briefcase className="h-6 w-6 text-violet-600" />
    },
    {
      title: "Smart Email Automation",
      description: "Create personalized emails with AI and automate your follow-ups",
      image: "https://images.pexels.com/photos/6476589/pexels-photo-6476589.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      icon: <Mail className="h-6 w-6 text-rose-600" />
    }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [slides.length]);
  
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 relative">
      <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-r from-white/90 to-white/80 backdrop-blur z-20">
        <div className="flex space-x-1">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full flex-1 transition-colors ${
                index === activeSlide ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </div>
      
      <div className="overflow-hidden h-[400px] md:h-[500px] w-full relative">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-6 text-white w-full">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm mr-3">
                    {slide.icon}
                  </div>
                  <h3 className="text-xl font-bold">{slide.title}</h3>
                </div>
                <p className="text-white/80 mb-4">{slide.description}</p>
                <button className="inline-flex items-center text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-white transition-colors">
                  Learn more <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center">
            <CheckCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
            <span className="text-xs">14-day free trial</span>
          </div>
          <div className="flex items-center">
            <CheckCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
            <span className="text-xs">No credit card required</span>
          </div>
          <div className="flex items-center">
            <CheckCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
            <span className="text-xs">Free onboarding</span>
          </div>
          <div className="flex items-center">
            <CheckCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
            <span className="text-xs">Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDemo;