// types/expense.ts
export interface ExpenseEmployeeRef {
  _id: string;
  fullName: string;
  email?: string;
  role?: string;
  avatar?: string;
  profilePhoto?: string;
}

export interface Expense {
  _id: string;
  title: string;
  description?: string;
  category: string;
  amount: number;
  currency?: string;
  guests?: number;
  expenseDate: string;
  status: "pending" | "approved" | "rejected" | "paid";
  location?: { lat?: number; lng?: number; label?: string };
  receiptUrl?: string;
  receiptThumbnailUrl?: string;
  gpsVerified?: boolean;
  gpsVerification?: {
    verified: boolean;
    matchedLocation?: string;
    note?: string;
    verifiedAt?: string;
  };
  employeeId?: ExpenseEmployeeRef | string;
  employeeName?: string;
  employeeEmail?: string;
  approvedBy?: { _id?: string; fullName: string; email?: string };
  approvedAt?: string;
  rejectionReason?: string;
  payrollSynced?: boolean;
  payrollSyncedAt?: string;
  submittedAt?: string;
  taskId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApprovalGroup {
  employee?: ExpenseEmployeeRef;
  expenses: Expense[];
  totalAmount: number;
  pendingCount: number;
}