import { Link } from 'react-router-dom';
import { CheckCircle, Zap } from 'lucide-react';

interface PricingCardProps {
  tier: string;
  price: number;
  description: string;
  buttonText: string;
  features: string[];
  popular?: boolean;
  color?: string;
}

const PricingCard = ({
  tier,
  price,
  description,
  buttonText,
  features,
  popular = false,
  color = 'bg-white'
}: PricingCardProps) => {
  return (
    <div className={`rounded-xl ${color} p-8 border relative h-full ${
      popular ? 'transform scale-105 shadow-xl z-10' : 'shadow-lg'
    }`}>
      {popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-1 px-4 rounded-full text-sm font-medium flex items-center">
            <Zap size={14} className="mr-1" />
            Most Popular
          </div>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{tier}</h3>
        <div className="flex justify-center items-start mb-2">
          <span className="text-2xl mr-1">$</span>
          <span className="text-5xl font-bold">{price}</span>
          <span className="text-lg text-gray-500 self-end mb-1">/month</span>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
      
      <div className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-auto">
        <Link
          to="/dashboard"
          className={`block w-full py-3 rounded-lg font-medium transition-colors ${
            popular
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md'
              : 'bg-white text-blue-600 border border-blue-200 hover:border-blue-300 hover:bg-blue-50'
          }`}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
};

export default PricingCard;