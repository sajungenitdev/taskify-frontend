import { AlertCircle, AlertTriangle, CheckCircle, Eye, Info, Lightbulb, Target } from "lucide-react";
import {motion} from "framer-motion"

// components/kpi/InsightsTab.tsx (or inline in the page)
function InsightsTab({
  analyticsData,
  getImpactColor,
  getPriorityColor,
  getPerformanceConfig,
  formatScore,
  onViewEmployee,
}: any) {
  if (!analyticsData) {
    return (
      <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
        <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Insights Available
        </h3>
        <p className="text-gray-500">
          Generate KPI data first to get AI-powered insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          AI-Powered Insights
        </h3>
        {analyticsData.insights.map((insight: Insight, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-xl border ${getImpactColor(insight.impact)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {insight.type === "success" && (
                  <CheckCircle size={20} className="text-emerald-500" />
                )}
                {insight.type === "warning" && (
                  <AlertTriangle size={20} className="text-amber-500" />
                )}
                {insight.type === "danger" && (
                  <AlertCircle size={20} className="text-rose-500" />
                )}
                {insight.type === "info" && (
                  <Info size={20} className="text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{insight.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {insight.description}
                </p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block ${getImpactColor(insight.impact)}`}
                >
                  {insight.impact} impact
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      {analyticsData.recommendations.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Target size={16} className="text-indigo-500" />
            Recommendations
          </h3>
          {analyticsData.recommendations.map(
            (rec: Recommendation, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Target size={20} className="text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-800">
                        {rec.title}
                      </h4>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority} priority
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getImpactColor(rec.impact)}`}
                      >
                        {rec.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {rec.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Area: {rec.area}
                    </p>
                  </div>
                </div>
              </motion.div>
            ),
          )}
        </div>
      )}

      {/* Anomalies */}
      {analyticsData.anomalies.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-500" />
            Anomaly Detection
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deviation
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analyticsData.anomalies.map((anomaly: Anomaly) => {
                  const perfConfig = getPerformanceConfig(
                    anomaly.type === "high_performer"
                      ? "excellent"
                      : "needs_improvement",
                  );
                  return (
                    <tr
                      key={anomaly.employeeId}
                      className="hover:bg-gray-50/80 transition cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {anomaly.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {anomaly.employeeName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {anomaly.department}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-bold ${anomaly.type === "high_performer" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {formatScore(anomaly.score)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatScore(anomaly.expectedScore)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span
                          className={
                            anomaly.deviation > 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }
                        >
                          {anomaly.deviation > 0 ? "+" : ""}
                          {anomaly.deviation}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}
                        >
                          {anomaly.type === "high_performer"
                            ? "🌟 High Performer"
                            : "⚠️ Needs Attention"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onViewEmployee(anomaly.employeeId)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


export default InsightsTab;