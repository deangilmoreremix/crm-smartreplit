import React from 'react';
import { 
  Brain, 
  Mail, 
  MessageSquare, 
  FileText, 
  Phone, 
  Target, 
  FileSearch, 
  TrendingUp, 
  BarChart3,
  PieChart, 
  Users,
  Briefcase,
  Eye,
  Image,
  Search,
  Zap
} from 'lucide-react';

interface FloatingIconsProps {
  count?: number;
  position?: 'top' | 'right' | 'bottom' | 'left' | 'all';
}

const FloatingIcons: React.FC<FloatingIconsProps> = ({ 
  count = 6,
  position = 'all'
}) => {
  const iconComponents = [
    <Brain size={20} className="text-indigo-500" />,
    <Mail size={20} className="text-blue-500" />,
    <MessageSquare size={20} className="text-purple-500" />,
    <FileText size={20} className="text-emerald-500" />,
    <Phone size={20} className="text-violet-500" />,
    <Target size={20} className="text-rose-500" />,
    <FileSearch size={20} className="text-amber-500" />,
    <TrendingUp size={20} className="text-cyan-500" />,
    <BarChart3 size={20} className="text-blue-500" />,
    <Users size={20} className="text-emerald-500" />,
    <Briefcase size={20} className="text-indigo-500" />,
    <Eye size={20} className="text-fuchsia-500" />,
    <Image size={20} className="text-emerald-500" />,
    <Search size={20} className="text-blue-500" />,
    <Zap size={20} className="text-yellow-500" />,
    <PieChart size={20} className="text-purple-500" />
  ];
  
  // Get random icons
  const selectedIcons = iconComponents
    .sort(() => 0.5 - Math.random())
    .slice(0, count);
  
  // Generate positions based on the position prop
  const getPositionClass = (index: number) => {
    // Define position styles for different areas
    const positionStyles = {
      top: [
        'top-10 left-[10%]', 'top-20 left-[30%]', 'top-12 left-[50%]', 
        'top-16 left-[70%]', 'top-24 left-[90%]', 'top-32 left-[20%]'
      ],
      right: [
        'top-[20%] right-10', 'top-[30%] right-20', 'top-[50%] right-12',
        'top-[70%] right-16', 'top-[40%] right-24', 'top-[60%] right-8'
      ],
      bottom: [
        'bottom-10 left-[10%]', 'bottom-20 left-[30%]', 'bottom-12 left-[50%]',
        'bottom-16 left-[70%]', 'bottom-24 left-[90%]', 'bottom-32 left-[20%]'
      ],
      left: [
        'top-[20%] left-10', 'top-[30%] left-20', 'top-[50%] left-12',
        'top-[70%] left-16', 'top-[40%] left-24', 'top-[60%] left-8'
      ],
      all: [
        'top-[10%] left-[5%]', 'top-[20%] right-[10%]', 'bottom-[15%] left-[10%]',
        'bottom-[30%] right-[15%]', 'top-[40%] left-[15%]', 'top-[60%] right-[5%]',
        'bottom-[40%] left-[20%]', 'bottom-[20%] right-[20%]', 'top-[30%] right-[25%]',
        'top-[50%] left-[25%]', 'bottom-[10%] left-[30%]', 'bottom-[5%] right-[5%]',
        'top-[70%] right-[30%]', 'top-[80%] left-[35%]', 'bottom-[60%] right-[35%]'
      ]
    };
    
    const positions = positionStyles[position];
    return positions[index % positions.length];
  };
  
  // Generate different animation durations and delays
  const getAnimationStyle = (index: number) => {
    // Animation duration between 5 and 8 seconds
    const duration = 5 + Math.floor((index % 4) * 1.5);
    
    // Animation delay between 0 and 2 seconds
    const delay = Math.floor((index % 3) * 0.7);
    
    return {
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`
    };
  };
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {selectedIcons.map((icon, index) => (
        <div 
          key={index}
          className={`absolute opacity-20 animate-float gpu-accelerated ${getPositionClass(index)}`}
          style={getAnimationStyle(index)}
        >
          <div className="p-3 bg-white rounded-full shadow-lg">
            {icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingIcons;