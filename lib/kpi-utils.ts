// // lib/kpi-utils.ts

// interface ApiTask {
//   _id: string;
//   title: string;
//   status: string;
//   priority: string;
//   deadline?: string;
//   assignedTo?: string | { _id: string } | null;
//   createdAt: string;
//   actualMinutes?: number;
// }

// interface UserData {
//   _id: string;
//   fullName: string;
//   email: string;
//   employeeId: string;
//   role: string;
//   departmentId?: any;
//   department?: string;
//   position?: string;
// }

// interface ScoreComponent {
//   score: number;
//   weight: number;
//   weightedScore: number;
// }

// export interface EmployeeKPI {
//   _id: string;
//   userId: UserData;
//   month: string;
//   year: number;
//   totalScore: number;
//   performanceLevel: "excellent" | "good" | "average" | "needs_improvement";
//   percentile: number;
//   rank: number;
//   totalEmployees: number;
//   scores: {
//     taskCompletion: ScoreComponent;
//     qualityScore: ScoreComponent;
//     efficiency: ScoreComponent;
//     collaboration: ScoreComponent;
//     innovation: ScoreComponent;
//     attendance: ScoreComponent;
//   };
//   comments: string;
//   calculatedAt: string;
// }

// const WEIGHTS = {
//   taskCompletion: 0.25,
//   qualityScore: 0.20,
//   efficiency: 0.20,
//   collaboration: 0.15,
//   innovation: 0.10,
//   attendance: 0.10,
// };

// /**
//  * SINGLE SOURCE OF TRUTH - KPI Calculation
//  * High-performance single-pass implementation
//  */
// export function calculateKPIFromTasks(
//   tasks: ApiTask[],
//   userData: UserData,
//   selectedMonth: string,
//   selectedYear: number,
//   allUsers: UserData[] = []
// ): EmployeeKPI {
//   const totalTasks = tasks.length;
//   const now = Date.now();

//   // If no tasks, return 0 score early
//   if (totalTasks === 0) {
//     return {
//       _id: `calculated_${userData._id}_${selectedMonth}_${selectedYear}`,
//       userId: userData,
//       month: selectedMonth,
//       year: selectedYear,
//       totalScore: 0,
//       performanceLevel: "needs_improvement",
//       percentile: 0,
//       rank: allUsers.length || 1,
//       totalEmployees: allUsers.length || 1,
//       scores: {
//         taskCompletion: { score: 0, weight: 25, weightedScore: 0 },
//         qualityScore: { score: 0, weight: 20, weightedScore: 0 },
//         efficiency: { score: 0, weight: 20, weightedScore: 0 },
//         collaboration: { score: 0, weight: 15, weightedScore: 0 },
//         innovation: { score: 0, weight: 10, weightedScore: 0 },
//         attendance: { score: 0, weight: 10, weightedScore: 0 },
//       },
//       comments: `${userData.fullName} has no tasks assigned for ${selectedMonth} ${selectedYear}.`,
//       calculatedAt: new Date().toISOString(),
//     };
//   }

//   // Single O(N) pass for all metrics
//   let completedTasks = 0;
//   let inProgressTasks = 0;
//   let submittedTasks = 0;
//   let overdueTasks = 0;
//   let rejectedTasks = 0;

//   for (let i = 0; i < totalTasks; i++) {
//     const t = tasks[i];
//     const status = t.status;
//     const isCompleted = status === "completed";

//     if (isCompleted) {
//       completedTasks++;
//     } else if (status === "in_progress") {
//       inProgressTasks++;
//     } else if (status === "submitted") {
//       submittedTasks++;
//     } else if (status === "rejected") {
//       rejectedTasks++;
//     }

//     if (
//       status === "overdue" ||
//       (!isCompleted && t.deadline && new Date(t.deadline).getTime() < now)
//     ) {
//       overdueTasks++;
//     }
//   }

//   // 1. TASK COMPLETION (25%)
//   const effectiveCompleted = completedTasks + inProgressTasks * 0.5 + submittedTasks * 0.8;
//   const taskCompletion = Math.min(100, Math.round((effectiveCompleted / totalTasks) * 100));

