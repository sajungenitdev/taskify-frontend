import { Grid } from "lucide-react";

// ============ TYPE DEFINITIONS ============
export interface HeatMapData {
  employeeId: string;
  employeeName: string;
  department: string;
  taskCompletion: number;
  qualityScore: number;
  efficiency: number;
  collaboration: number;
  innovation: number;
  attendance: number;
  totalScore: number;
  performanceLevel: string;
  // Remove the index signature to match page.tsx
  // [key: string]: number | string;
}

interface HeatMapTabProps {
  heatMapData: HeatMapData[];
  selectedDepartment: string;
  departments: Array<{ _id: string; name: string }>;
  formatScore: (score: number) => string;
  getPerformanceConfig: (level: string) => {
    bg: string;
    border: string;
    color: string;
    emoji: string;
    label: string;
  };
  onViewEmployee: (employeeId: string) => void;
}

function HeatMapTab({
  heatMapData,
  selectedDepartment,
  departments,
  formatScore,
  getPerformanceConfig,
  onViewEmployee,
}: HeatMapTabProps) {
  if (!heatMapData || heatMapData.length === 0) {
    return (
      <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
        <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Heat Map Data
        </h3>
        <p className="text-gray-500">
          No employee data available for heat map visualization
        </p>
      </div>
    );
  }

  const components = [
    { key: "taskCompletion", label: "Task Completion", color: "#10b981" },
    { key: "qualityScore", label: "Quality Score", color: "#3b82f6" },
    { key: "efficiency", label: "Efficiency", color: "#8b5cf6" },
    { key: "collaboration", label: "Collaboration", color: "#f59e0b" },
    { key: "innovation", label: "Innovation", color: "#ec4899" },
    { key: "attendance", label: "Attendance", color: "#14b8a6" },
  ];

  const getHeatColor = (value: number) => {
    if (value >= 80) return "bg-emerald-500";
    if (value >= 60) return "bg-amber-500";
    if (value >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Performance Heat Map
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Low</span>
            <div className="flex items-center gap-0.5">
              <div className="w-4 h-3 bg-red-500 rounded" />
              <div className="w-4 h-3 bg-orange-500 rounded" />
              <div className="w-4 h-3 bg-amber-500 rounded" />
              <div className="w-4 h-3 bg-emerald-500 rounded" />
            </div>
            <span className="text-gray-400">High</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50/80">
                  Employee
                </th>
                {components.map((comp) => (
                  <th
                    key={comp.key}
                    className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="text-[10px]">{comp.label}</div>
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {heatMapData.map((employee) => {
                const perfConfig = getPerformanceConfig(
                  employee.performanceLevel,
                );
                return (
                  <tr
                    key={employee.employeeId}
                    className="hover:bg-gray-50/80 transition cursor-pointer"
                    onClick={() => onViewEmployee(employee.employeeId)}
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {employee.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {employee.employeeName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {employee.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    {components.map((comp) => {
                      // Safe value extraction using keyof
                      const value =
                        Number(employee[comp.key as keyof HeatMapData]) || 0;
                      return (
                        <td key={comp.key} className="px-4 py-3 text-center">
                          <div className="inline-block">
                            <div
                              className={`w-12 h-8 rounded ${getHeatColor(value)} flex items-center justify-center text-white text-xs font-bold`}
                              title={`${comp.label}: ${value}%`}
                            >
                              {value}%
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-gray-800">
                        {formatScore(employee.totalScore)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}
                      >
                        {perfConfig.emoji}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HeatMapTab;
