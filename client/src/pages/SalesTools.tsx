import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDays,
  Video,
  MessageCircle,
  Phone,
  Receipt,
  CheckSquare,
  ArrowRight
} from 'lucide-react';

const SalesTools: React.FC = () => {
  const tools = [
    {
      title: "Appointments",
      description: "Schedule and manage meetings with your contacts",
      icon: <CalendarDays size={36} className="text-blue-600" />,
      path: "/appointments",
      color: "from-blue-500/10 to-blue-600/20"
    },
    {
      title: "Video Email",
      description: "Create and send personalized video messages to your contacts",
      icon: <Video size={36} className="text-purple-600" />,
      path: "/video-email",
      color: "from-purple-500/10 to-purple-600/20"
    },
    {
      title: "Text Messages",
      description: "Send and receive SMS messages with leads and clients",
      icon: <MessageCircle size={36} className="text-green-600" />,
      path: "/text-messages",
      color: "from-green-500/10 to-green-600/20"
    },
    {
      title: "Phone System",
      description: "Make and receive calls directly from your CRM",
      icon: <Phone size={36} className="text-indigo-600" />,
      path: "/phone-system",
      color: "from-indigo-500/10 to-indigo-600/20"
    },
    {
      title: "Invoicing",
      description: "Create, send, and track invoices to your clients and customers",
      icon: <Receipt size={36} className="text-amber-600" />,
      path: "/invoicing",
      color: "from-amber-500/10 to-amber-600/20"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales Tools</h1>
        <p className="text-gray-600 mt-1">Comprehensive tools to optimize your sales process</p>
      </header>
      
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-xl shadow-sm mb-10 border border-blue-100">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white shadow-lg">
            <CheckSquare size={48} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Sales Productivity Suite</h2>
            <p className="text-gray-700 text-lg">
              Our integrated sales tools help you communicate more effectively, 
              close more deals, and build stronger relationships with your customers.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <Link 
            key={index} 
            to={tool.path}
            className="card-modern p-6 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex flex-col h-full">
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm" 
                   style={{backgroundImage: `linear-gradient(to right, ${tool.color})`}}>
                {tool.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
              <p className="text-gray-600 mb-4 flex-1">{tool.description}</p>
              <div className="mt-auto">
                <span className="inline-flex items-center text-blue-600 font-medium transition-all duration-300 group-hover:translate-x-1">
                  Open tool 
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SalesTools;