//   // 2. QUALITY SCORE (20%)
//   let qualityScore = 0;
//   if (completedTasks > 0) {
//     const qualityTasks = completedTasks - overdueTasks - rejectedTasks;
//     qualityScore = Math.min(100, Math.max(0, Math.round((qualityTasks / totalTasks) * 100)));
//   } else if (inProgressTasks + submittedTasks > 0) {
//     const activeTasks = inProgressTasks + submittedTasks;
//     qualityScore = Math.min(70, Math.round(30 + (activeTasks / totalTasks) * 40));
//   } else {
//     qualityScore = 20;
//   }

//   // 3. EFFICIENCY (20%)
//   const progress = effectiveCompleted / totalTasks;
//   const efficiency = Math.min(100, Math.round(Math.max(15, progress * 100)));

//   // 4. COLLABORATION (15%)
//   const engagementRatio = (completedTasks + inProgressTasks + submittedTasks) / totalTasks;
//   const collaboration = Math.min(100, Math.round(30 + engagementRatio * 70));

//   // 5. INNOVATION (10%)
//   const innovation = Math.min(100, Math.round(25 + engagementRatio * 75));

//   // 6. ATTENDANCE (10%)
//   const attendance = Math.min(100, Math.round(50 + engagementRatio * 50));

//   // TOTAL SCORE
//   const rawTotalScore = Math.round(
//     taskCompletion * WEIGHTS.taskCompletion +
//     qualityScore * WEIGHTS.qualityScore +
//     efficiency * WEIGHTS.efficiency +
//     collaboration * WEIGHTS.collaboration +
//     innovation * WEIGHTS.innovation +
//     attendance * WEIGHTS.attendance
//   );

//   let totalScore = Math.min(100, rawTotalScore);
//   if (totalTasks > 0 && totalScore < 20) {
//     totalScore = 20;
//   }

//   const performanceLevel =
//     totalScore >= 85
//       ? "excellent"
//       : totalScore >= 70
//         ? "good"
//         : totalScore >= 55
//           ? "average"
//           : "needs_improvement";

//   // Deterministic Rank & Percentile Calculation
//   const totalEmployees = allUsers.length || 1;
//   let rank = 1;
//   let percentile = 50;

//   if (allUsers.length > 0) {
//     const userIndex = allUsers.findIndex((u) => u._id === userData._id);
//     rank = userIndex !== -1 ? userIndex + 1 : 1;
//     percentile = Math.round(((totalEmployees - rank) / totalEmployees) * 100);
//   }

//   // Generate comments
//   let comments = "";
//   const activeTasks = inProgressTasks + submittedTasks;

//   if (totalScore >= 85) {
//     comments = `${userData.fullName} is performing excellently with a ${totalScore}% KPI score. ${completedTasks}/${totalTasks} tasks completed. Outstanding work!`;
//   } else if (totalScore >= 70) {
//     comments = `${userData.fullName} shows good performance with a ${totalScore}% KPI score. ${completedTasks}/${totalTasks} tasks completed. Keep up the good work!`;
//   } else if (totalScore >= 55) {
//     if (completedTasks === 0 && activeTasks > 0) {
//       comments = `${userData.fullName} has ${activeTasks} tasks in progress/submitted but none completed yet. KPI score: ${totalScore}%. Focus on completing tasks to improve score.`;
//     } else if (overdueTasks > 0) {
//       comments = `${userData.fullName} shows average performance with a ${totalScore}% KPI score. ${overdueTasks} tasks overdue. Recommend: focused training and priority management.`;
//     } else {
//       comments = `${userData.fullName} shows average performance with a ${totalScore}% KPI score. ${completedTasks}/${totalTasks} tasks completed. Keep working on task completion.`;
//     }
//   } else {
//     if (completedTasks === 0 && activeTasks === 0) {
//       comments = `${userData.fullName} has ${totalTasks} pending tasks with a ${totalScore}% KPI score. No tasks have been started yet. Immediate action required.`;
//     } else if (completedTasks === 0 && activeTasks > 0) {
//       comments = `${userData.fullName} has ${activeTasks} tasks in progress but none completed. KPI score: ${totalScore}%. Needs to focus on completing assigned tasks.`;
//     } else {
//       comments = `${userData.fullName} has ${completedTasks}/${totalTasks} tasks completed with a ${totalScore}% KPI score. ${overdueTasks} tasks overdue. Recommend: workload review + improvement plan.`;
//     }
//   }

