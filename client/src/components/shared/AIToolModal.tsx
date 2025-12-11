import React, { useState, useRef, ReactNode } from 'react';
import { X, Maximize2, Minimize2, Copy, Download, Upload, RefreshCw } from 'lucide-react';

interface AIToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

const AIToolModal: React.FC<AIToolModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'max-w-4xl'
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Close on escape key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Close if clicking outside the modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div 
        ref={modalRef}
        className={`${
          isFullScreen 
            ? 'fixed inset-4 md:inset-8' 
            : `relative ${maxWidth} w-full max-h-[85vh] md:max-h-[90vh]`
        } bg-white rounded-xl shadow-xl flex flex-col overflow-hidden transition-all duration-200 transform scale-100 opacity-100 border border-gray-200`}
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px 0 rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Header with gradient background */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-100">
              {icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullScreen}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body with subtle background and improved scrolling */}
        <div className="flex-1 p-6 overflow-y-auto bg-white bg-opacity-80 bg-[radial-gradient(#f3f4f6_1px,transparent_1px)] bg-[size:20px_20px]">
          <div className="bg-white bg-opacity-95 p-6 rounded-xl border border-gray-100 shadow-sm">
            {children}
          </div>
        </div>

        {/* Optional footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>Powered by AI</div>
            <div className="flex items-center space-x-2">
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIToolModal;