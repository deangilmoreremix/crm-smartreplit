import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard, ChartCardProps } from './ChartCard';
import { useChartTheme, DEFAULT_SERIES_COLORS } from './useChartTheme';
import { cn } from '../../lib/utils';

export interface BarSeriesConfig {
  key: string;
  label?: string;
  color?: string;
  stackId?: string;
  radius?: [number, number, number, number];
}

export interface BarChartCardProps extends Omit<ChartCardProps, 'children'> {
  data: Array<Record<string, any>>;
  series: BarSeriesConfig[];
  xKey: string;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  layout?: 'horizontal' | 'vertical';
  xAxisFormatter?: (value: any, index: number) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  className?: string;
}

export const BarChartCard: React.FC<BarChartCardProps> = ({
  data,
  series,
  xKey,
  height = 320,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  layout = 'horizontal',
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  className,
  ...cardProps
}) => {
  const theme = useChartTheme();
  const isVertical = layout === 'vertical';

  return (
    <ChartCard {...cardProps} className={cn(className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={layout} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />}
          {isVertical ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: theme.axis }}
                axisLine={{ stroke: theme.axisLine }}
                tickLine={{ stroke: theme.axisLine }}
                tickFormatter={yAxisFormatter}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fontSize: 12, fill: theme.axis }}
                axisLine={{ stroke: theme.axisLine }}
                tickLine={{ stroke: theme.axisLine }}
                width={isVertical ? 120 : undefined}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12, fill: theme.axis }}
                axisLine={{ stroke: theme.axisLine }}
                tickLine={{ stroke: theme.axisLine }}
                tickFormatter={xAxisFormatter}
              />
              <YAxis
                tick={{ fontSize: 12, fill: theme.axis }}
                axisLine={{ stroke: theme.axisLine }}
                tickLine={{ stroke: theme.axisLine }}
                tickFormatter={yAxisFormatter}
              />
            </>
          )}
          {showTooltip && (
            <Tooltip
              formatter={tooltipFormatter}
              cursor={{ fill: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
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
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length];
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label ?? s.key}
                fill={color}
                stackId={s.stackId}
                radius={s.radius ?? [4, 4, 0, 0]}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default BarChartCard;