//   return {
//     _id: `calculated_${userData._id}_${selectedMonth}_${selectedYear}`,
//     userId: userData,
//     month: selectedMonth,
//     year: selectedYear,
//     totalScore,
//     performanceLevel,
//     percentile,
//     rank,
//     totalEmployees,
//     scores: {
//       taskCompletion: {
//         score: taskCompletion,
//         weight: 25,
//         weightedScore: Math.round(taskCompletion * 0.25),
//       },
//       qualityScore: {
//         score: qualityScore,
//         weight: 20,
//         weightedScore: Math.round(qualityScore * 0.2),
//       },
//       efficiency: {
//         score: efficiency,
//         weight: 20,
//         weightedScore: Math.round(efficiency * 0.2),
//       },
//       collaboration: {
//         score: collaboration,
//         weight: 15,
//         weightedScore: Math.round(collaboration * 0.15),
//       },
//       innovation: {
//         score: innovation,
//         weight: 10,
//         weightedScore: Math.round(innovation * 0.1),
//       },
//       attendance: {
//         score: attendance,
//         weight: 10,
//         weightedScore: Math.round(attendance * 0.1),
//       },
//     },
//     comments,
//     calculatedAt: new Date().toISOString(),
//   };
// }

// /**
//  * Simplified KPI for dashboard display
//  */
// export function calculateDashboardKPI(
//   tasks: ApiTask[],
//   userData: UserData,
//   selectedMonth: string,
//   selectedYear: number
// ): {
//   totalScore: number;
//   performanceLevel: string;
//   status: string;
//   tasksCompleted: number;
//   totalTasks: number;
//   tasksInProgress: number;
//   overdueTasks: number;
// } {
//   const result = calculateKPIFromTasks(tasks, userData, selectedMonth, selectedYear);

//   const status =
//     result.totalScore >= 85
//       ? "promotion_ready"
//       : result.totalScore >= 70
//         ? "on_track"
//         : result.totalScore >= 55
//           ? "training_needed"
//           : result.totalScore >= 10
//             ? "warning_review"
//             : "not_calculated";

//   const totalTasks = tasks.length;
//   let tasksCompleted = 0;
//   let tasksInProgress = 0;
//   let overdueTasks = 0;
//   const now = Date.now();

//   for (let i = 0; i < totalTasks; i++) {
//     const t = tasks[i];
//     if (t.status === "completed") tasksCompleted++;
//     else if (t.status === "in_progress") tasksInProgress++;

//     if (
//       t.status === "overdue" ||
//       (t.status !== "completed" && t.deadline && new Date(t.deadline).getTime() < now)
//     ) {
//       overdueTasks++;
//     }
//   }

//   return {
//     totalScore: result.totalScore,
//     performanceLevel: result.performanceLevel,
//     status,
//     tasksCompleted,
//     totalTasks,
//     tasksInProgress,
//     overdueTasks,
//   };
// }
// lib/kpi-utils.ts

interface ApiTask {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline?: string;
  assignedTo?: string | { _id: string } | null;
  createdAt: string;
  actualMinutes?: number;
}

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  departmentId?: any;
  department?: string;
  position?: string;
}

interface ScoreComponent {
  score: number;
  weight: number;
  weightedScore: number;
}

export interface EmployeeKPI {
  _id: string;
  userId: UserData;
  month: string;
  year: number;
  totalScore: number;
  performanceLevel: "excellent" | "good" | "average" | "needs_improvement";
  percentile: number;
  rank: number;
  totalEmployees: number;
  scores: {
    taskCompletion: ScoreComponent;
    qualityScore: ScoreComponent;
    efficiency: ScoreComponent;
    collaboration: ScoreComponent;
    innovation: ScoreComponent;
    attendance: ScoreComponent;
  };
  comments: string;
  calculatedAt: string;
}

const WEIGHTS = {
  taskCompletion: 0.25,
  qualityScore: 0.20,
  efficiency: 0.20,
  collaboration: 0.15,
  innovation: 0.10,
  attendance: 0.10,
};

