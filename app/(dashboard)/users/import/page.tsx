"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Users,
  ArrowLeft,
  FileJson,
  UserPlus,
  Trash2,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";

interface ImportRecord {
  fullName: string;
  email: string;
  password: string;
  employeeId: string;
  role: string;
  departmentCode: string;
  phoneNumber: string;
}

export default function ImportPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [step, setStep] = useState(1);
  const [importing, setImporting] = useState(false);

  const canImport = hasRole(["super_admin", "admin", "hr_manager"]);

  if (!canImport) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-md w-full"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-sm mb-6">You lack administrative privileges to perform bulk user imports.</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  // Handle Dropzone for CSV and JSON files
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/json": [".json"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024,
  });

  const processFile = (file: File) => {
    const reader = new FileReader();
    const isJson = file.name.endsWith(".json");

    reader.onload = (e) => {
      const content = e.target?.result as string;

      if (isJson) {
        try {
          const jsonData = JSON.parse(content);
          const parsed: ImportRecord[] = (Array.isArray(jsonData) ? jsonData : [jsonData]).map((item: any) => ({
            fullName: item.fullName || item.name || "",
            email: item.email || "",
            password: item.password || "Password123",
            employeeId: item.employeeId || item.empId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            role: item.role || "employee",
            departmentCode: item.departmentCode || item.dept || "",
            phoneNumber: item.phoneNumber || item.phone || "",
          }));
          setRecords(parsed);
          setStep(2);
          toast.success(`Loaded ${parsed.length} records from JSON successfully!`);
        } catch (err) {
          toast.error("Invalid JSON file format structure.");
        }
      } else {
        // CSV Parsing
        const lines = content.split("\n").filter((line) => line.trim());
        if (lines.length < 2) {
          toast.error("CSV file must contain a header row and data.");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const getIndex = (aliases: string[]) => headers.findIndex((h) => aliases.includes(h));

        const nameIdx = getIndex(["fullname", "full name", "name"]);
        const emailIdx = getIndex(["email", "e-mail"]);
        const passIdx = getIndex(["password", "pass"]);
        const empIdx = getIndex(["employeeid", "employee id", "empid"]);
        const roleIdx = getIndex(["role"]);
        const deptIdx = getIndex(["departmentcode", "department code", "deptcode", "dept"]);
        const phoneIdx = getIndex(["phonenumber", "phone", "mobile"]);

        const parsedData: ImportRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);
          parsedData.push({
            fullName: nameIdx !== -1 ? row[nameIdx]?.trim() || "" : "",
            email: emailIdx !== -1 ? row[emailIdx]?.trim() || "" : "",
            password: passIdx !== -1 ? row[passIdx]?.trim() || "Password123" : "Password123",
            employeeId: empIdx !== -1 ? row[empIdx]?.trim() || "" : `EMP-${i}`,
            role: roleIdx !== -1 ? row[roleIdx]?.trim()?.toLowerCase() || "employee" : "employee",
            departmentCode: deptIdx !== -1 ? row[deptIdx]?.trim() || "" : "",
            phoneNumber: phoneIdx !== -1 ? row[phoneIdx]?.trim() || "" : "",
          });
        }

        setRecords(parsedData);
        setStep(2);
        toast.success(`Loaded ${parsedData.length} records from CSV successfully!`);
      }
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else current += char;
    }
    result.push(current.trim());
    return result;
  };

  // Delete a specific row from the preview table
  const handleDeleteRow = (index: number) => {
    const updated = records.filter((_, idx) => idx !== index);
    setRecords(updated);
    toast.success("Row removed from preview.");
  };

  // Identify missing required fields per record dynamically
  const recordErrors = useMemo(() => {
    return records.map((rec, index) => {
      const missing: string[] = [];
      if (!rec.fullName) missing.push("Full Name");
      if (!rec.email || !rec.email.includes("@")) missing.push("Valid Email");
      if (!rec.password || rec.password.length < 8) missing.push("Password (min 8 chars)");
      if (!rec.employeeId) missing.push("Employee ID");
      if (!rec.role) missing.push("Role");
      return { index, missing };
    });
  }, [records]);

  const totalMissingFieldsCount = useMemo(() => {
    return recordErrors.reduce((acc, curr) => acc + curr.missing.length, 0);
  }, [recordErrors]);

  const updateRecordField = (index: number, field: keyof ImportRecord, value: string) => {
    const updated = [...records];
    updated[index] = { ...updated[index], [field]: value };
    setRecords(updated);
  };

  // Submit all records to backend using the correct admin create-user endpoint
  const handleFinalSubmit = async () => {
    if (records.length === 0) {
      toast.error("No records available to submit.");
      return;
    }

    if (totalMissingFieldsCount > 0) {
      toast.error("Please fill in all required missing fields highlighted below before submitting.");
      return;
    }

    setImporting(true);
    const toastId = toast.loading("Saving records to system...");

    try {
      let successCount = 0;
      let failCount = 0;

      for (const record of records) {
        try {
          await api.post("/auth/admin/create-user", record);
          successCount++;
        } catch (err) {
          failCount++;
        }
      }

      toast.success(`Successfully added ${successCount} users!`, { id: toastId });
      setStep(3);
    } catch (error: any) {
      toast.error("Bulk submission encountered an error.", { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = (type: "csv" | "json") => {
    if (type === "csv") {
      const template = [
        ["fullName", "email", "password", "employeeId", "role", "departmentCode", "phoneNumber"],
        ["John Doe", "john.doe@example.com", "Password123", "EMP001", "employee", "SWE", "+1234567890"],
      ];
      const csvContent = template.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "user_import_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonTemplate = [
        {
          fullName: "John Doe",
          email: "john.doe@example.com",
          password: "Password123",
          employeeId: "EMP001",
          role: "employee",
          departmentCode: "SWE",
          phoneNumber: "+1234567890",
        },
      ];
      const blob = new Blob([JSON.stringify(jsonTemplate, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "user_import_template.json";
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`${type.toUpperCase()} template downloaded!`);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Interactive File Importer</h1>
                <p className="text-slate-500 text-sm font-medium">Upload CSV or JSON, review data instantly, and manage rows before commit.</p>
              </div>
            </div>
          </div>
          <Link
            href="/users"
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs self-start sm:self-auto"
          >
            <ArrowLeft size={16} />
            Return to Directory
          </Link>
        </motion.div>

        {/* Step 1: Upload CSV / JSON */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xs space-y-6">
              <div className="text-center max-w-md mx-auto space-y-1">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Upload Data Archive</h2>
                <p className="text-slate-500 text-xs">Drop your CSV or JSON file below to immediately preview and map rows.</p>
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition ${isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60"
                  }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold text-sm">
                  {isDragActive ? "Drop file here..." : "Drag & drop CSV or JSON file here, or browse"}
                </p>
                <p className="text-slate-400 text-xs mt-1">Files load instantly for live inspection</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => downloadTemplate("csv")}
                  className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Download size={14} className="text-indigo-600" />
                  Download CSV Template
                </button>
                <button
                  onClick={() => downloadTemplate("json")}
                  className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <FileJson size={14} className="text-purple-600" />
                  Download JSON Template
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Table Preview, Inline Editing & Row Deletion */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Live Data Inspection & Correction</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Review uploaded rows below. Edit cells or delete unwanted records before submitting.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${totalMissingFieldsCount === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                    {totalMissingFieldsCount === 0 ? "All Fields Complete!" : `${totalMissingFieldsCount} Missing Field(s) Found`}
                  </span>
                  <span className="px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    Total: {records.length}
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto max-h-[450px]">
                {records.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">No records remaining in the preview table.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3.5">#</th>
                        <th className="px-4 py-3.5">Full Name *</th>
                        <th className="px-4 py-3.5">Email *</th>
                        <th className="px-4 py-3.5">Password *</th>
                        <th className="px-4 py-3.5">Employee ID *</th>
                        <th className="px-4 py-3.5">Role *</th>
                        <th className="px-4 py-3.5">Dept Code</th>
                        <th className="px-4 py-3.5">Phone</th>
                        <th className="px-4 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {records.map((rec, idx) => {
                        const hasError = recordErrors[idx]?.missing.length > 0;
                        return (
                          <tr key={idx} className={`hover:bg-slate-50/50 transition ${hasError ? "bg-amber-50/20" : ""}`}>
                            <td className="px-4 py-3.5 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="px-4 py-3.5">
                              <input
                                type="text"
                                value={rec.fullName}
                                onChange={(e) => updateRecordField(idx, "fullName", e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${!rec.fullName ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"
                                  }`}
                                placeholder="Required Name"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <input
                                type="email"
                                value={rec.email}
                                onChange={(e) => updateRecordField(idx, "email", e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${!rec.email ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"
                                  }`}
                                placeholder="Required Email"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <input
                                type="text"
                                value={rec.password}
                                onChange={(e) => updateRecordField(idx, "password", e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${!rec.password || rec.password.length < 8 ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"
                                  }`}
                                placeholder="Min 8 chars"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <input
                                type="text"
                                value={rec.employeeId}
                                onChange={(e) => updateRecordField(idx, "employeeId", e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none ${!rec.employeeId ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"
                                  }`}
                                placeholder="EMP ID"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <select
                                value={rec.role}
                                onChange={(e) => updateRecordField(idx, "role", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                              >
                                <option value="employee">Employee</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="hr_manager">HR Manager</option>
                                <option value="dept_manager">Department Manager</option>
                                <option value="project_manager">Project Manager</option>
                                <option value="line_manager">Line Manager</option>
                              </select>
                            </td>
                            <td className="px-4 py-3.5">
                              <input
                                type="text"
                                value={rec.departmentCode}
                                onChange={(e) => updateRecordField(idx, "departmentCode", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono outline-none"
                                placeholder="e.g., SWE"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <input
                                type="text"
                                value={rec.phoneNumber}
                                onChange={(e) => updateRecordField(idx, "phoneNumber", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none"
                                placeholder="Optional"
                              />
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => handleDeleteRow(idx)}
                                title="Delete Row"
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Missing Fields Breakdown Panel */}
            {totalMissingFieldsCount > 0 && records.length > 0 && (
              <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Action Required: Missing Information Detected
                </div>
                <p className="text-xs text-amber-700">
                  The following rows require attention before system submission can occur. You can edit table cells directly above or delete unwanted rows:
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {recordErrors.map((err, i) =>
                    err.missing.length > 0 ? (
                      <p key={i} className="text-[11px] text-amber-800 bg-amber-100/60 px-3 py-1 rounded-lg">
                        Row <strong>{err.index + 1}</strong> is missing: <span className="font-bold">{err.missing.join(", ")}</span>
                      </p>
                    ) : null
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition shadow-xs"
              >
                Upload Different File
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={importing || records.length === 0 || totalMissingFieldsCount > 0}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Records...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Commit & Submit {records.length} Users
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success Screen */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center shadow-xs space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900">Import Successful!</h2>
                <p className="text-slate-500 text-xs">
                  All records were successfully validated, corrected, and committed to the workspace directory.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setFile(null);
                    setRecords([]);
                    setStep(1);
                  }}
                  className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition shadow-xs"
                >
                  Import Another File
                </button>
                <Link
                  href="/users"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  View Directory
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}