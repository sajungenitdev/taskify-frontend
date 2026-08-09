import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  Info,
  Lightbulb,
  Target,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

// ============ TYPE DEFINITIONS ============
export interface Insight {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

export interface Recommendation {
  area: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
}

export interface Anomaly {
  employeeId: string;
  employeeName: string;
  department: string;
  score: number;
  expectedScore: number;
  deviation: number;
  type: "high_performer" | "low_performer";
  severity: "critical" | "high" | "medium" | "low";
}

export interface AnalyticsData {
  insights: Insight[];
  recommendations: Recommendation[];
  anomalies: Anomaly[];
  summary?: {
    totalEmployees: number;
    averageScore: number;
    maxScore?: number;
    minScore?: number;
    stdDev?: number;
    distribution?: {
      excellent: number;
      good: number;
      average: number;
      needs_improvement: number;
    };
  };
  departmentStats?: any[];
  _debug?: any;
}

interface InsightsTabProps {
  analyticsData: AnalyticsData | null;
  getImpactColor: (impact: string) => string;
  getPriorityColor: (priority: string) => string;
  getPerformanceConfig: (level: string) => {
    color: string;
    bg: string;
    border: string;
    icon: any;
    label: string;
    emoji: string;
  };
  formatScore: (score: number) => string;
  onViewEmployee: (userId: string) => void;
  onRefresh?: () => void;
  onGenerateSample?: () => void;
  isLoading?: boolean;
}

// ============ SAMPLE DATA GENERATOR ============
const generateSampleInsights = (): Insight[] => {
  return [
    {
      type: "info",
      title: "Sample Data Mode",
      description: "You are viewing sample data. Generate real KPI data by calculating scores for your employees.",
      impact: "medium"
    },
    {
      type: "success",
      title: "KPI System Ready",
      description: "Your KPI system is configured and ready to analyze employee performance data.",
      impact: "high"
    },
    {
      type: "warning",
      title: "Data Needed",
      description: "Start calculating KPI scores to get AI-powered insights and recommendations.",
      impact: "medium"
    }
  ];
};

const generateSampleRecommendations = (): Recommendation[] => {
  return [
    {
      area: "Getting Started",
      title: "Calculate KPI Scores",
      description: "Navigate to the KPI Management page to calculate scores for your employees.",
      priority: "high",
      impact: "high"
    },
    {
      area: "Data Collection",
      title: "Complete Employee Profiles",
      description: "Ensure all employee profiles are complete with department assignments for accurate KPI tracking.",
      priority: "medium",
      impact: "medium"
    }
  ];
};

const generateSampleAnomalies = (): Anomaly[] => {
  return [
    {
      employeeId: "sample-1",
      employeeName: "John Doe",
      department: "Engineering",
      score: 92,
      expectedScore: 75,
      deviation: 22.7,
      type: "high_performer",
      severity: "high"
    },
    {
      employeeId: "sample-2",
      employeeName: "Jane Smith",
      department: "Marketing",
      score: 45,
      expectedScore: 70,
      deviation: -35.7,
      type: "low_performer",
      severity: "critical"
    }
  ];
};

// ============ INSIGHTS TAB COMPONENT ============
function InsightsTab({
  analyticsData,
  getImpactColor,
  getPriorityColor,
  getPerformanceConfig,
  formatScore,
  onViewEmployee,
  onRefresh,
  onGenerateSample,
  isLoading = false,
}: InsightsTabProps) {
  // Check if we're in sample data mode
  const isSampleData = analyticsData?._debug?.isSampleData || false;
  
  // Safely check if we have actual data
  const insights = analyticsData?.insights || [];
  const recommendations = analyticsData?.recommendations || [];
  const anomalies = analyticsData?.anomalies || [];

  const hasInsights = insights.length > 0;
  const hasRecommendations = recommendations.length > 0;
  const hasAnomalies = anomalies.length > 0;
  const hasAnyData = hasInsights || hasRecommendations || hasAnomalies;

  // Check if summary has any data
  const hasSummaryData = analyticsData?.summary &&
    (analyticsData.summary.totalEmployees > 0 || analyticsData.summary.averageScore > 0);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading insights...
          </p>
        </div>
      </div>
    );
  }

  // If no data at all, show empty state with refresh and generate options
  if (!analyticsData || !hasAnyData) {
    return (
      <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Insights Available
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          No KPI data found for the selected period. 
          {analyticsData?._debug?.message || " Please calculate KPI scores first or generate sample data."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
            >
              <RefreshCw size={16} />
              Refresh Data
            </button>
          )}
          {onGenerateSample && (
            <button
              onClick={onGenerateSample}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
            >
              <Sparkles size={16} />
              Generate Sample Data
            </button>
          )}
        </div>
        {analyticsData?._debug?.query && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left max-w-md mx-auto">
            <p className="text-xs text-gray-500 font-mono">
              Query: {JSON.stringify(analyticsData._debug.query, null, 2)}
            </p>
          </div>
        )}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle size={14} className="text-emerald-400" />
            Insights
          </span>
          <span className="flex items-center gap-1">
            <Target size={14} className="text-indigo-400" />
            Recommendations
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle size={14} className="text-rose-400" />
            Anomalies
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sample Data Banner */}
      {isSampleData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3"
        >
          <Sparkles size={18} className="text-amber-600" />
          <p className="text-sm text-amber-700">
            <span className="font-medium">Sample Data Mode:</span> You're viewing sample insights. 
            Calculate real KPI scores to see actual data.
          </p>
          {onGenerateSample && (
            <button
              onClick={onGenerateSample}
              className="ml-auto text-xs px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
            >
              Regenerate
            </button>
          )}
        </motion.div>
      )}

      {/* Summary Banner - Show if we have summary data */}
      {hasSummaryData && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-200"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {analyticsData.summary?.totalEmployees || 0}
            </p>
            <p className="text-xs text-gray-500">Total Employees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {analyticsData.summary?.averageScore || 0}%
            </p>
            <p className="text-xs text-gray-500">Average Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {analyticsData.summary?.distribution?.excellent || 0}
            </p>
            <p className="text-xs text-gray-500">Excellent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">
              {analyticsData.summary?.distribution?.needs_improvement || 0}
            </p>
            <p className="text-xs text-gray-500">Needs Improvement</p>
          </div>
        </motion.div>
      )}

      {/* Insights Section */}
      {hasInsights && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              AI-Powered Insights
              <span className="text-xs text-gray-400 font-normal ml-2">
                ({insights.length} insight{insights.length > 1 ? 's' : ''} found)
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {insights.map((insight: Insight, index: number) => (
              <motion.div
                key={`insight-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border ${getImpactColor(insight.impact)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
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
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getImpactColor(insight.impact)}`}
                      >
                        {insight.impact} impact
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        {insight.type}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {hasRecommendations && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Target size={16} className="text-indigo-500" />
              Recommendations
              <span className="text-xs text-gray-400 font-normal ml-2">
                ({recommendations.length} recommendation{recommendations.length > 1 ? 's' : ''})
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recommendations.map(
              (rec: Recommendation, index: number) => (
                <motion.div
                  key={`rec-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Target size={20} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
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
                      <div className="flex items-center gap-2 mt-2">
                        <Building2 size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Area: {rec.area}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Anomalies Section */}
      {hasAnomalies && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500" />
              Anomaly Detection
              <span className="text-xs text-gray-400 font-normal ml-2">
                ({anomalies.length} anomal{anomalies.length > 1 ? 'ies' : 'y'} detected)
              </span>
            </h3>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
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
                      Status
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {anomalies.map((anomaly: Anomaly) => {
                    const perfConfig = getPerformanceConfig(
                      anomaly.type === "high_performer"
                        ? "excellent"
                        : "needs_improvement",
                    );
                    const isHighPerformer = anomaly.type === "high_performer";

                    return (
                      <motion.tr
                        key={anomaly.employeeId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50/80 transition cursor-pointer"
                        onClick={() => onViewEmployee(anomaly.employeeId)}
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
                          <span className="flex items-center gap-1">
                            <Building2 size={12} className="text-gray-400" />
                            {anomaly.department}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-bold ${
                              isHighPerformer ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {formatScore(anomaly.score)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatScore(anomaly.expectedScore)}%
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-medium ${
                              anomaly.deviation > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {anomaly.deviation > 0 ? "+" : ""}
                            {anomaly.deviation}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}
                          >
                            {isHighPerformer ? (
                              <span className="flex items-center gap-1">
                                <TrendingUp size={12} />
                                High Performer
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <TrendingDown size={12} />
                                Needs Attention
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewEmployee(anomaly.employeeId);
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View employee details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
        <span className="flex items-center justify-center gap-1">
          <Lightbulb size={12} />
          {isSampleData ? "Sample data for demonstration" : "AI-generated insights based on KPI data analysis"}
        </span>
      </div>
    </div>
  );
}

export default InsightsTab;