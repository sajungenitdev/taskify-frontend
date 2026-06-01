"use client";

import { useState, useCallback } from "react";
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
  Building2,
  Shield,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface ImportPreview {
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  departmentCode: string;
  phoneNumber: string;
  password: string;
  isValid: boolean;
  errors: string[];
}

export default function ImportPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview[]>([]);
  const [step, setStep] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: any[];
  } | null>(null);

  const canImport = hasRole(["super_admin", "admin", "hr_manager"]);

  if (!canImport) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">
            You don't have permission to bulk import users
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error("File must contain at least a header row and one data row");
        return;
      }

      // Parse headers - case insensitive
      const headerLine = lines[0];
      const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

      console.log("Detected headers:", headers);

      // Required columns (case insensitive)
      const requiredColumns = [
        { key: "fullname", aliases: ["fullname", "full name", "name"] },
        { key: "email", aliases: ["email", "e-mail"] },
        { key: "password", aliases: ["password", "pass"] },
        {
          key: "employeeid",
          aliases: ["employeeid", "employee id", "emp id", "empid"],
        },
        { key: "role", aliases: ["role", "user role"] },
        {
          key: "departmentcode",
          aliases: [
            "departmentcode",
            "department code",
            "dept code",
            "deptcode",
          ],
        },
      ];

      // Find which column index matches each required column
      const columnMap: Record<string, number> = {};
      let missingColumns: string[] = [];

      for (const required of requiredColumns) {
        let foundIndex = -1;
        for (let i = 0; i < headers.length; i++) {
          if (required.aliases.includes(headers[i])) {
            foundIndex = i;
            break;
          }
        }
        if (foundIndex !== -1) {
          columnMap[required.key] = foundIndex;
        } else {
          missingColumns.push(required.key);
        }
      }

      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(", ")}`);
        toast.error(`Detected headers: ${headers.join(", ")}`);
        return;
      }

      // Optional columns
      const phoneColumnIndex = headers.findIndex(
        (h) => h.includes("phone") || h === "phonenumber" || h === "mobile",
      );
      const hasPhoneColumn = phoneColumnIndex !== -1;

      const parsedData: ImportPreview[] = [];

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        // Handle quoted values properly
        const row = parseCSVLine(lines[i]);

        const fullName = row[columnMap["fullname"]]?.trim() || "";
        const email = row[columnMap["email"]]?.trim() || "";
        const password = row[columnMap["password"]]?.trim() || "";
        const employeeId = row[columnMap["employeeid"]]?.trim() || "";
        const role = row[columnMap["role"]]?.trim()?.toLowerCase() || "";
        const departmentCode = row[columnMap["departmentcode"]]?.trim() || "";
        const phoneNumber = hasPhoneColumn
          ? row[phoneColumnIndex]?.trim() || ""
          : "";

        const errors: string[] = [];

        if (!fullName) errors.push("Full name is required");
        if (!email) errors.push("Email is required");
        if (email && !email.includes("@")) errors.push("Invalid email format");
        if (!password) errors.push("Password is required");
        if (password && password.length < 8)
          errors.push("Password must be at least 8 characters");
        if (!employeeId) errors.push("Employee ID is required");
        if (!role) errors.push("Role is required");

        const validRoles = [
          "super_admin",
          "admin",
          "hr_manager",
          "dept_manager",
          "project_manager",
          "line_manager",
          "employee",
        ];
        if (role && !validRoles.includes(role)) {
          errors.push(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
        }

        parsedData.push({
          fullName,
          email,
          password,
          employeeId,
          role,
          departmentCode,
          phoneNumber,
          isValid: errors.length === 0,
          errors,
        });
      }

      if (parsedData.length === 0) {
        toast.error("No valid data rows found in the file");
        return;
      }

      setPreview(parsedData);
      setStep(2);
      toast.success(`Parsed ${parsedData.length} records`);
    };
    reader.readAsText(file);
  };

  // Helper function to parse CSV lines with quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  const handleImport = async () => {
    const validUsers = preview.filter((u) => u.isValid);

    if (validUsers.length === 0) {
      toast.error("No valid users to import");
      return;
    }

    setImporting(true);
    try {
      const response = await api.post("/users/bulk-import", {
        users: validUsers,
      });

      if (response.data.success) {
        setImportResult({
          success: response.data.successCount,
          failed: response.data.failedCount,
          errors: response.data.errors || [],
        });
        setStep(3);
        toast.success(
          `Successfully imported ${response.data.successCount} users`,
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      [
        "fullName",
        "email",
        "password",
        "employeeId",
        "role",
        "departmentCode",
        "phoneNumber",
      ],
      [
        "John Doe",
        "john.doe@example.com",
        "Password123",
        "EMP001",
        "employee",
        "SWE",
        "+1234567890",
      ],
      [
        "Jane Smith",
        "jane.smith@example.com",
        "Password123",
        "EMP002",
        "dept_manager",
        "HR",
        "+1987654321",
      ],
      [
        "Mike Johnson",
        "mike.johnson@example.com",
        "Password123",
        "EMP003",
        "hr_manager",
        "HR",
        "",
      ],
      [
        "Sarah Williams",
        "sarah.williams@example.com",
        "Password123",
        "EMP004",
        "admin",
        "ADMIN",
        "+1122334455",
      ],
    ];

    const csvContent = template.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const resetImport = () => {
    setFile(null);
    setPreview([]);
    setStep(1);
    setImportResult(null);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "purple",
      admin: "red",
      hr_manager: "pink",
      dept_manager: "orange",
      project_manager: "cyan",
      line_manager: "green",
      employee: "slate",
    };
    return colors[role] || "slate";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Bulk Import Users</h1>
            <p className="text-slate-400 text-sm mt-1">
              Import multiple users at once using CSV file
            </p>
          </div>
          <Link
            href="/users/all"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl transition"
          >
            Back to Users
          </Link>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    step > s ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload File */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8">
              <div className="text-center mb-6">
                <FileSpreadsheet className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-white">
                  Upload CSV File
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Download the template and fill with user data
                </p>
              </div>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  isDragActive
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-700 hover:border-indigo-500/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">
                  {isDragActive
                    ? "Drop the file here"
                    : "Drag & drop a CSV file here, or click to select"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  CSV files only (max 10MB)
                </p>
              </div>

              {file && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="text-white text-sm">{file.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview([]);
                    }}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-800">
                <button
                  onClick={downloadTemplate}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Download size={16} />
                  Download Template CSV
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-400 font-medium">
                    Column Requirements
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Required columns: <strong>fullName</strong>,{" "}
                    <strong>email</strong>, <strong>password</strong>,{" "}
                    <strong>employeeId</strong>, <strong>role</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Optional columns: <strong>departmentCode</strong>,{" "}
                    <strong>phoneNumber</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Valid roles: super_admin, admin, hr_manager, dept_manager,
                    project_manager, line_manager, employee
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Confirm */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">Preview Data</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Review the data before importing
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                      Valid: {preview.filter((u) => u.isValid).length}
                    </span>
                    <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded">
                      Invalid: {preview.filter((u) => !u.isValid).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-slate-400">
                        Full Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-slate-400">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-slate-400">
                        Employee ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-slate-400">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-slate-400">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {preview.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-white">
                          {user.fullName || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {user.email || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {user.employeeId || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {user.role && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full bg-${getRoleColor(user.role)}-500/20 text-${getRoleColor(user.role)}-400`}
                            >
                              {user.role.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {user.departmentCode || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {user.isValid ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <div className="relative group">
                              <AlertCircle className="w-4 h-4 text-rose-400 cursor-help" />
                              <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-slate-800 text-white text-xs rounded p-1 whitespace-nowrap z-10">
                                {user.errors.join(", ")}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={
                  importing || preview.filter((u) => u.isValid).length === 0
                }
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition disabled:opacity-50"
              >
                {importing ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </div>
                ) : (
                  `Import ${preview.filter((u) => u.isValid).length} Users`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && importResult && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 text-center">
              {importResult.failed === 0 ? (
                <>
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Import Complete!
                  </h2>
                  <p className="text-slate-400">
                    Successfully imported {importResult.success} users
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Import Completed with Errors
                  </h2>
                  <p className="text-slate-400">
                    Success: {importResult.success} | Failed:{" "}
                    {importResult.failed}
                  </p>
                </>
              )}
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
                <h4 className="text-sm font-medium text-rose-400 mb-2">
                  Errors:
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {importResult.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-rose-300">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetImport}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
              >
                Import Another File
              </button>
              <Link
                href="/users/all"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center transition"
              >
                Go to Users
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
