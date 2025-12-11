import React from 'react';

const ClientLogos: React.FC = () => {
  // Mock client logos
  const logos = [
    { name: "TechCorp", letter: "T" },
    { name: "Innovative Inc", letter: "I" },
    { name: "GlobalSoft", letter: "G" },
    { name: "FutureTech", letter: "F" },
    { name: "NextGen Solutions", letter: "N" },
    { name: "Digital Dynamics", letter: "D" }
  ];
  
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <p className="text-center text-gray-600 mb-8">Trusted by innovative companies worldwide</p>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 px-4">
          {logos.map((logo, index) => (
            <div 
              key={index} 
              className="h-12 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
                {logo.letter}
              </div>
              <span className="ml-2 text-gray-700 font-medium">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientLogos;