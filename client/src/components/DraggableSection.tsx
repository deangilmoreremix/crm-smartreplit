import React, { useRef } from 'react';
import { useDashboardLayout } from '../contexts/DashboardLayoutContext';
import { useTheme } from '../contexts/ThemeContext';
import { GripVertical, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';

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
    getSectionConfig,
    toggleSection,
    visibleSections,
  } = useDashboardLayout();

  const { isDark } = useTheme();
  const dragRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const sectionConfig = getSectionConfig(sectionId);

  // Only the handle is draggable so text selection, inputs and in-widget drag (kanban/tasks)
  // keep working. The drag image is the whole section container.
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    setDraggedItem(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox will not start a drag without data.
    e.dataTransfer.setData('text/plain', sectionId);
    if (dragRef.current && typeof e.dataTransfer.setDragImage === 'function') {
      e.dataTransfer.setDragImage(dragRef.current, 16, 16);
    }
  };

  // Keyboard / click reordering among the currently visible sections.
  const moveBy = (delta: -1 | 1) => {
    const pos = visibleSections.indexOf(sectionId);
    const neighbor = visibleSections[pos + delta];
    if (pos === -1 || !neighbor) return;
    const from = sectionOrder.indexOf(sectionId);
    const to = sectionOrder.indexOf(neighbor);
    if (from === -1 || to === -1) return;
    const next = [...sectionOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSectionOrder(next);
  };
  const visiblePos = visibleSections.indexOf(sectionId);
  const canMoveUp = visiblePos > 0;
  const canMoveDown = visiblePos !== -1 && visiblePos < visibleSections.length - 1;
  const title = sectionConfig?.title ?? sectionId;

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
    toggleSection(sectionId);
  };

  const isBeingDragged = draggedItem === sectionId;
  const showDropZone = isDragging && !isBeingDragged;

  return (
    <div className="relative">
      {/* Drop zone indicator */}
      {showDropZone && dragOver && (
        <div
          className={`absolute -top-4 left-0 right-0 h-2 ${isDark ? 'bg-green-400/50' : 'bg-green-500/50'} rounded-full z-10 transition-all duration-200`}
        >
          <div
            className={`h-full ${isDark ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-pulse`}
          ></div>
        </div>
      )}

      <div
        ref={dragRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative transition-all duration-300 ${
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
        {/* Reorder controls: drag handle + keyboard-accessible move buttons */}
        <div
          className="absolute left-2 top-4 z-20 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200"
        >
          <div
            className={`rounded-lg ${isDark ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-sm border shadow-lg flex flex-col items-center`}
          >
            <button
              type="button"
              onClick={() => moveBy(-1)}
              disabled={!canMoveUp}
              aria-label={`Move ${title} up`}
              title="Move up"
              className="p-1 disabled:opacity-30"
            >
              <ChevronUp size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            </button>
            <div
              draggable
              role="button"
              tabIndex={-1}
              aria-label={`Drag to reorder ${title}`}
              title="Drag to reorder"
              data-testid={`drag-handle-${sectionId}`}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className="p-1 cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            </div>
            <button
              type="button"
              onClick={() => moveBy(1)}
              disabled={!canMoveDown}
              aria-label={`Move ${title} down`}
              title="Move down"
              className="p-1 disabled:opacity-30"
            >
              <ChevronDown size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            </button>
          </div>
        </div>

        {/* Section Controls */}
        <div
          className={`absolute right-2 top-4 z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 flex space-x-2`}
        >
          <button
            type="button"
            onClick={handleRemoveSection}
            aria-label={`Hide ${title}`}
            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/80 border-white/10 hover:bg-red-500/20' : 'bg-white/80 border-gray-200 hover:bg-red-50'} backdrop-blur-sm border shadow-lg transition-colors`}
            title="Hide Section"
          >
            <EyeOff
              size={14}
              className={
                isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'
              }
            />
          </button>
        </div>

        {/* Drag State Overlay */}
        {isBeingDragged && (
          <div
            className={`absolute inset-0 ${isDark ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center`}
          >
            <div
              className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 border-white/20' : 'bg-white border-gray-300'} border shadow-xl`}
            >
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
        <div
          className={`absolute -bottom-4 left-0 right-0 h-2 ${isDark ? 'bg-green-400/50' : 'bg-green-500/50'} rounded-full z-10 transition-all duration-200`}
        >
          <div
            className={`h-full ${isDark ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-pulse`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default DraggableSection;
