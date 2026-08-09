"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email });
      if (response.data.success) {
        setSubmitted(true);
        toast.success("Password reset link sent to your email");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to send reset link. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B1528]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] bg-white rounded-3xl p-8 sm:p-10 shadow-2xl"
      >
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-2"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-500 text-sm mb-3">
              We've sent a password reset link to <strong className="text-gray-800">{email}</strong>
            </p>
            <p className="text-gray-400 text-xs mb-6">
              The link will expire in 1 hour. Please check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3.5 bg-[#1A60FF] hover:bg-blue-600 text-white rounded-xl transition font-semibold shadow-sm text-sm"
            >
              Return to Login
            </button>
          </motion.div>
        ) : (
          <>
            {/* Header with Lock Icon */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-100">
                <span className="text-2xl">🔒</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Reset Password
              </h1>
              <p className="text-gray-400 text-sm mt-1.5 font-normal max-w-[260px] mx-auto leading-relaxed">
                Enter your email and we'll send a reset link
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                  WORK EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#1A60FF] focus:ring-1 focus:ring-[#1A60FF] transition-all placeholder:text-gray-400"
                  placeholder="you@company.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="text-sm text-[#1A60FF] hover:underline font-normal inline-flex items-center gap-1 transition-colors"
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}