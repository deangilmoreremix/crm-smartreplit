import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  position: string;
  company: string;
  image: string;
  stars: number;
}

const TestimonialCard = ({
  quote,
  name,
  position,
  company,
  image,
  stars
}: TestimonialCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full border border-gray-100">
      <div className="flex mb-4">
        {Array(5).fill(0).map((_, index) => (
          <Star 
            key={index}
            className={`h-5 w-5 ${index < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
      <p className="text-gray-700 mb-6 text-lg italic">{quote}</p>
      <div className="flex items-center">
        <img 
          src={image} 
          alt={name} 
          className="h-12 w-12 rounded-full mr-4 object-cover"
        />
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-gray-600 text-sm">{position}, {company}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;