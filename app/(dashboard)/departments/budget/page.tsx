"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Department {
  _id: string;
  name: string;
  code: string;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
    fiscalYear: string;
  };
  employeeCount: number;
}

export default function BudgetPage() {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = departments.reduce(
    (sum, d) => sum + (d.budget?.allocated || 0),
    0,
  );
  const totalSpent = departments.reduce(
    (sum, d) => sum + (d.budget?.spent || 0),
    0,
  );
  const totalRemaining = totalBudget - totalSpent;
  const utilizationRate =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (!hasRole(["super_admin", "admin"])) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">
            You don't have permission to view this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 pe-0">
      <div className="container mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/departments/all"
            className="text-slate-400 hover:text-white transition"
          >
            Departments
          </Link>
          <ChevronRight size={16} className="text-slate-600" />
          <span className="text-white">Budget</span>
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-white mb-6">
          Department Budget Overview
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Budget</p>
                <p className="text-2xl font-bold text-white">
                  ${totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Spent</p>
                <p className="text-2xl font-bold text-white">
                  ${totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Remaining</p>
                <p className="text-2xl font-bold text-white">
                  ${totalRemaining.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Utilization</p>
                <p className="text-2xl font-bold text-white">
                  {utilizationRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">
                      Department
                    </th>
                    <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase">
                      Allocated
                    </th>
                    <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase">
                      Spent
                    </th>
                    <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase">
                      Remaining
                    </th>
                    <th className="text-center px-6 py-3 text-xs text-slate-400 uppercase">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {departments.map((dept) => {
                    const allocated = dept.budget?.allocated || 0;
                    const spent = dept.budget?.spent || 0;
                    const remaining = allocated - spent;
                    const utilization =
                      allocated > 0 ? (spent / allocated) * 100 : 0;
                    return (
                      <tr key={dept._id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">
                              {dept.name}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {dept.code}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-white">
                          ${allocated.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-white">
                          ${spent.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-400">
                          ${remaining.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${utilization > 90 ? "bg-rose-500" : utilization > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{
                                  width: `${Math.min(utilization, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-12">
                              {utilization.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
