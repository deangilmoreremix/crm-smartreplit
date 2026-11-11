import React from 'react';

interface SampleBadgeProps {
  /** Text shown in the badge; defaults to "Sample". */
  label?: string;
  className?: string;
}

/** Marks sample (demo) content so it is never mistaken for real data. */
const SampleBadge: React.FC<SampleBadgeProps> = ({ label = 'Sample', className = '' }) => (
  <span
    data-testid="sample-badge"
    className={`inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ${className}`}
  >
    {label}
  </span>
);

export default SampleBadge;
