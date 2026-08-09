// components/kpi/ComparisonsTab.tsx
"use client";

import { Building2 } from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

interface DepartmentComparison {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalEmployees: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  components: {
    taskCompletion: number;
    qualityScore: number;
    efficiency: number;
    collaboration: number;
    innovation: number;
    attendance: number;
  };
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
}

interface ComparisonsTabProps {
  departmentComparisons: DepartmentComparison[];
  selectedDepartment: string;
  formatScore: (score: number) => string;
  getPerformanceConfig: (level: string) => any;
  COLORS: string[];
}

export default function ComparisonsTab({
  departmentComparisons,
  selectedDepartment,
  formatScore,
  getPerformanceConfig,
  COLORS,
}: ComparisonsTabProps) {
  if (!departmentComparisons || departmentComparisons.length === 0) {
    return (
      <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Department Data
        </h3>
        <p className="text-gray-500">No department comparison data available</p>
      </div>
    );
  }

  const sortedDepts = [...departmentComparisons].sort(
    (a, b) => b.averageScore - a.averageScore,
  );

  return (
    <div className="space-y-6">
      {/* Department Score Comparison Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Department Score Comparison
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedDepts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="departmentName"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
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
              <Bar
                dataKey="averageScore"
                name="Average Score"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedDepts.map((dept) => {
          const isSelected = dept.departmentId === selectedDepartment;
          return (
            <motion.div
              key={dept.departmentId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl p-5 border ${
                isSelected
                  ? "border-indigo-400 ring-2 ring-indigo-200"
                  : "border-gray-200"
              } shadow-sm hover:shadow-md transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">
                  {dept.departmentName}
                </h4>
                <span className="text-xs text-gray-400">
                  {dept.departmentCode}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-indigo-600">
                  {dept.averageScore}%
                </span>
                <span className="text-xs text-gray-400">
                  {dept.totalEmployees} employees
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                <div
                  className="h-1.5 rounded-full bg-linear-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${dept.averageScore}%` }}
                />
              </div>

              {/* Component Scores */}
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div>
                  <p className="text-gray-400">Task</p>
                  <p className="font-medium text-gray-700">
                    {dept.components.taskCompletion}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Quality</p>
                  <p className="font-medium text-gray-700">
                    {dept.components.qualityScore}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Efficiency</p>
                  <p className="font-medium text-gray-700">
                    {dept.components.efficiency}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Collaboration</p>
                  <p className="font-medium text-gray-700">
                    {dept.components.collaboration}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Innovation</p>
                  <p className="font-medium text-gray-700">
                    {dept.components.innovation}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Attendance</p>
                  <p className="font-medium text-gray-700">
                    {dept.components.attendance}%
                  </p>
                </div>
              </div>

              {/* Performance Distribution */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width:
                          dept.totalEmployees > 0
                            ? `${(dept.distribution.excellent / dept.totalEmployees) * 100}%`
                            : "0%",
                      }}
                    />
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width:
                          dept.totalEmployees > 0
                            ? `${(dept.distribution.good / dept.totalEmployees) * 100}%`
                            : "0%",
                      }}
                    />
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width:
                          dept.totalEmployees > 0
                            ? `${(dept.distribution.average / dept.totalEmployees) * 100}%`
                            : "0%",
                      }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width:
                          dept.totalEmployees > 0
                            ? `${(dept.distribution.needs_improvement / dept.totalEmployees) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                  <span>E:{dept.distribution.excellent}</span>
                  <span>G:{dept.distribution.good}</span>
                  <span>A:{dept.distribution.average}</span>
                  <span>N:{dept.distribution.needs_improvement}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
