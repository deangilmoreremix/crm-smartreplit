import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, link }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <div className="p-3 bg-blue-50 rounded-full w-min mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 mb-4 flex-grow">{description}</p>
      <Link to={link} className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-auto">
        Learn More <ArrowRight className="h-4 w-4 ml-1" />
      </Link>
    </div>
  );
};

export default FeatureCard;