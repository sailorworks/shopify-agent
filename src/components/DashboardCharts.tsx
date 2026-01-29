"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// --- Revenue Trend Chart ---
interface RevenueTrendProps {
  data: { month: string; value: number }[];
}

export function RevenueTrendChart({ data }: RevenueTrendProps) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#666" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#666" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#000', 
              borderColor: '#333', 
              color: '#fff',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#16a34a' }}
            cursor={{ stroke: '#333' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#16a34a" /* Matrix Green */
            strokeWidth={2}
            dot={{ r: 4, fill: '#000', stroke: '#16a34a', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#16a34a' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Traffic Source Chart ---
interface TrafficSourceProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac']; // Green gradients

export function TrafficSourceChart({ data }: TrafficSourceProps) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ 
              backgroundColor: '#000', 
              borderColor: '#333', 
              color: '#fff',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span style={{ color: '#999', fontSize: '12px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
