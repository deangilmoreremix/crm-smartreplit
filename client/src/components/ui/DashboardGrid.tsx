import React from 'react';
import { cn } from '@/lib/utils';

interface GridBreakpoints {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}

interface DashboardGridProps {
  columns?: GridBreakpoints | number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  adaptive?: boolean;
  className?: string;
}

const gapSizes = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
};

const getGridColClasses = (columns: GridBreakpoints | number) => {
  if (typeof columns === 'number') {
    return `grid-cols-${Math.min(columns, 12)}`;
  }

  const classes = [];
  if (columns.sm) classes.push(`grid-cols-${Math.min(columns.sm, 12)}`);
  if (columns.md) classes.push(`md:grid-cols-${Math.min(columns.md, 12)}`);
  if (columns.lg) classes.push(`lg:grid-cols-${Math.min(columns.lg, 12)}`);
  if (columns.xl) classes.push(`xl:grid-cols-${Math.min(columns.xl, 12)}`);
  if (columns['2xl']) classes.push(`2xl:grid-cols-${Math.min(columns['2xl'], 12)}`);

  return classes.join(' ');
};

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'lg',
  children,
  adaptive = true,
  className
}) => {
  const gridClasses = typeof columns === 'object' 
    ? getGridColClasses(columns)
    : `grid-cols-${Math.min(columns, 12)}`;

  return (
    <div className={cn(
      'grid',
      gridClasses,
      gapSizes[gap],
      adaptive && 'auto-rows-fr', // Equal height rows when adaptive
      className
    )}>
      {children}
    </div>
  );
};

// Grid Item component for special positioning
interface DashboardGridItemProps {
  children: React.ReactNode;
  colSpan?: GridBreakpoints | number;
  rowSpan?: number;
  className?: string;
}

export const DashboardGridItem: React.FC<DashboardGridItemProps> = ({
  children,
  colSpan = 1,
  rowSpan,
  className
}) => {
  const getColSpanClasses = (span: GridBreakpoints | number) => {
    if (typeof span === 'number') {
      return `col-span-${Math.min(span, 12)}`;
    }

    const classes = [];
    if (span.sm) classes.push(`col-span-${Math.min(span.sm, 12)}`);
    if (span.md) classes.push(`md:col-span-${Math.min(span.md, 12)}`);
    if (span.lg) classes.push(`lg:col-span-${Math.min(span.lg, 12)}`);
    if (span.xl) classes.push(`xl:col-span-${Math.min(span.xl, 12)}`);
    if (span['2xl']) classes.push(`2xl:col-span-${Math.min(span['2xl'], 12)}`);

    return classes.join(' ');
  };

  const colSpanClasses = typeof colSpan === 'object' 
    ? getColSpanClasses(colSpan)
    : `col-span-${Math.min(colSpan as number, 12)}`;

  const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';

  return (
    <div className={cn(colSpanClasses, rowSpanClass, className)}>
      {children}
    </div>
  );
};

export default DashboardGrid;