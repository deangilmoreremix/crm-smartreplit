import { useEffect, useRef, useState } from 'react';
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
  const [isCleared, setIsCleared] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cancel any pending close/reset timers if the modal unmounts mid-flow.
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    []
  );

  if (!isOpen) return null;

  // Keep in step with what the dashboard actually hides when the sample-data flag is off.
  const demoContentItems = [
    { label: 'Sample deals in the pipeline (4)', count: 4 },
    { label: 'Sample contacts (5)', count: 5 },
    { label: 'Sample appointments (3)', count: 3 },
    { label: 'Sample sales charts, conversion metrics and analytics insights', count: 1 },
    { label: 'Sample customer profile, tasks and interaction history', count: 1 },
    { label: 'Sample communications, upcoming deals and activity feed', count: 1 },
    { label: 'Sample stage funnel and task schedule', count: 1 },
  ];

  const handleClear = () => {
    clearDemoData();
    setIsCleared(true);
    timers.current.push(
      setTimeout(() => {
        onClose();
        setIsCleared(false);
      }, 1500)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } rounded-2xl border shadow-2xl max-w-md w-full p-6`}
      >
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
            <div
              className={`mb-4 p-3 rounded-lg ${
                isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
              } border flex items-start space-x-2`}
            >
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p
                  className={`text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}
                >
                  This will remove all demo content from your dashboard
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-yellow-500' : 'text-yellow-700'}`}>
                  You can restore it anytime from Settings or the Restore button on the dashboard
                </p>
              </div>
            </div>

            {/* Demo Content List */}
            <div className="mb-6">
              <p
                className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
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
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
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
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-clear-demo"
              >
                Clear Demo Data
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