// ✅ SINGLE SOURCE OF TRUTH - NO EXTRA FILTERING
export function calculateKPIFromTasks(
  tasks: ApiTask[],
  userData: UserData,
  selectedMonth: string,
  selectedYear: number,
  allUsers: UserData[] = []
): EmployeeKPI {
  // ✅ Directly use tasks - they are already filtered by the caller
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const submittedTasks = tasks.filter((t) => t.status === "submitted").length;
  const overdueTasks = tasks.filter((t) =>
    t.status === "overdue" ||
    (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
  ).length;
  const rejectedTasks = tasks.filter((t) => t.status === "rejected").length;

  console.log(`=== KPI Calculation for ${userData.fullName} ===`);
  console.log(`Month: ${selectedMonth} ${selectedYear}`);
  console.log(`Total tasks in month: ${totalTasks}`);
  console.log(`Completed: ${completedTasks}`);
  console.log(`In Progress: ${inProgressTasks}`);
  console.log(`Submitted: ${submittedTasks}`);
  console.log(`Overdue: ${overdueTasks}`);
  console.log(`Rejected: ${rejectedTasks}`);

  if (totalTasks === 0) {
    return {
      _id: `calculated_${userData._id}_${selectedMonth}_${selectedYear}`,
      userId: userData,
      month: selectedMonth,
      year: selectedYear,
      totalScore: 0,
      performanceLevel: "needs_improvement",
      percentile: 0,
      rank: allUsers.length || 1,
      totalEmployees: allUsers.length || 1,
      scores: {
        taskCompletion: { score: 0, weight: 25, weightedScore: 0 },
        qualityScore: { score: 0, weight: 20, weightedScore: 0 },
        efficiency: { score: 0, weight: 20, weightedScore: 0 },
        collaboration: { score: 0, weight: 15, weightedScore: 0 },
        innovation: { score: 0, weight: 10, weightedScore: 0 },
        attendance: { score: 0, weight: 10, weightedScore: 0 },
      },
      comments: `${userData.fullName} has no tasks assigned for ${selectedMonth} ${selectedYear}.`,
      calculatedAt: new Date().toISOString(),
    };
  }

  // 1. TASK COMPLETION (25%)
  const effectiveCompleted = completedTasks + (inProgressTasks * 0.5) + (submittedTasks * 0.8);
  const taskCompletion = Math.min(100, Math.round((effectiveCompleted / totalTasks) * 100));

  // 2. QUALITY SCORE (20%)
  let qualityScore = 0;
  if (completedTasks > 0) {
    const qualityTasks = completedTasks - overdueTasks - rejectedTasks;
    qualityScore = Math.min(100, Math.max(0, Math.round((qualityTasks / totalTasks) * 100)));
  } else if (inProgressTasks + submittedTasks > 0) {
    const activeTasks = inProgressTasks + submittedTasks;
    qualityScore = Math.min(70, Math.round(30 + (activeTasks / totalTasks) * 40));
  } else {
    qualityScore = 20;
  }

  // 3. EFFICIENCY (20%)
  const progress = (completedTasks + inProgressTasks * 0.5 + submittedTasks * 0.8) / totalTasks;
  const efficiency = Math.min(100, Math.round(Math.max(15, progress * 100)));

  // 4. COLLABORATION (15%)
  const engagementRatio = (completedTasks + inProgressTasks + submittedTasks) / totalTasks;
  const collaboration = Math.min(100, Math.round(30 + engagementRatio * 70));

  // 5. INNOVATION (10%)
  const innovation = Math.min(100, Math.round(25 + engagementRatio * 75));

  // 6. ATTENDANCE (10%)
  const attendance = Math.min(100, Math.round(50 + engagementRatio * 50));

  console.log(`Component scores:`, {
    taskCompletion,
    qualityScore,
    efficiency,
    collaboration,
    innovation,
    attendance
  });

  // TOTAL SCORE
  const rawTotalScore = Math.round(
    taskCompletion * WEIGHTS.taskCompletion +
    qualityScore * WEIGHTS.qualityScore +
    efficiency * WEIGHTS.efficiency +
    collaboration * WEIGHTS.collaboration +
    innovation * WEIGHTS.innovation +
    attendance * WEIGHTS.attendance
  );

  let totalScore = Math.min(100, rawTotalScore);
  if (totalTasks > 0 && totalScore < 20) {
    totalScore = 20;
  }

  console.log(`Raw total: ${rawTotalScore}, Final total: ${totalScore}`);

  const performanceLevel = totalScore >= 85 ? "excellent"
    : totalScore >= 70 ? "good"
      : totalScore >= 55 ? "average"
        : "needs_improvement";

  let rank = 1;
  let percentile = 50;
  if (allUsers.length > 0) {
    const allScores = allUsers.map((u) => {
      return u._id === userData._id ? totalScore : Math.random() * 100;
    });
    const sortedScores = [...allScores].sort((a, b) => b - a);
    rank = sortedScores.indexOf(totalScore) + 1 || 1;
    percentile = allUsers.length > 0
      ? Math.round(((allUsers.length - rank) / allUsers.length) * 100)
      : 50;
  }

  let comments = "";
  const activeTasks = inProgressTasks + submittedTasks;

  if (totalScore >= 85) {
    comments = `${userData.fullName} is performing excellently with a ${totalScore}% KPI score. ${completedTasks}/${totalTasks} tasks completed. Outstanding work!`;
  } else if (totalScore >= 70) {
    comments = `${userData.fullName} shows good performance with a ${totalScore}% KPI score. ${completedTasks}/${totalTasks} tasks completed. Keep up the good work!`;
  } else if (totalScore >= 55) {
    if (completedTasks === 0 && activeTasks > 0) {
      comments = `${userData.fullName} has ${activeTasks} tasks in progress/submitted but none completed yet. KPI score: ${totalScore}%. Focus on completing tasks to improve score.`;
    } else if (overdueTasks > 0) {
      comments = `${userData.fullName} shows average performance with a ${totalScore}% KPI score. ${overdueTasks} tasks overdue. Recommend: focused training and priority management.`;
    } else {
      comments = `${userData.fullName} shows average performance with a ${totalScore}% KPI score. ${completedTasks}/${totalTasks} tasks completed. Keep working on task completion.`;
    }
  } else {
    if (completedTasks === 0 && activeTasks === 0) {
      comments = `${userData.fullName} has ${totalTasks} pending tasks with a ${totalScore}% KPI score. No tasks have been started yet. Immediate action required.`;
    } else if (completedTasks === 0 && activeTasks > 0) {
      comments = `${userData.fullName} has ${activeTasks} tasks in progress but none completed. KPI score: ${totalScore}%. Needs to focus on completing assigned tasks.`;
    } else {
      comments = `${userData.fullName} has ${completedTasks}/${totalTasks} tasks completed with a ${totalScore}% KPI score. ${overdueTasks} tasks overdue. Recommend: workload review + improvement plan.`;
    }
  }

  return {
    _id: `calculated_${userData._id}_${selectedMonth}_${selectedYear}`,
    userId: userData,
    month: selectedMonth,
    year: selectedYear,
    totalScore,
    performanceLevel,
    percentile,
    rank,
    totalEmployees: allUsers.length || 1,
    scores: {
      taskCompletion: {
        score: taskCompletion,
        weight: 25,
        weightedScore: Math.round(taskCompletion * 0.25)
      },
      qualityScore: {
        score: qualityScore,
        weight: 20,
        weightedScore: Math.round(qualityScore * 0.2)
      },
      efficiency: {
        score: efficiency,
        weight: 20,
        weightedScore: Math.round(efficiency * 0.2)
      },
      collaboration: {
        score: collaboration,
        weight: 15,
        weightedScore: Math.round(collaboration * 0.15)
      },
      innovation: {
        score: innovation,
        weight: 10,
        weightedScore: Math.round(innovation * 0.1)
      },
      attendance: {
        score: attendance,
        weight: 10,
        weightedScore: Math.round(attendance * 0.1)
      },
    },
    comments,
    calculatedAt: new Date().toISOString(),
  };
}

export function calculateDashboardKPI(
  tasks: ApiTask[],
  userData: UserData,
  selectedMonth: string,
  selectedYear: number
): {
  totalScore: number;
  performanceLevel: string;
  status: string;
  tasksCompleted: number;
  totalTasks: number;
  tasksInProgress: number;
  overdueTasks: number;
} {
  const result = calculateKPIFromTasks(tasks, userData, selectedMonth, selectedYear);

  const status = result.totalScore >= 85 ? "promotion_ready"
    : result.totalScore >= 70 ? "on_track"
      : result.totalScore >= 55 ? "training_needed"
        : result.totalScore >= 10 ? "warning_review"
          : "not_calculated";

  return {
    totalScore: result.totalScore,
    performanceLevel: result.performanceLevel,
    status,
    tasksCompleted: tasks.filter((t) => t.status === "completed").length,
    totalTasks: tasks.length,
    tasksInProgress: tasks.filter((t) => t.status === "in_progress").length,
    overdueTasks: tasks.filter((t) =>
      t.status === "overdue" ||
      (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
    ).length,
  };
}