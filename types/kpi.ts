// types/kpi.ts or at the top of the file
interface KPIUser {
  _id: string;
  fullName: string;
  email: string;
  employeeId?: string;
  role?: string;
}

interface KPIDepartment {
  _id: string;
  name: string;
  code?: string;
}

interface KPIScoreItem {
  _id: string;
  userId: KPIUser;
  departmentId: KPIDepartment;
  month?: string;
  year?: number;
  totalScore: number;
  performanceLevel: "excellent" | "good" | "average" | "needs_improvement";
  percentile?: number;
  rank?: number;
  totalEmployees?: number;
  scores?: {
    taskCompletion: { score: number; weight: number; weightedScore: number };
    qualityScore: { score: number; weight: number; weightedScore: number };
    efficiency: { score: number; weight: number; weightedScore: number };
    collaboration: { score: number; weight: number; weightedScore: number };
    innovation: { score: number; weight: number; weightedScore: number };
    attendance: { score: number; weight: number; weightedScore: number };
  };
  calculatedAt?: string;
}

interface KPIData {
  allScores: KPIScoreItem[];
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
  total?: number;
  month?: string;
  year?: number;
}