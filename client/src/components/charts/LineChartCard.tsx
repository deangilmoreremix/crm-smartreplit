import React from 'react';
import {
  LineChart,
  Line,
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

export interface LineSeriesConfig {
  key: string;
  label?: string;
  color?: string;
  yAxisId?: string;
  strokeWidth?: number;
  showDots?: boolean;
}

export interface LineChartCardProps extends Omit<ChartCardProps, 'children'> {
  data: Array<Record<string, any>>;
  series: LineSeriesConfig[];
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

export const LineChartCard: React.FC<LineChartCardProps> = ({
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
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          )}
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
            return (
              <Line
                key={s.key}
                yAxisId={s.yAxisId}
                type="monotone"
                dataKey={s.key}
                name={s.label ?? s.key}
                stroke={color}
                strokeWidth={s.strokeWidth ?? 2}
                dot={s.showDots === false ? false : { fill: color, strokeWidth: 2, r: 3 }}
                activeDot={{
                  r: 5,
                  stroke: color,
                  strokeWidth: 2,
                  fill: theme.isDark ? '#1F2937' : '#ffffff',
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default LineChartCard;
