"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Props = {
  data: {
    name: string;
    value: number;
    forecast: number;
  }[];
};

export function RevenueChart({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-glass-border)" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            tickFormatter={(value) => 
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(value)
            }
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-surface-1)', borderColor: 'var(--color-glass-border)', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="var(--color-info)" 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            name="Actual MRR"
          />
          <Area 
            type="monotone" 
            dataKey="forecast" 
            stroke="var(--color-brand)" 
            fillOpacity={1} 
            fill="url(#colorForecast)" 
            name="Forecasted MRR"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
