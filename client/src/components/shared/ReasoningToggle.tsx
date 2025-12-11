import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface ReasoningToggleProps {
  reasoning: string | null;
}

const ReasoningToggle: React.FC<ReasoningToggleProps> = ({ reasoning }) => {
  const [visible, setVisible] = useState(false);
  if (!reasoning) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setVisible(!visible)}
        className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center mb-2"
      >
        <Brain size={16} className="mr-1" />
        {visible ? 'Hide AI Reasoning' : 'Show AI Reasoning'}
      </button>
      {visible && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center mb-2">
            <Sparkles size={16} className="text-purple-600 mr-2" />
            <h4 className="font-medium text-purple-800">AI Reasoning Insights</h4>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-line">{reasoning}</div>
        </div>
      )}
    </div>
  );
};

export default ReasoningToggle;
