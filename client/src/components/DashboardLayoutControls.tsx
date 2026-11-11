import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDashboardLayout, sectionConfigs } from '../contexts/DashboardLayoutContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Settings,
  RotateCcw,
  Move3D,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  X,
  Palette,
  GripVertical,
  Save,
  Star,
  Pencil,
  Trash2,
} from 'lucide-react';

/** Ids Dashboard.tsx renders that have no (or a different) entry in sectionConfigs. */
const EXTRA_RENDERED_SECTIONS = ['charts-section', 'analytics-section', 'unified-activity', 'ai-goals-section'];
/** Ids Dashboard.tsx renders as null (now part of executive-overview-section): never list them. */
export const NON_RENDERING_SECTIONS = ['metrics-cards-section', 'kpi-cards-section', 'quick-actions-section'];

const fallbackTitle = (id: string) =>
  id
    .replace(/-section$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const DashboardLayoutControls: React.FC = () => {
  const {
    sectionOrder,
    setSectionOrder,
    resetToBuiltInDefault,
    layoutLoading,
    getSectionConfig,
    isSectionVisible,
    toggleSection,
    sectionSizes,
    setSectionSize,
    savedLayouts,
    defaultLayoutId,
    saveLayoutAs,
    applyLayout,
    renameLayout,
    deleteLayout,
    setDefaultLayout,
  } = useDashboardLayout();
  const [newLayoutName, setNewLayoutName] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const moveSection = (fromId: string, toId: string) => {
    const from = sectionOrder.indexOf(fromId);
    const to = sectionOrder.indexOf(toId);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...sectionOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSectionOrder(next);
  };

  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [alsoClearWidgets, setAlsoClearWidgets] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close the panel on click-outside and Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) setConfirmReset(false);
  }, [isOpen]);

  const handleSectionToggle = (sectionId: string, enabled: boolean) => {
    if (enabled !== isSectionVisible(sectionId)) toggleSection(sectionId);
  };

  // Every section Dashboard can render, so a hidden one can always be re-shown.
  const allSections = useMemo(() => {
    const ids = new Set<string>([
      ...sectionOrder,
      ...Object.keys(sectionConfigs),
      ...EXTRA_RENDERED_SECTIONS,
    ]);
    return Array.from(ids).filter((id) => !NON_RENDERING_SECTIONS.includes(id));
  }, [sectionOrder]);
  const titleOf = (id: string) => getSectionConfig(id)?.title ?? fallbackTitle(id);
  // Visible sections follow their dashboard order; the rest keep list order after them.
  const orderedSections = [...allSections].sort((x, y) => {
    const ix = sectionOrder.indexOf(x);
    const iy = sectionOrder.indexOf(y);
    return (ix === -1 ? 1e6 : ix) - (iy === -1 ? 1e6 : iy);
  });
  const nextSize = { compact: 'normal', normal: 'wide', wide: 'compact' } as const;

  return (
    <div ref={rootRef} className="fixed top-24 right-2 sm:right-4 z-50">
      <div className="relative">
        {/* Control Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-xl ${
            isDark
              ? 'bg-gray-800/90 hover:bg-gray-700/90 border-white/10'
              : 'bg-white/90 hover:bg-gray-50/90 border-gray-200'
          } backdrop-blur-xl border shadow-lg transition-all duration-200 ${
            isOpen ? 'scale-105' : ''
          }`}
          title="Dashboard Layout Settings"
        >
          <Settings
            size={20}
            className={`${isDark ? 'text-white' : 'text-gray-700'} transition-transform duration-200 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        </button>

        {/* Controls Panel */}
        {isOpen && (
          <div
            className={`absolute top-16 right-0 w-72 sm:w-80 ${
              isDark ? 'bg-gray-800/95 border-white/10' : 'bg-white/95 border-gray-200'
            } backdrop-blur-xl border rounded-xl shadow-xl p-4 transition-all duration-200 transform ${
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Palette size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Layout Settings
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-md ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 mb-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`w-full flex items-center justify-between p-3 rounded-lg ${
                  isDark
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                } transition-colors`}
              >
                <div className="flex items-center space-x-2">
                  <Move3D size={16} />
                  <span className="text-sm font-medium">Show order</span>
                </div>
                <div
                  className={`w-5 h-5 rounded border-2 ${
                    showPreview
                      ? 'bg-blue-500 border-blue-500'
                      : `border-gray-400 ${isDark ? 'dark:border-gray-600' : ''}`
                  } flex items-center justify-center`}
                >
                  {showPreview && <Check size={12} className="text-white" />}
                </div>
              </button>

              {confirmReset ? (
                <div
                  role="alertdialog"
                  aria-label="Confirm reset layout"
                  className={`p-3 rounded-lg border ${
                    isDark ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <p className={`text-sm mb-2 ${isDark ? 'text-orange-200' : 'text-orange-800'}`}>
                    Reset section order, visibility and sizes to the built-in default? Saved layouts are kept.
                  </p>
                  <label className={`flex items-center gap-2 text-xs mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <input
                      type="checkbox"
                      checked={alsoClearWidgets}
                      onChange={(e) => setAlsoClearWidgets(e.target.checked)}
                    />
                    Also clear widget settings (date ranges, metrics)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        resetToBuiltInDefault({ clearWidgetSettings: alsoClearWidgets });
                        setConfirmReset(false);
                        setAlsoClearWidgets(false);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-md text-sm font-medium bg-orange-600 text-white hover:bg-orange-700"
                    >
                      Confirm reset
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className={`flex-1 px-3 py-1.5 rounded-md text-sm ${
                        isDark ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg ${
                  isDark
                    ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                    : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                } transition-colors`}
              >
                <RotateCcw size={16} />
                <span className="text-sm font-medium">Reset Layout</span>
              </button>
              )}
            </div>

            {/* Section Visibility Controls */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <h4
                className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}
              >
                Section Visibility
              </h4>

              {layoutLoading ? (
                <div className="space-y-2" data-testid="layout-skeleton" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-9 rounded-lg animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}
                    />
                  ))}
                </div>
              ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {orderedSections.map((sectionId) => {
                  const config = getSectionConfig(sectionId);
                  const isEnabled = isSectionVisible(sectionId);
                  const size = sectionSizes[sectionId] ?? 'normal';

                  const title = titleOf(sectionId);

                  return (
                    <div
                      key={sectionId}
                      draggable={sectionOrder.includes(sectionId)}
                      onDragStart={(e) => {
                        // Firefox will not start a drag without data.
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', sectionId);
                        setDragId(sectionId);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => dragId && moveSection(dragId, sectionId)}
                      onDragEnd={() => setDragId(null)}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center space-x-3">
                        <GripVertical
                          size={14}
                          className="text-gray-400 cursor-grab shrink-0"
                          aria-label="Drag to reorder"
                        />
                        <div
                          className={`w-3 h-3 rounded-full bg-gradient-to-r ${config?.color ?? 'from-gray-400 to-gray-500'}`}
                        ></div>
                        <div>
                          <p
                            className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                          >
                            {title}
                          </p>
                          {config?.description && (
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {config.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSectionSize(sectionId, nextSize[size])}
                        className={`px-1.5 py-0.5 mr-1 rounded text-[10px] uppercase ${
                          isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}
                        title="Section size (click to change)"
                      >
                        {size}
                      </button>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleSectionToggle(sectionId, e.target.checked)}
                        className="sr-only"
                        aria-label={`Show ${title}`}
                      />
                      <button
                        onClick={() => handleSectionToggle(sectionId, !isEnabled)}
                        className={`p-1 rounded-md transition-colors ${
                          isEnabled
                            ? `${isDark ? 'text-green-400 hover:bg-green-400/20' : 'text-green-600 hover:bg-green-100'}`
                            : `${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`
                        }`}
                        title={isEnabled ? 'Hide Section' : 'Show Section'}
                      >
                        {isEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
              )}
            </div>

            {/* Saved Layouts */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-4">
              <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                Layouts
              </h4>
              <form
                className="flex gap-2 mb-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newLayoutName.trim()) {
                    saveLayoutAs(newLayoutName);
                    setNewLayoutName('');
                  }
                }}
              >
                <input
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  placeholder="Save layout as..."
                  className={`flex-1 min-w-0 text-sm rounded-lg border px-2 py-1 ${
                    isDark ? 'bg-gray-700 border-white/10 text-white' : 'bg-white border-gray-200'
                  }`}
                />
                <button
                  type="submit"
                  title="Save layout"
                  className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-700'}`}
                >
                  <Save size={14} />
                </button>
              </form>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {savedLayouts.length === 0 && (
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No saved layouts yet.
                  </p>
                )}
                {savedLayouts.map((layout) => (
                  <div key={layout.id} className="flex items-center gap-1">
                    <button
                      onClick={() => applyLayout(layout.id)}
                      className={`flex-1 min-w-0 truncate text-left text-sm px-2 py-1 rounded ${
                        isDark ? 'hover:bg-white/5 text-gray-200' : 'hover:bg-gray-50 text-gray-800'
                      }`}
                      title="Apply layout"
                    >
                      {layout.name}
                    </button>
                    <button
                      onClick={() =>
                        setDefaultLayout(defaultLayoutId === layout.id ? null : layout.id)
                      }
                      title={defaultLayoutId === layout.id ? 'Default layout' : 'Set as default'}
                      className={defaultLayoutId === layout.id ? 'text-yellow-500' : 'text-gray-400'}
                    >
                      <Star size={14} />
                    </button>
                    <button
                      onClick={() => {
                        const name = window.prompt('Rename layout', layout.name);
                        if (name) renameLayout(layout.id, name);
                      }}
                      title="Rename"
                      className="text-gray-400"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteLayout(layout.id)}
                      title="Delete"
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Order Preview */}
            {showPreview && (
              <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-4">
                <h4
                  className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}
                >
                  Current Order
                </h4>
                <div className="space-y-1">
                  {sectionOrder.map((sectionId, index) => {
                    const config = getSectionConfig(sectionId);
                    if (NON_RENDERING_SECTIONS.includes(sectionId)) return null;

                    return (
                      <div
                        key={sectionId}
                        className={`flex items-center space-x-3 p-2 rounded-md ${
                          isDark ? 'bg-white/5' : 'bg-gray-50'
                        }`}
                      >
                        <span
                          className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          {index + 1}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${config?.color ?? 'from-gray-400 to-gray-500'}`}
                        ></div>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {titleOf(sectionId)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tips */}
            <div
              className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border`}
            >
              <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                💡 <strong>Tip:</strong> Hover over any section and drag the handle (⋮⋮) to reorder, or
                use its up/down arrows. Hidden sections can be shown again from the list above.
                Changes are saved automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayoutControls;
