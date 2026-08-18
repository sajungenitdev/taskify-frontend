// types/task.ts
export interface Task {
    _id: string;
    title: string;
    description: string;
    priority: "low" | "normal" | "high" | "urgent";
    status: "pending" | "in_progress" | "submitted" | "completed" | "overdue" | "rejected";
    deadline: string;
    estimatedHours: number;
    actualMinutes?: number;
    assignedTo: { _id: string; fullName: string; email: string; avatar?: string; department?: { _id: string; name: string } };
    assignedBy: { _id: string; fullName: string };
    projectId?: { _id: string; name: string; code: string };
    departmentId?: { _id: string; name: string; code: string };
    isStarred?: boolean;
    isApprovalRequired?: boolean;
    evidenceRequired?: boolean;
    evidenceUrls?: string[];
    rejectionReason?: string;
    commentsCount?: number;
    attachmentsCount?: number;
    reviewsCount?: number;
    averageRating?: number;
    approvalNote?: string;
    evidenceSubmitted?: boolean;
    evidenceSubmittedAt?: string;
    comments?: number;
    attachments?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ExtendedUser {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    department?: {
        _id: string;
        name: string;
        code: string;
    };
    departmentId?: string;
}

export interface ExtensionRequest {
    _id: string;
    taskId: string;
    taskTitle: string;
    requestedDate: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    approvedBy?: { _id: string; fullName: string };
    createdAt: string;
    updatedAt: string;
    task?: {
        _id: string;
        title: string;
        priority: string;
        status: string;
        deadline: string;
        assignedTo: { _id: string; fullName: string };
    };
}

export interface Stats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    submitted: number;
    rejected: number;
}

export interface EditFormData {
    title: string;
    description: string;
    priority: string;
    status: string;
    deadline: string;
    estimatedHours: number;
    assignedTo: string;
    projectId: string;
}