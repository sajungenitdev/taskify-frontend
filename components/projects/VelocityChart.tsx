// components/projects/VelocityChart.tsx
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface VelocityData {
  week: string;
  weekNumber: number;
  tasksCompleted: number;
  tasksAdded: number;
  cumulativeCompleted: number;
  sprint?: string;
}

interface VelocityChartProps {
  projectId: string;
  tasks?: any[];
  sprintData?: any[];
}

export function VelocityChart({
  projectId,
  tasks = [],
  sprintData = [],
}: VelocityChartProps) {
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "weekly" | "biweekly" | "monthly"
  >("weekly");
  const [stats, setStats] = useState({
    averageVelocity: 0,
    maxVelocity: 0,
    minVelocity: 0,
    totalTasks: 0,
    totalWeeks: 0,
    trend: "stable",
  });

  useEffect(() => {
    if (tasks.length > 0 || sprintData.length > 0) {
      generateVelocityData();
    }
  }, [tasks, sprintData, selectedPeriod]);

  const generateVelocityData = () => {
    try {
      setLoading(true);

      // If sprint data is available, use it
      if (sprintData && sprintData.length > 0) {
        const sprintVelocity = sprintData.map((sprint) => ({
          week: sprint.name || `Sprint ${sprint.number}`,
          weekNumber: sprint.number || 0,
          tasksCompleted: sprint.completedTasks || 0,
          tasksAdded: sprint.addedTasks || 0,
          cumulativeCompleted: sprint.cumulativeCompleted || 0,
          sprint: sprint.name,
        }));
        setVelocityData(sprintVelocity);
        calculateStats(sprintVelocity);
        setLoading(false);
        return;
      }

      // If tasks data is available but no sprint data, group by week
      if (tasks && tasks.length > 0) {
        // Sort tasks by completion date
        const completedTasks = tasks
          .filter((task) => task.status === "completed" && task.completedAt)
          .sort(
            (a, b) =>
              new Date(a.completedAt).getTime() -
              new Date(b.completedAt).getTime(),
          );

        // Group by week
        const weeklyData = new Map();
        let cumulativeTotal = 0;

        completedTasks.forEach((task) => {
          const date = new Date(task.completedAt);
          const weekKey = getWeekKey(date);

          if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, {
              week: weekKey,
              weekNumber: weeklyData.size + 1,
              tasksCompleted: 0,
              tasksAdded: 0,
              cumulativeCompleted: 0,
            });
          }

          const data = weeklyData.get(weekKey);
          data.tasksCompleted += 1;
          cumulativeTotal += 1;
          data.cumulativeCompleted = cumulativeTotal;
        });

        // Calculate tasks added per week
        const allTasks = tasks.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        allTasks.forEach((task) => {
          const date = new Date(task.createdAt);
          const weekKey = getWeekKey(date);

          if (weeklyData.has(weekKey)) {
            const data = weeklyData.get(weekKey);
            data.tasksAdded += 1;
          }
        });

        const velocityArray = Array.from(weeklyData.values());
        setVelocityData(velocityArray);
        calculateStats(velocityArray);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error generating velocity data:", error);
      setLoading(false);
    }
  };

  const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000),
    );
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `W${weekNumber} ${year}`;
  };

  const calculateStats = (data: VelocityData[]) => {
    if (data.length === 0) {
      setStats({
        averageVelocity: 0,
        maxVelocity: 0,
        minVelocity: 0,
        totalTasks: 0,
        totalWeeks: 0,
        trend: "stable",
      });
      return;
    }

    const completed = data.map((d) => d.tasksCompleted);
    const avg = Math.round(completed.reduce((a, b) => a + b, 0) / data.length);
    const max = Math.max(...completed);
    const min = Math.min(...completed);
    const total = completed.reduce((a, b) => a + b, 0);

    // Calculate trend
    let trend = "stable";
    if (data.length >= 3) {
      const recent = data.slice(-3);
      const previous = data.slice(-6, -3);
      if (recent.length > 0 && previous.length > 0) {
        const recentAvg =
          recent.reduce((a, b) => a + b.tasksCompleted, 0) / recent.length;
        const previousAvg =
          previous.reduce((a, b) => a + b.tasksCompleted, 0) / previous.length;
        if (recentAvg > previousAvg * 1.1) trend = "up";
        else if (recentAvg < previousAvg * 0.9) trend = "down";
      }
    }

    setStats({
      averageVelocity: avg,
      maxVelocity: max,
      minVelocity: min,
      totalTasks: total,
      totalWeeks: data.length,
      trend,
    });
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case "up":
        return "text-emerald-600 bg-emerald-50";
      case "down":
        return "text-rose-600 bg-rose-50";
      default:
        return "text-amber-600 bg-amber-50";
    }
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case "up":
        return <TrendingUp className="w-4 h-4" />;
      case "down":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
          <p className="text-sm text-gray-500">Loading velocity data...</p>
        </div>
      </div>
    );
  }

  if (velocityData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-700 font-medium">No Velocity Data</h3>
          <p className="text-sm text-gray-400 mt-1">
            Complete tasks to see velocity metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200/50">
          <p className="text-xs text-gray-500 font-medium">Avg Velocity</p>
          <p className="text-2xl font-bold text-indigo-700">
            {stats.averageVelocity}
          </p>
          <p className="text-xs text-gray-400">tasks/week</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
          <p className="text-xs text-gray-500 font-medium">Peak Velocity</p>
          <p className="text-2xl font-bold text-emerald-700">
            {stats.maxVelocity}
          </p>
          <p className="text-xs text-gray-400">tasks/week</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
          <p className="text-xs text-gray-500 font-medium">Total Completed</p>
          <p className="text-2xl font-bold text-amber-700">
            {stats.totalTasks}
          </p>
          <p className="text-xs text-gray-400">over {stats.totalWeeks} weeks</p>
        </div>
        <div
          className={`bg-gradient-to-br rounded-xl p-4 border ${getTrendColor()}`}
        >
          <p className="text-xs text-gray-500 font-medium">Trend</p>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <p className="text-lg font-bold capitalize">{stats.trend}</p>
          </div>
          <p className="text-xs text-gray-400">last 3 weeks</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                Velocity Chart
              </h3>
              <p className="text-xs text-gray-400">Tasks completed per week</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedPeriod("weekly")}
              className={`px-2 py-1 text-xs rounded-md transition ${
                selectedPeriod === "weekly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod("biweekly")}
              className={`px-2 py-1 text-xs rounded-md transition ${
                selectedPeriod === "biweekly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Bi-weekly
            </button>
            <button
              onClick={() => setSelectedPeriod("monthly")}
              className={`px-2 py-1 text-xs rounded-md transition ${
                selectedPeriod === "monthly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                interval={Math.max(0, Math.floor(velocityData.length / 10))}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10 }}
                domain={[0, "auto"]}
                label={{
                  value: "Tasks",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 10 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
                domain={[0, "auto"]}
                label={{
                  value: "Cumulative",
                  angle: 90,
                  position: "insideRight",
                  style: { fontSize: 10 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                formatter={(value: any, name: string) => {
                  const labels: Record<string, string> = {
                    tasksCompleted: "Tasks Completed",
                    tasksAdded: "Tasks Added",
                    cumulativeCompleted: "Cumulative Total",
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cumulativeCompleted"
                name="Cumulative Total"
                stroke="#6366f1"
                fill="#818cf8"
                fillOpacity={0.1}
              />
              <Bar
                yAxisId="left"
                dataKey="tasksCompleted"
                name="Tasks Completed"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tasksCompleted"
                name="Completed Trend"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tasksAdded"
                name="Tasks Added"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Velocity Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl p-4 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-xs text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-600">Added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-600">Cumulative</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {velocityData.length} weeks
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              {stats.totalTasks} total completed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
