"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  GitBranch,
  ChevronRight,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  parentDepartment?: { _id: string; name: string; code: string };
  children?: Department[];
  employeeCount: number;
  headOfDepartment?: { fullName: string };
}

export default function HierarchyPage() {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        const depts = response.data.data;
        const topLevel = depts.filter((d: any) => !d.parentDepartment);
        const withChildren = topLevel.map((dept: any) => ({
          ...dept,
          children: depts.filter(
            (d: any) => d.parentDepartment?._id === dept._id,
          ),
        }));
        setDepartments(withChildren);

        // Auto expand first level
        const initialExpanded: Record<string, boolean> = {};
        withChildren.forEach((dept: Department) => {
          initialExpanded[dept._id] = true;
        });
        setExpanded(initialExpanded);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const DepartmentNode = ({
    dept,
    level = 0,
  }: {
    dept: Department;
    level: number;
  }) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expanded[dept._id];

    return (
      <div className="relative">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
            ${level === 0 ? "bg-indigo-500/10 border-indigo-500/30 ml-0" : "bg-slate-800/30 border-slate-700 ml-6"}`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <button
            onClick={() => toggleExpand(dept._id)}
            className="text-slate-400 hover:text-white"
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              ))}
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{dept.name}</span>
              <span className="text-xs text-slate-500 font-mono">
                {dept.code}
              </span>
            </div>
            {dept.headOfDepartment && (
              <p className="text-xs text-slate-400">
                Head: {dept.headOfDepartment.fullName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users size={12} />
            <span>{dept.employeeCount}</span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {dept.children?.map((child) => (
              <DepartmentNode key={child._id} dept={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!hasRole(["super_admin", "admin"])) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">
            You don't have permission to view this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/departments/all"
            className="text-slate-400 hover:text-white transition"
          >
            Departments
          </Link>
          <ChevronRight size={16} className="text-slate-600" />
          <span className="text-white">Hierarchy</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Department Hierarchy
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Visual representation of department structure
            </p>
          </div>
          <button
            onClick={fetchDepartments}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <GitBranch size={16} />
            Refresh
          </button>
        </div>

        {/* Hierarchy Tree */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No departments found</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            {departments.map((dept) => (
              <DepartmentNode key={dept._id} dept={dept} level={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
