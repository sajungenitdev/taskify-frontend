export interface User {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  phoneNumber?: string;
  profilePhoto?: string;
  departmentId?: Department | string;
  managerId?: User | string;
  dailyHoursTarget: number;
  firstLogin: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: User;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project?: string;
  assignedTo: User;
  assignedBy: User;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue";
  estimatedHours: number;
  actualMinutes: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    firstLogin: boolean;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>; // Should return Promise<void>, not Promise<boolean>
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string | string[]) => boolean;
}
