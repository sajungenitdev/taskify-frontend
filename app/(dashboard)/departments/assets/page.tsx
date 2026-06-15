"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  FolderKanban,
  Package,
  TrendingUp,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Asset {
  name: string;
  type: string;
  quantity: number;
  value: number;
  condition: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  assets?: {
    total: number;
    value: number;
    items: Asset[];
  };
}

export default function AssetsPage() {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState<Asset>({
    name: "",
    type: "",
    quantity: 1,
    value: 0,
    condition: "Good",
  });

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

  const totalAssets = departments.reduce(
    (sum, d) => sum + (d.assets?.total || 0),
    0,
  );
  const totalValue = departments.reduce(
    (sum, d) => sum + (d.assets?.value || 0),
    0,
  );

  if (!hasRole(["super_admin", "admin"])) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FolderKanban className="w-12 h-12 text-rose-500 mx-auto mb-3" />
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
          <span className="text-white">Assets</span>
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-white mb-6">
          Department Assets Overview
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Assets</p>
                <p className="text-2xl font-bold text-white">{totalAssets}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Value</p>
                <p className="text-2xl font-bold text-white">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Value/Asset</p>
                <p className="text-2xl font-bold text-white">
                  ${totalAssets > 0 ? (totalValue / totalAssets).toFixed(0) : 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Assets Table */}
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
                      Asset Count
                    </th>
                    <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase">
                      Total Value
                    </th>
                    <th className="text-center px-6 py-3 text-xs text-slate-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {departments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{dept.name}</p>
                          <p className="text-slate-500 text-xs">{dept.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        {dept.assets?.total || 0}
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        ${(dept.assets?.value || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedDept(dept)}
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Asset Details Modal */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {selectedDept.name} - Assets
                </h2>
                <p className="text-slate-400 text-sm">
                  Total Assets: {selectedDept.assets?.total || 0} | Value: $
                  {(selectedDept.assets?.value || 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {selectedDept.assets?.items?.map((asset, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/30 rounded-lg p-3 border border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{asset.name}</p>
                        <p className="text-xs text-slate-400">
                          Type: {asset.type} | Condition: {asset.condition}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{asset.quantity} units</p>
                        <p className="text-sm text-emerald-400">
                          ${(asset.value * asset.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!selectedDept.assets?.items ||
                  selectedDept.assets.items.length === 0) && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">
                      No assets found for this department
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
