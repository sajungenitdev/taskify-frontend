export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue" | "rejected";
  deadline: string;
  startDate?: string;
  estimatedHours: number;
  actualMinutes?: number;
  assignedTo: { _id: string; fullName: string; email: string; avatar?: string };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  evidenceUrls?: string[];
  commentsCount?: number;
  attachmentsCount?: number;
  reviewsCount?: number;
  averageRating?: number;
  rejectionReason?: string;
  approvalNote?: string;
  evidenceRequired?: boolean;
  evidenceSubmitted?: boolean;
  evidenceSubmittedAt?: string;
  createdAt: string;
  updatedAt: string;
  isMilestone?: boolean;
  parentTaskId?: string | null | { _id: string; title: string; status: string };
  subTaskCount?: number;
  completedSubTaskCount?: number;
  progress?: number;
  dependencies?: { taskId: string; type: string; lag: number }[];
}

export interface Comment {
  _id: string;
  content: string;
  author: { _id: string; fullName: string; email: string; avatar?: string };
  parentCommentId?: string | null;
  replies?: Comment[];
  likes: string[];
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: { _id: string; fullName: string; email: string };
  createdAt: string;
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewer: { _id: string; fullName: string; email: string; avatar?: string };
  response?: {
    content: string;
    respondedBy: { _id: string; fullName: string };
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExtensionRequest {
  _id: string;
  requestedDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: { _id: string; fullName: string };
  createdAt: string;
}