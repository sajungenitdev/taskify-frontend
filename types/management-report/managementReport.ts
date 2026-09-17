// types/management-report/managementReport.ts

export type TaskStatus =
    | "Done - 100%"
    | "Done - 75%"
    | "Done - 50%"
    | "Not Done"
    | "In Progress"
    | "Not Yet Started";

export type Priority = "Low" | "Medium" | "High";

export type EvalRating =
    | "0%" | "10%" | "15%" | "20%" | "25%" | "30%" | "35%" | "40%"
    | "45%" | "50%" | "55%" | "60%" | "65%" | "70%" | "75%" | "80%"
    | "85%" | "90%" | "95%" | "100%" | "--";

/** 🆕 One single attendance value per row */
export type AttendanceStatus =
    | "Present"
    | "Half Day"
    | "Double Late"
    | "Single Late"
    | "Sick Leave"
    | "Earn Leave"
    | "Casual Leave"
    | "Absent"
    | "—";

export interface TaskRowData {
    id: number;
    dayNum: number;
    status: TaskStatus;
    priority: Priority;
    startDate: string;
    endDate: string;
    givenDuration: string;
    day: string;
    taskDescription: string;
    isRedNote?: boolean;
    deliverDate: string;
    /** 🆕 Single attendance column */
    attendance: AttendanceStatus;
    workLinkText: string;
    workLinkUrl?: string;
    isOffDay?: boolean;
    supervisor: EvalRating;
    hr: EvalRating;
    ceo: EvalRating;
    comments: string;
    taskId?: string;
}

export interface TargetLink {
    label: string;
    url?: string;
    value?: string;
}

export interface ManagementReportProps {
    monthLabel?: string;
    rows: TaskRowData[];
    onRowsChange?: (rows: TaskRowData[]) => void;
    tabs?: string[];
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    targetLinks?: TargetLink[];
    reportTitle?: string;
    readOnly?: boolean;
    employeeName?: string;
    employeeRole?: string;
    employeeId?: string;
    loading?: boolean;
}