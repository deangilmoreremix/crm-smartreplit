import React from 'react';
import AnimatedCounter from './AnimatedCounter';

interface StatCounterProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const StatCounter: React.FC<StatCounterProps> = ({
  icon,
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transform transition-transform hover:scale-105 hover:shadow-md animation-fix">
      <div className="flex items-center mb-3">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{label}</h3>
      </div>
      <div className="text-3xl font-bold text-gray-900">
        <AnimatedCounter 
          end={value} 
          prefix={prefix} 
          suffix={suffix} 
          decimals={decimals} 
        />
      </div>
    </div>
  );
};

export default StatCounter;