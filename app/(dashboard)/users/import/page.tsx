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
  Building2,
  Shield,
  Mail,
  Phone,
  Briefcase,
  ArrowLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Info,
  UserPlus,
  Database,
  Clock,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
    total: number;
  } | null>(null);

  const canImport = hasRole(["super_admin", "admin", "hr_manager"]);

  if (!canImport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500 mb-6">
            You don't have permission to bulk import users
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md shadow-indigo-500/20"
          >
            Go to Dashboard
          </Link>
        </motion.div>
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

      const headerLine = lines[0];
      const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

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
        return;
      }

      const phoneColumnIndex = headers.findIndex(
        (h) => h.includes("phone") || h === "phonenumber" || h === "mobile",
      );
      const hasPhoneColumn = phoneColumnIndex !== -1;

      const parsedData: ImportPreview[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

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
          success: response.data.successCount || validUsers.length,
          failed: response.data.failedCount || 0,
          errors: response.data.errors || [],
          total: validUsers.length,
        });
        setStep(3);
        toast.success(
          `Successfully imported ${response.data.successCount || validUsers.length} users`,
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
      employee: "gray",
    };
    return colors[role] || "gray";
  };

  const validCount = useMemo(
    () => preview.filter((u) => u.isValid).length,
    [preview],
  );
  const invalidCount = useMemo(
    () => preview.filter((u) => !u.isValid).length,
    [preview],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Bulk Import Users
                </h1>
              </div>
              <p className="text-gray-500 text-sm">
                Import multiple users at once using CSV file
              </p>
            </div>
            <Link
              href="/users/all"
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <ArrowLeft size={16} />
              Back to Users
            </Link>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                    step >= s
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition ${
                      step > s ? "bg-indigo-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </motion.div>

          {/* Step 1: Upload File */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Upload CSV File
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Download the template and fill with user data
                  </p>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                    isDragActive
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag & drop a CSV file here, or click to select"}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    CSV files only (max 10MB)
                  </p>
                </div>

                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-gray-700 text-sm font-medium">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview([]);
                      }}
                      className="p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={downloadTemplate}
                    className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-2 transition border border-gray-200"
                  >
                    <Download size={16} className="text-indigo-500" />
                    Download Template CSV
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Column Requirements
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-1">
                      <div>
                        <p className="text-xs text-blue-600">
                          <span className="font-semibold">Required:</span>{" "}
                          fullName, email, password, employeeId, role
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600">
                          <span className="font-semibold">Optional:</span>{" "}
                          departmentCode, phoneNumber
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Valid roles: super_admin, admin, hr_manager, dept_manager,
                      project_manager, line_manager, employee
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Preview & Confirm */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-gray-800 font-semibold">
                        Preview Data
                      </h3>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Review the data before importing
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">
                        Valid: {validCount}
                      </span>
                      <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200">
                        Invalid: {invalidCount}
                      </span>
                      <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200">
                        Total: {preview.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Full Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.map((user, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`hover:bg-gray-50 transition ${
                            !user.isValid ? "bg-rose-50/30" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium">
                            {user.fullName || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {user.email || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {user.employeeId || "-"}
                          </td>
                          <td className="px-4 py-3">
                            {user.role && (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full bg-${getRoleColor(user.role)}-100 text-${getRoleColor(user.role)}-700 border border-${getRoleColor(user.role)}-200`}
                              >
                                {user.role.replace(/_/g, " ")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {user.departmentCode || "-"}
                          </td>
                          <td className="px-4 py-3">
                            {user.isValid ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs text-emerald-600 font-medium">
                                  Valid
                                </span>
                              </div>
                            ) : (
                              <div className="relative group">
                                <div className="flex items-center gap-1 cursor-help">
                                  <AlertCircle className="w-4 h-4 text-rose-500" />
                                  <span className="text-xs text-rose-600 font-medium">
                                    Invalid
                                  </span>
                                </div>
                                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 min-w-[200px] shadow-lg z-10">
                                  <ul className="space-y-0.5">
                                    {user.errors.map((err, i) => (
                                      <li key={i}>• {err}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validCount === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus size={18} />
                      Import {validCount} Users
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === 3 && importResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
                {importResult.failed === 0 ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Import Complete!
                    </h2>
                    <p className="text-gray-500">
                      Successfully imported {importResult.success} users
                    </p>
                    <div className="mt-4 flex justify-center gap-4">
                      <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-2xl font-bold text-emerald-600">
                          {importResult.success}
                        </span>
                        <span className="text-sm text-emerald-600 ml-1">
                          Successful
                        </span>
                      </div>
                      <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-2xl font-bold text-gray-600">
                          {importResult.failed}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          Failed
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Import Completed with Errors
                    </h2>
                    <p className="text-gray-500">
                      Successfully imported {importResult.success} out of{" "}
                      {importResult.total} users
                    </p>
                    <div className="mt-4 flex justify-center gap-4">
                      <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-2xl font-bold text-emerald-600">
                          {importResult.success}
                        </span>
                        <span className="text-sm text-emerald-600 ml-1">
                          Successful
                        </span>
                      </div>
                      <div className="px-4 py-2 bg-rose-50 rounded-lg border border-rose-200">
                        <span className="text-2xl font-bold text-rose-600">
                          {importResult.failed}
                        </span>
                        <span className="text-sm text-rose-500 ml-1">
                          Failed
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                  <h4 className="text-sm font-medium text-rose-700 mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Error Details:
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {importResult.errors.map((err, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-rose-600 bg-rose-100/50 px-3 py-1 rounded"
                      >
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resetImport}
                  className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Database size={16} />
                    Import Another File
                  </div>
                </button>
                <Link
                  href="/users/all"
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-center transition shadow-md shadow-indigo-500/20"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users size={16} />
                    Go to Users
                  </div>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        .bg-purple-100 {
          background-color: #f3e8ff;
        }
        .text-purple-700 {
          color: #7c3aed;
        }
        .border-purple-200 {
          border-color: #e9d5ff;
        }
        .bg-red-100 {
          background-color: #fee2e2;
        }
        .text-red-700 {
          color: #dc2626;
        }
        .border-red-200 {
          border-color: #fecaca;
        }
        .bg-pink-100 {
          background-color: #fce7f3;
        }
        .text-pink-700 {
          color: #db2777;
        }
        .border-pink-200 {
          border-color: #fbcfe8;
        }
        .bg-orange-100 {
          background-color: #ffedd5;
        }
        .text-orange-700 {
          color: #ea580c;
        }
        .border-orange-200 {
          border-color: #fed7aa;
        }
        .bg-cyan-100 {
          background-color: #cffafe;
        }
        .text-cyan-700 {
          color: #0891b2;
        }
        .border-cyan-200 {
          border-color: #a5f3fc;
        }
        .bg-green-100 {
          background-color: #d1fae5;
        }
        .text-green-700 {
          color: #059669;
        }
        .border-green-200 {
          border-color: #a7f3d0;
        }
        .bg-gray-100 {
          background-color: #f3f4f6;
        }
        .text-gray-700 {
          color: #374151;
        }
        .border-gray-200 {
          border-color: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
