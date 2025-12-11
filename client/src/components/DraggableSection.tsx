import React, { useRef } from 'react';
import { useDashboardLayout } from '../contexts/DashboardLayoutContext';
import { useTheme } from '../contexts/ThemeContext';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface DraggableSectionProps {
  sectionId: string;
  children: React.ReactNode;
  index: number;
}

const DraggableSection: React.FC<DraggableSectionProps> = ({ sectionId, children, index }) => {
  const { 
    isDragging, 
    setIsDragging, 
    draggedItem, 
    setDraggedItem, 
    sectionOrder,
    setSectionOrder,
    getSectionConfig
  } = useDashboardLayout();
  
  const { isDark } = useTheme();
  const dragRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const sectionConfig = getSectionConfig(sectionId);
  
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    setDraggedItem(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
    
    // Add drag image
    if (dragRef.current) {
      const dragImage = dragRef.current.cloneNode(true) as HTMLElement;
      dragImage.style.transform = 'rotate(2deg)';
      dragImage.style.opacity = '0.8';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
    setDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set dragOver to false if we're actually leaving the section
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const draggedSectionId = e.dataTransfer.getData('text/plain');
    if (draggedSectionId && draggedSectionId !== sectionId) {
      // Find the current indices
      const draggedIndex = sectionOrder.indexOf(draggedSectionId);
      const targetIndex = sectionOrder.indexOf(sectionId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Create new order array
        const newOrder = [...sectionOrder];
        
        // Remove the dragged item from its current position
        const [draggedSection] = newOrder.splice(draggedIndex, 1);
        
        // Insert it at the target position
        newOrder.splice(targetIndex, 0, draggedSection);
        
        // Update the section order
        setSectionOrder(newOrder);
      }
    }
  };

  const handleRemoveSection = () => {
    const newOrder = sectionOrder.filter(id => id !== sectionId);
    setSectionOrder(newOrder);
  };

  const isBeingDragged = draggedItem === sectionId;
  const showDropZone = isDragging && !isBeingDragged;

  return (
    <div className="relative">
      {/* Drop zone indicator */}
      {showDropZone && dragOver && (
        <div className={`absolute -top-4 left-0 right-0 h-2 ${isDark ? 'bg-green-400/50' : 'bg-green-500/50'} rounded-full z-10 transition-all duration-200`}>
          <div className={`h-full ${isDark ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-pulse`}></div>
        </div>
      )}

      <div
        ref={dragRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative transition-all duration-300 cursor-move ${
          isBeingDragged 
            ? 'opacity-50 scale-95 rotate-1 z-50' 
            : isDragging 
            ? 'opacity-75' 
            : 'opacity-100'
        } ${
          dragOver && showDropZone 
            ? `ring-2 ${isDark ? 'ring-green-400/50' : 'ring-green-500/50'} ring-offset-2 ${isDark ? 'ring-offset-gray-900' : 'ring-offset-white'}` 
            : ''
        }`}
      >
        {/* Drag Handle */}
        <div className={`absolute left-2 top-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing`}>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm border shadow-lg`}>
            <GripVertical size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          </div>
        </div>

        {/* Section Controls */}
        <div className={`absolute right-2 top-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2`}>
          <button 
            onClick={handleRemoveSection}
            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/80 border-white/10 hover:bg-red-500/20' : 'bg-white/80 border-gray-200 hover:bg-red-50'} backdrop-blur-sm border shadow-lg transition-colors`}
            title="Hide Section"
          >
            <EyeOff size={14} className={isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'} />
          </button>
        </div>

        {/* Drag State Overlay */}
        {isBeingDragged && (
          <div className={`absolute inset-0 ${isDark ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center`}>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 border-white/20' : 'bg-white border-gray-300'} border shadow-xl`}>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Moving "{sectionConfig?.title}"
              </p>
            </div>
          </div>
        )}

        {children}
      </div>

      {/* Drop zone indicator at bottom */}
      {showDropZone && dragOver && (
        <div className={`absolute -bottom-4 left-0 right-0 h-2 ${isDark ? 'bg-green-400/50' : 'bg-green-500/50'} rounded-full z-10 transition-all duration-200`}>
          <div className={`h-full ${isDark ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-pulse`}></div>
        </div>
      )}
    </div>
  );
};

export default DraggableSection;