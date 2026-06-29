export interface TeamMember {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  position?: string;
  department?: string;
  phone?: string;
  employeeId?: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  department: string;
  lead: TeamMember | string;
  members: TeamMember[] | string[];
  projects?: string[];
  status: "active" | "inactive";
  color?: string;
  icon?: string;
  teamSize: number;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormData {
  name: string;
  description?: string;
  department: string;
  lead: string;
  members: string[];
  status: "active" | "inactive";
  color?: string;
  icon?: string;
}

export interface TeamStats {
  totalTeams: number;
  activeTeams: number;
  inactiveTeams: number;
  departmentStats: Array<{
    _id: string;
    count: number;
    members: number;
  }>;
  topTeams: Array<{
    _id: string;
    name: string;
    department: string;
    teamSize: number;
    lead: {
      _id: string;
      fullName: string;
    };
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}
