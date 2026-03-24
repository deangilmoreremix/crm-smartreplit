import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ClientLogos: React.FC = () => {
  const { isDark } = useTheme();
  
  // Mock client logos
  const logos = [
    { name: 'TechCorp', letter: 'T' },
    { name: 'Innovative Inc', letter: 'I' },
    { name: 'GlobalSoft', letter: 'G' },
    { name: 'FutureTech', letter: 'F' },
    { name: 'NextGen Solutions', letter: 'N' },
    { name: 'Digital Dynamics', letter: 'D' },
  ];

  return (
    <div className={`py-12 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4">
        <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8`}>Trusted by innovative companies worldwide</p>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 px-4">
          {logos.map((logo, index) => (
            <div key={index} className="h-12 flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                isDark 
                  ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-primary' 
                  : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-600'
              }`}>
                {logo.letter}
              </div>
              <span className={`ml-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientLogos;
