// components/kpi/PredictionsTab.tsx
"use client";

import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Prediction {
  month: string;
  predictedScore: number;
  confidence: "low" | "medium" | "high";
  trend: "up" | "down" | "stable";
}

interface PredictionsTabProps {
  analyticsData: {
    predictions: Prediction[];
  };
  getTrendIcon: (trend: string) => React.ReactNode;
  getConfidenceColor: (confidence: string) => string;
  formatScore: (score: number) => string;
  selectedDepartment: string;
}

export default function PredictionsTab({
  analyticsData,
  getTrendIcon,
  getConfidenceColor,
  formatScore,
  selectedDepartment,
}: PredictionsTabProps) {
  if (
    !analyticsData ||
    !analyticsData.predictions ||
    analyticsData.predictions.length === 0
  ) {
    return (
      <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Predictions Available
        </h3>
        <p className="text-gray-500">
          Need more historical data to generate predictions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prediction Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" />
            Performance Predictions
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span className="text-gray-600">Predicted</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-indigo-200 rounded-full border border-indigo-300" />
              <span className="text-gray-600">Confidence Range</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={analyticsData.predictions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "12px",
                }}
                formatter={(value: any) => `${value}%`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="predictedScore"
                name="Predicted Score"
                stroke="#6366f1"
                fill="#818cf8"
                fillOpacity={0.2}
              />
              <Line
                type="monotone"
                dataKey="predictedScore"
                name="Predicted Score"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {analyticsData.predictions.map((pred: Prediction, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="text-center">
              <p className="text-xs text-gray-500">{pred.month}</p>
              <p className="text-2xl font-bold text-indigo-600">
                {pred.predictedScore}%
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(pred.trend)}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${getConfidenceColor(pred.confidence)}`}
                >
                  {pred.confidence}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl p-4 border border-indigo-200 text-center text-sm">
        <p className="text-gray-600">
          Based on historical data, the predicted performance trend is{" "}
          <span className="font-semibold text-indigo-600">
            {analyticsData.predictions[analyticsData.predictions.length - 1]
              ?.trend === "up"
              ? "improving"
              : analyticsData.predictions[analyticsData.predictions.length - 1]
                    ?.trend === "down"
                ? "declining"
                : "stable"}
          </span>{" "}
          with a confidence level of{" "}
          <span className="font-semibold text-indigo-600">
            {
              analyticsData.predictions[analyticsData.predictions.length - 1]
                ?.confidence
            }
          </span>
        </p>
      </div>
    </div>
  );
}
