"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if token is provided
    if (!token) {
      setIsValidToken(false);
      setError("Invalid or missing reset token");
    } else {
      setIsValidToken(true);
    }
  }, [token]);

  const validatePassword = (pass: string) => {
    if (pass.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });

      if (response.data.success) {
        setSubmitted(true);
        toast.success("Password reset successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 text-center bg-linear-to-r from-red-500 to-rose-600">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Invalid Link</h1>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-4">
                The password reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block px-6 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-medium shadow-lg shadow-indigo-200"
              >
                Request New Link
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 text-center bg-linear-to-r from-emerald-600 to-teal-600">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Password Reset!</h1>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-2">
                Your password has been successfully reset.
              </p>
              <p className="text-gray-500 text-sm">Redirecting to login...</p>
              <div className="mt-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
              <Link
                href="/login"
                className="mt-4 inline-block px-6 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-medium shadow-lg shadow-indigo-200"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-slate-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 text-center bg-linear-to-r from-indigo-600 to-purple-600">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-indigo-100 text-sm mt-1">
              Enter your new password
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition placeholder:text-gray-400"
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition placeholder:text-gray-400"
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
