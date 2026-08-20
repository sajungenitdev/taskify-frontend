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

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { width: "0%", color: "bg-gray-200", text: "", textColor: "text-gray-400" };
    if (pass.length < 6) return { width: "33%", color: "bg-red-500", text: "Weak", textColor: "text-red-500" };
    if (pass.length < 10) return { width: "66%", color: "bg-amber-500", text: "Medium", textColor: "text-amber-500" };
    return { width: "100%", color: "bg-emerald-500", text: "Strong ✓", textColor: "text-emerald-500" };
  };

  const strength = getPasswordStrength(password);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0d1b2a] p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-500 text-sm mb-6">
              The password reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white font-medium rounded-xl transition shadow-lg shadow-emerald-200 text-center"
            >
              Request New Link
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1b2a] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
            <p className="text-gray-500 text-sm mb-1">
              Your password has been successfully reset.
            </p>
            <p className="text-gray-400 text-xs mb-6">Redirecting to login...</p>
            <div className="flex items-center justify-center mb-6">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
            <Link
              href="/login"
              className="inline-block w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white font-medium rounded-xl transition shadow-lg shadow-emerald-200 text-center"
            >
              Go to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b2a] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[32px] shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            {/* <div className="text-4xl mb-3">🔑</div> */}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              New Password
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Create a strong new password
            </p>
          </div>

          {/* Form */}
          <div>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-2xl focus:border-gray-400 focus:outline-none transition placeholder:text-gray-300"
                    placeholder="••••••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2.5">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${strength.textColor}`}>
                      {strength.text}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-2xl focus:border-gray-400 focus:outline-none transition placeholder:text-gray-300"
                    placeholder="••••••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
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
                className="w-full mt-2 py-4 bg-[#10b981] hover:bg-[#059669] text-white font-semibold rounded-2xl transition shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting New Password...
                  </>
                ) : (
                  "Set New Password"
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-gray-600 transition inline-flex items-center gap-1 font-medium"
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