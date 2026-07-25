// components/dashboard/DashboardFactory.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import SuperAdminDashboard from "@/app/(dashboard)/dashboard/components/SuperAdminDashboard";
import AdminDashboard from "@/app/(dashboard)/dashboard/components/AdminDashboard";
import HRDashboard from "@/app/(dashboard)/dashboard/components/HRDashboard";
import DepartmentDashboard from "@/app/(dashboard)/dashboard/components/DepartmentDashboard";
import ProjectDashboard from "@/app/(dashboard)/dashboard/components/ProjectDashboard";
import LineManagerDashboard from "@/app/(dashboard)/dashboard/components/LineManagerDashboard";
import EmployeeDashboard from "@/app/(dashboard)/dashboard/components/EmployeeDashboard";
import { Users, LayoutDashboard } from "lucide-react";

interface DashboardFactoryProps {
  // You can pass additional props if needed
}

export default function DashboardFactory({}: DashboardFactoryProps) {
  const { user, hasRole } = useAuth();

  // Debug
  console.log("🏭 DashboardFactory - User role:", user?.role);

  // Check roles in order of priority
  if (hasRole(["super_admin"])) {
    return <SuperAdminDashboard />;
  }
  
  if (hasRole(["admin"])) {
    return <AdminDashboard />;
  }
  
  if (hasRole(["hr_manager"])) {
    return <HRDashboard />;
  }
  
  if (hasRole(["dept_manager"])) {
    return <DepartmentDashboard />;
  }
  
  if (hasRole(["project_manager"])) {
    return <ProjectDashboard />;
  }
  
  if (hasRole(["line_manager"])) {
    return <LineManagerDashboard />;
  }
  
  if (hasRole(["employee"])) {
    return <EmployeeDashboard />;
  }
  
  // Fallback for any other role or no role
  return (
    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <LayoutDashboard className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Welcome to Taskify
      </h2>
      <p className="text-gray-500">
        Your personalized dashboard will appear here.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
        <Users size={16} />
        <span>Role: {user?.role || "Not assigned"}</span>
      </div>
    </div>
  );
}