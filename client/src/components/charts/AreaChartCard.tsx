import React from 'react';
import {
  AreaChart,
  Area,
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

export interface AreaSeriesConfig {
  key: string;
  label?: string;
  color?: string;
  stacked?: boolean;
  gradientId?: string;
}

export interface AreaChartCardProps extends Omit<ChartCardProps, 'children'> {
  data: Array<Record<string, any>>;
  series: AreaSeriesConfig[];
  xKey: string;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  xAxisFormatter?: (value: any, index: number) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  className?: string;
}

export const AreaChartCard: React.FC<AreaChartCardProps> = ({
  data,
  series,
  xKey,
  height = 320,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  className,
  ...cardProps
}) => {
  const theme = useChartTheme();

  return (
    <ChartCard {...cardProps} className={cn(className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            {series.map((s, i) => {
              const color = s.color ?? DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length];
              const gid = s.gradientId ?? `areaFill-${s.key}-${i}`;
              return (
                <linearGradient key={gid} id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />}
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
          {showTooltip && (
            <Tooltip
              formatter={tooltipFormatter}
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
            const gid = s.gradientId ?? `areaFill-${s.key}-${i}`;
            return (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label ?? s.key}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gid})`}
                stackId={s.stacked ? 'stack' : undefined}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default AreaChartCard;
