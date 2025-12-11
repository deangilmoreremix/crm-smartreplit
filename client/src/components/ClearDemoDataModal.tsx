import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDemoData } from '../contexts/DemoDataContext';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ClearDemoDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClearDemoDataModal = ({ isOpen, onClose }: ClearDemoDataModalProps) => {
  const { isDark } = useTheme();
  const { clearDemoData } = useDemoData();
  const [isClearing, setIsClearing] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  if (!isOpen) return null;

  const demoContentItems = [
    { label: '8 sample contacts', count: 8 },
    { label: '5 sample deals in pipeline', count: 5 },
    { label: '12 sample tasks', count: 12 },
    { label: '6 sample appointments', count: 6 },
    { label: '15 sample communications', count: 15 },
    { label: 'AI-generated insights', count: 1 },
    { label: 'Sample activity feed', count: 1 },
    { label: 'Demo metrics and KPIs', count: 1 }
  ];

  const handleClear = () => {
    setIsClearing(true);
    setTimeout(() => {
      clearDemoData();
      setIsClearing(false);
      setIsCleared(true);
      setTimeout(() => {
        onClose();
        setIsCleared(false);
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } rounded-2xl border shadow-2xl max-w-md w-full p-6`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Clear Demo Data
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isCleared ? (
          <>
            {/* Warning */}
            <div className={`mb-4 p-3 rounded-lg ${
              isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
            } border flex items-start space-x-2`}>
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  This will remove all demo content from your dashboard
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-yellow-500' : 'text-yellow-700'}`}>
                  You can restore it anytime from Settings
                </p>
              </div>
            </div>

            {/* Demo Content List */}
            <div className="mb-6">
              <p className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                The following demo content will be hidden:
              </p>
              <ul className="space-y-2">
                {demoContentItems.map((item, index) => (
                  <li
                    key={index}
                    className={`flex items-center space-x-2 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isDark ? 'bg-gray-600' : 'bg-gray-400'
                    }`} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isClearing}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                data-testid="button-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                disabled={isClearing}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-clear-demo"
              >
                {isClearing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Clearing...
                  </span>
                ) : (
                  'Clear Demo Data'
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Demo data cleared!
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your dashboard will now show empty states
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClearDemoDataModal;
