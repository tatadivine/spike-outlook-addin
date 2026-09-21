"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export interface TrendPoint {
  label: string;
  value: number;
}

export function TrendChart({ data, height = 220, color = "#2f6bff" }: { data: TrendPoint[]; height?: number; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8892a0" }} axisLine={{ stroke: "#e3e7ee" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#8892a0" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e3e7ee", fontSize: 12 }} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#trend-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
