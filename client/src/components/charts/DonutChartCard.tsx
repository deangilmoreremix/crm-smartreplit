import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartCard, ChartCardProps } from './ChartCard';
import { useChartTheme, DEFAULT_SERIES_COLORS } from './useChartTheme';
import { cn } from '../../lib/utils';

export interface DonutDatum {
  name: string;
  value: number;
  color?: string;
}

export interface DonutChartCardProps extends Omit<ChartCardProps, 'children'> {
  data: DonutDatum[];
  dataKey?: string;
  height?: number | string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  colors?: string[];
  centerLabel?: React.ReactNode;
  valueFormatter?: (value: number) => string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  className?: string;
}

export const DonutChartCard: React.FC<DonutChartCardProps> = ({
  data,
  dataKey = 'value',
  height = 320,
  innerRadius = '55%',
  outerRadius = '80%',
  showLegend = true,
  showTooltip = true,
  showLabels = false,
  colors = DEFAULT_SERIES_COLORS,
  centerLabel,
  valueFormatter,
  tooltipFormatter,
  className,
  ...cardProps
}) => {
  const theme = useChartTheme();
  const total = data.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <ChartCard {...cardProps} className={cn(className)}>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              labelLine={showLabels}
              label={
                showLabels
                  ? ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  : undefined
              }
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color ?? colors[i % colors.length]} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                formatter={
                  tooltipFormatter ??
                  ((value: any, name: string) => [
                    valueFormatter ? valueFormatter(value) : `${value}`,
                    name,
                  ])
                }
                contentStyle={{
                  backgroundColor: theme.tooltipBg,
                  border: `1px solid ${theme.tooltipBorder}`,
                  borderRadius: '8px',
                  color: theme.tooltipText,
                }}
                labelStyle={{ color: theme.tooltipLabel }}
                itemStyle={{ color: theme.tooltipText }}
              />
            )}
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span style={{ color: theme.axis }}>{value}</span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        {centerLabel !== undefined && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel}
          </div>
        )}
      </div>
    </ChartCard>
  );
};

export default DonutChartCard;
