import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Edit, 
  Mail, 
  Phone, 
  Plus, 
  MessageSquare,
  FileText,
  Calendar,
  MoreHorizontal,
  User,
  Globe,
  Clock
} from 'lucide-react';

const socialPlatforms = [
  { icon: MessageSquare, color: 'bg-green-500', name: 'WhatsApp' },
  { icon: Globe, color: 'bg-blue-500', name: 'LinkedIn' },
  { icon: Mail, color: 'bg-blue-600', name: 'Email' },
  { icon: MessageSquare, color: 'bg-purple-500', name: 'Discord' },
];

const CustomerProfile: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Profile</h3>
        <div className="flex space-x-2">
          <button className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}>
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}>
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg">
            <img 
              src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
              alt="Eva Robinson"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full"></div>
        </div>
        <h4 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>Eva Robinson</h4>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>CEO, Inc. Alabama Machinery & Supply</p>
      </div>

      <div className="flex justify-center space-x-3 mb-8">
        <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Edit className="w-4 h-4" />
        </button>
        <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Mail className="w-4 h-4" />
        </button>
        <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Phone className="w-4 h-4" />
        </button>
        <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Plus className="w-4 h-4" />
        </button>
        <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
          <FileText className="w-4 h-4" />
        </button>
        <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h5 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Detailed Information</h5>
            <div className="flex space-x-2">
              <button className={`p-1 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded transition-colors`}>
                <Edit className="w-4 h-4" />
              </button>
              <button className={`p-1 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded transition-colors`}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`flex items-center justify-between py-3 ${isDark ? '' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'} rounded-full flex items-center justify-center`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>First Name</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Eva</p>
                </div>
              </div>
              <button className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className={`flex items-center justify-between py-3 ${isDark ? '' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'} rounded-full flex items-center justify-center`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Last Name</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Robinson</p>
                </div>
              </div>
              <button className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className={`flex items-center justify-between py-3 ${isDark ? '' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'} rounded-full flex items-center justify-center`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Email</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Eva@alabamamachineries.com</p>
                </div>
              </div>
              <button className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className={`flex items-center justify-between py-3 ${isDark ? '' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'} rounded-full flex items-center justify-center`}>
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Phone Number</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>+91 120 222 313</p>
                </div>
              </div>
              <button className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className={`flex items-center justify-between py-3 ${isDark ? '' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'} rounded-full flex items-center justify-center`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Socials</p>
                  <div className="flex space-x-2 mt-2">
                    {socialPlatforms.map((social, index) => {
                      const Icon = social.icon;
                      return (
                        <div 
                          key={index} 
                          className={`${social.color} p-1.5 rounded-lg text-white hover:opacity-80 transition-opacity cursor-pointer`}
                          title={social.name}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className={`flex items-center justify-between py-3 ${isDark ? '' : ''}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Last Connected</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>06/15/2023 at 7:16 pm</p>
                </div>
              </div>
              <button className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;