"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface TaskStatusChartProps {
  data?: {
    status: string;
    count: number;
    color: string;
  }[];
}

// Move CustomTooltip OUTSIDE of the component
const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const percentage = ((payload[0].value / total) * 100).toFixed(1);
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-white text-sm font-medium">{payload[0].name}</p>
        <p className="text-slate-400 text-xs mt-1">
          Count: <span className="text-white font-semibold">{payload[0].value}</span>
        </p>
        <p className="text-slate-400 text-xs">
          Percentage:{" "}
          <span className="text-white font-semibold">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function TaskStatusChart({ data = [] }: TaskStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const hasData = data.some(item => item.count > 0);

  if (!hasData) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Task Distribution</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Tasks by current status
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-slate-400">Total Tasks</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No task data available</p>
            <p className="text-slate-500 text-xs mt-1">Create tasks to see distribution</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Task Distribution</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Tasks by current status
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-slate-400">Total Tasks</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="status"
              label={({ name, percent }) => {
                if (percent === undefined) return name;
                return `${name} ${(percent * 100).toFixed(0)}%`;
              }}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={total} />} />
            <Legend
              formatter={(value) => (
                <span className="text-slate-300 text-xs">{value}</span>
              )}
              wrapperStyle={{ paddingTop: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}