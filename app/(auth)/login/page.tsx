"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!formData.email || !formData.password) {
      setLoginError("Please enter both email and password");
      return;
    }

    if (!validateEmail(formData.email)) {
      setLoginError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const userData = await login(formData.email, formData.password);
      const token = localStorage.getItem("token");

      if (token) {
        toast.success(`Welcome back, ${userData?.fullName || "User"}!`);
        router.push("/dashboard");
      } else {
        setLoginError("Login succeeded but no token was stored. Please try again.");
        toast.error("Login succeeded but no token was stored. Please try again.");
      }
    } catch (error: unknown) {
      let errorMessage = "Please enter a valid password";
      // let errorMessage = "Invalid Credential";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      }

      setLoginError(errorMessage);
      toast.error(errorMessage);
      setFormData((prev) => ({ ...prev, password: "" }));
    } finally {
      setIsSubmitting(false);
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
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Task<span className="text-[#1A60FF]">Flow</span> Pro
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 font-normal">
            Sign in to your workspace
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {loginError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{loginError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Work Email */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
              WORK EMAIL
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#1A60FF] focus:ring-1 focus:ring-[#1A60FF] transition-all"
              placeholder="tanvir@ngenitltd.com"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-4 pr-10 py-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#1A60FF] focus:ring-1 focus:ring-[#1A60FF] transition-all"
                placeholder="••••••••••"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#1A60FF] focus:ring-[#1A60FF] accent-[#1A60FF] cursor-pointer"
              />
              <span className="text-sm text-gray-500 font-normal">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#1A60FF] hover:underline font-normal transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        {/* Footer Text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 leading-relaxed max-w-[220px] mx-auto">
            Don't have an account? Contact your admin.
          </p>
        </div>
      </motion.div>
    </div>
  );
}