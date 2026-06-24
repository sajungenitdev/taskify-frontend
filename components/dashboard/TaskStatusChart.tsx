"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useMemo } from "react";

interface TaskStatusChartProps {
  data?: {
    status: string;
    count: number;
    color: string;
  }[];
}

// Memoized CustomTooltip
const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const percentage =
      total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : "0.0";
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xl">
        <p className="text-gray-800 text-sm font-medium">{payload[0].name}</p>
        <p className="text-gray-600 text-xs mt-1">
          Count:{" "}
          <span className="text-gray-900 font-semibold">
            {payload[0].value}
          </span>
        </p>
        <p className="text-gray-600 text-xs">
          Percentage:{" "}
          <span className="text-gray-900 font-semibold">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function TaskStatusChart({ data = [] }: TaskStatusChartProps) {
  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.count, 0),
    [data],
  );
  const hasData = useMemo(() => data.some((item) => item.count > 0), [data]);

  // Sort data for better visualization
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.count - a.count),
    [data],
  );

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-800 font-semibold">Task Distribution</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Tasks by current status
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">0</p>
            <p className="text-xs text-gray-500">Total Tasks</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No task data available</p>
            <p className="text-gray-400 text-xs mt-1">
              Create tasks to see distribution
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-800 font-semibold">Task Distribution</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Tasks by current status
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-500">Total Tasks</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="status"
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
                name,
              }) => {
                // Handle undefined values
                if (midAngle === undefined || percent === undefined)
                  return null;

                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontSize: "10px",
                      fill: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    {`${name} ${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
              labelLine={false}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={total} />} />
            <Legend
              formatter={(value) => (
                <span className="text-gray-700 text-xs font-medium">
                  {value}
                </span>
              )}
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
              }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
