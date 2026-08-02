"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Mail,
  Lock,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

// ============================================================
// FLOATING PARTICLES - INFINITE LOOP
// ============================================================
const FloatingParticles = () => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      size: number;
      x: number;
      y: number;
      duration: number;
      delay: number;
      opacity: number;
      driftX: number;
      driftY: number;
    }>
  >([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      size: Math.random() * 5 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 25 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.2 + 0.1,
      driftX: (Math.random() - 0.5) * 60,
      driftY: (Math.random() - 0.5) * 60,
    }));
    setParticles(newParticles);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400/30"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            x: [0, p.driftX, -p.driftX * 0.5, p.driftX * 0.3, 0],
            y: [0, p.driftY, -p.driftY * 0.5, p.driftY * 0.3, 0],
            opacity: [
              p.opacity,
              p.opacity * 2,
              p.opacity * 0.3,
              p.opacity * 1.5,
              p.opacity,
            ],
            scale: [1, 1.3, 0.7, 1.1, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ============================================================
// GLOWING ORBS - INFINITE LOOP
// ============================================================
const GlowingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 blur-[120px]"
        animate={{
          x: [0, 50, -30, 20, 0],
          y: [0, -30, 40, -20, 0],
          scale: [1, 1.2, 0.8, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-[120px]"
        animate={{
          x: [0, -40, 30, -20, 0],
          y: [0, 30, -40, 20, 0],
          scale: [1, 1.3, 0.7, 1.2, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-[100px]"
        animate={{
          x: [0, 60, -40, 30, 0],
          y: [0, -40, 30, -20, 0],
          scale: [1, 0.8, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

// ============================================================
// GRID PATTERN
// ============================================================
const GridPattern = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #1e40af 1px, transparent 0)`,
        backgroundSize: "40px 40px",
      }}
    />
  );
};

// ============================================================
// MAIN LOGIN PAGE
// ============================================================
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [emailValid, setEmailValid] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  useEffect(() => {
    if (formData.email) {
      setEmailValid(validateEmail(formData.email));
    } else {
      setEmailValid(false);
    }
  }, [formData.email]);

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
      let errorMessage = "Login failed. Please try again.";

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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <FloatingParticles />
      <GlowingOrbs />
      <GridPattern />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-cyan-500/30 pointer-events-none" />

          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative p-8">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center text-center mb-8"
            >
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur-lg opacity-30" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </motion.div>

              <motion.h1
                className="mt-4 text-2xl font-bold text-white"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  background: "linear-gradient(135deg, #60a5fa, #818cf8, #34d399, #60a5fa)",
                  backgroundSize: "300% 300%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Welcome Back
              </motion.h1>

              <p className="text-blue-300/70 text-sm mt-1">
                Sign in to your workspace to continue
              </p>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{loginError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-blue-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
                  Email Address
                </label>
                <motion.div
                  className={`relative transition-all duration-300 ${isFocused.email ? "scale-[1.01]" : ""}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <Mail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isFocused.email ? "text-blue-400" : "text-blue-400/40"
                      }`}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setIsFocused({ ...isFocused, email: true })}
                    onBlur={() => setIsFocused({ ...isFocused, email: false })}
                    className="w-full pl-11 pr-11 py-3 text-sm text-white placeholder:text-blue-300/30 bg-white/5 border border-blue-400/20 focus:border-blue-400 rounded-xl outline-none transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10"
                    placeholder="name@company.com"
                    required
                    disabled={isSubmitting}
                  />
                  {formData.email && emailValid && (
                    <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  )}
                </motion.div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1.5 ml-0.5">
                  <label className="text-xs font-semibold text-blue-300/80 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <motion.div
                  className={`relative transition-all duration-300 ${isFocused.password ? "scale-[1.01]" : ""}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isFocused.password ? "text-blue-400" : "text-blue-400/40"
                      }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setIsFocused({ ...isFocused, password: true })}
                    onBlur={() => setIsFocused({ ...isFocused, password: false })}
                    className="w-full pl-11 pr-11 py-3 text-sm text-white placeholder:text-blue-300/30 bg-white/5 border border-blue-400/20 focus:border-blue-400 rounded-xl outline-none transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10"
                    placeholder="••••••••"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400/40 hover:text-blue-300 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-2"
              >
                <button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      Sign In
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            </motion.form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-transparent text-blue-300/40">or</span>
              </div>
            </div>

            {/* Create Account Section - IMPROVED */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center space-y-3"
            >
              <p className="text-sm text-blue-300/60">
                Don't have an account?
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-400/30 hover:border-emerald-400/50 text-white font-medium rounded-xl transition-all duration-300 group"
                >
                  <UserPlus size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Create New Account</span>
                  <ChevronRight size={16} className="text-emerald-400/60 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Footer Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex justify-center items-center gap-3 flex-wrap"
            >
              {[
                { icon: Shield, label: "256-bit SSL" },
                { icon: Zap, label: "Fast & Secure" },
                { icon: Sparkles, label: "Premium" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(255,255,255,0.1)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-medium text-blue-300/60">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 pt-4 border-t border-white/5 text-center"
            >
              <p className="text-[10px] text-blue-300/30">
                © {new Date().getFullYear()} TaskManager. All rights reserved.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}