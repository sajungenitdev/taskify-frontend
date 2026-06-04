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
  data: {
    status: string;
    count: number;
    color: string;
  }[];
}

export default function TaskStatusChart({ data }: TaskStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

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
              label={({ name, percent }) => {
                if (percent === undefined) return name;
                return `${name} ${(percent * 100).toFixed(0)}%`;
              }}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-slate-300 text-xs">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
