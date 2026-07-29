"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Mail,
  Lock,
  CheckSquare,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  AlertCircle,
  Users,
  Crown,
  Briefcase,
  User,
  Building2,
} from "lucide-react";
import { Button } from "@/components/UI/Button";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import Link from "next/link";

interface ActiveUser {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  role: string;
  employeeId: string;
  badge: string;
}

const ALLOWED_ROLES = [
  "super_admin",
  "admin",
  "hr_manager",
  "dept_manager",
  "project_manager",
  "employee",
];

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
    }>
  >([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 25 + 15,
      delay: Math.random() * 15,
      opacity: Math.random() * 0.1 + 0.03,
    }));
    setParticles(newParticles);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -50, -100, -50, 0],
            x: [0, 20, -10, 15, 0],
            opacity: [
              p.opacity,
              p.opacity * 1.5,
              p.opacity * 0.5,
              p.opacity * 1.5,
              p.opacity,
            ],
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

const GlowingOrbs = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-[5%] left-[5%] w-[35%] h-[35%] rounded-full bg-linear-to-r from-indigo-200/25 to-purple-200/25 blur-[100px]"
        animate={{
          x: [0, 30, -20, 15, 0],
          y: [0, -20, 30, -15, 0],
          scale: [1, 1.1, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] rounded-full bg-linear-to-r from-blue-200/20 to-cyan-200/20 blur-[100px]"
        animate={{
          x: [0, -20, 30, -15, 0],
          y: [0, 20, -30, 15, 0],
          scale: [1, 1.15, 0.85, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

const GridPattern = () => {
  return (
    <div
      className="absolute inset-0 opacity-[0.02] pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #4f46e5 1px, transparent 0)`,
        backgroundSize: "50px 50px",
      }}
    />
  );
};

const UserButton = memo(
  ({
    user,
    onClick,
    isActive,
    index,
  }: {
    user: ActiveUser;
    onClick: () => void;
    isActive: boolean;
    index: number;
  }) => {
    const getRoleGradient = (role: string) => {
      const gradients: Record<string, string> = {
        super_admin: "from-purple-600 to-pink-600",
        admin: "from-blue-600 to-cyan-600",
        hr_manager: "from-emerald-600 to-teal-600",
        dept_manager: "from-orange-600 to-red-600",
        project_manager: "from-cyan-600 to-blue-600",
        employee: "from-slate-600 to-slate-700",
      };
      return gradients[role] || "from-indigo-600 to-purple-600";
    };

    const getRoleIcon = (role: string) => {
      const icons: Record<string, React.ReactNode> = {
        super_admin: <Crown className="w-4 h-4 text-white" />,
        admin: <Shield className="w-4 h-4 text-white" />,
        hr_manager: <Users className="w-4 h-4 text-white" />,
        dept_manager: <Building2 className="w-4 h-4 text-white" />,
        project_manager: <Briefcase className="w-4 h-4 text-white" />,
        employee: <User className="w-4 h-4 text-white" />,
      };
      return icons[role] || <User className="w-4 h-4 text-white" />;
    };

    const getRoleDisplayName = (role: string) => {
      const names: Record<string, string> = {
        super_admin: "Super Admin",
        admin: "Admin",
        hr_manager: "HR Manager",
        dept_manager: "Dept Manager",
        project_manager: "Project Manager",
        employee: "Employee",
      };
      return names[role] || role;
    };

    const gradient = getRoleGradient(user.role);
    const icon = getRoleIcon(user.role);
    const displayRole = getRoleDisplayName(user.role);

    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={onClick}
        type="button"
        className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 p-3 ${
          isActive
            ? `bg-linear-to-r ${gradient} border-indigo-500/40 shadow-lg shadow-indigo-500/20 scale-[1.02]`
            : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 hover:scale-[1.01]"
        } border backdrop-blur-sm`}
      >
        <div
          className={`absolute inset-0 bg-linear-to-r ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        />
        <div className="relative flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-white transition-colors truncate">
              {user.fullName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-medium text-slate-600 group-hover:text-white/80 transition-colors">
                {displayRole}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-white/30" />
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-100/50 border border-slate-200 group-hover:bg-white/10 group-hover:border-white/20 text-slate-600 group-hover:text-white/80 transition-colors">
                {user.badge}
              </span>
            </div>
          </div>
          <ArrowRight
            className={`w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all ${
              isActive ? "text-indigo-400" : ""
            }`}
          />
        </div>
      </motion.button>
    );
  },
);

UserButton.displayName = "UserButton";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [mounted, setMounted] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeUser, setActiveUser] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchActiveUsers();
  }, []);

  const fetchActiveUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/auth/active-users");

      if (response.data?.success) {
        const users: ActiveUser[] = response.data.data || [];
        const filteredUsers = users.filter((user: ActiveUser) =>
          ALLOWED_ROLES.includes(user.role),
        );

        const rolePriority: Record<string, number> = {
          super_admin: 1,
          admin: 2,
          hr_manager: 3,
          dept_manager: 4,
          project_manager: 5,
          employee: 6,
        };

        filteredUsers.sort((a: ActiveUser, b: ActiveUser) => {
          return (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
        });

        setActiveUsers(filteredUsers);
      } else {
        console.error("Failed to fetch users:", response.data?.message);
        setActiveUsers([]);
      }
    } catch (error: any) {
      console.error(
        "Failed to fetch active users:",
        error?.response?.data?.message || error.message,
      );
      setActiveUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = useCallback((email: string) => {
    setFormData({ email, password: "Admin@123" });
    setActiveUser(email);
    setTimeout(() => setActiveUser(null), 400);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!formData.email || !formData.password) {
      setLoginError("Please enter both email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLoginError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 Calling login with:", formData.email);

      // Now this will be properly typed as User
      const userData = await login(formData.email, formData.password);

      console.log("✅ Login successful for:", userData?.email);
      console.log("👤 User data:", userData);

      const token = localStorage.getItem("token");
      console.log("🔑 Token after login:", token ? "YES" : "NO");

      if (token) {
        toast.success(`Welcome back, ${userData?.fullName || "User"}!`);
        router.push("/dashboard");
      } else {
        console.error("❌ No token found after login!");
        setLoginError(
          "Login succeeded but no token was stored. Please try again.",
        );
        toast.error(
          "Login succeeded but no token was stored. Please try again.",
        );
      }
    } catch (error: unknown) {
      console.error("❌ Login error in component:", error);

      let errorMessage = "Login failed. Please try again.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
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

  if (!mounted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100">
        <div className="relative z-10 w-full max-w-4xl">
          <div className="relative bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="flex flex-col items-center text-center p-8">
              <div className="relative">
                <div className="relative w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <CheckSquare className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="mt-4 text-2xl font-bold text-slate-800">
                Welcome Back
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Sign in to your workspace
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 p-8 pt-0">
              <div className="space-y-4">
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-12 bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl animate-pulse" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-slate-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100">
      <FloatingParticles />
      <GlowingOrbs />
      <GridPattern />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="relative bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left Column - Login Form */}
            <div className="p-8 lg:p-10">
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
                  <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-30" />
                  <div className="relative w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <CheckSquare className="w-7 h-7 text-white" />
                  </div>
                </motion.div>

                <motion.h1
                  className="mt-4 text-2xl font-bold text-slate-800"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    background:
                      "linear-gradient(135deg, #1e293b, #4f46e5, #7c3aed, #1e293b)",
                    backgroundSize: "300% 300%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Welcome Back
                </motion.h1>

                <p className="text-slate-500 text-sm mt-1">
                  Sign in to your workspace
                </p>
              </motion.div>

              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{loginError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider ml-0.5 mb-1.5">
                    Email Address
                  </label>
                  <motion.div
                    className={`relative transition-all duration-300 ${
                      isFocused.email ? "scale-[1.01]" : ""
                    }`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <Mail
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                        isFocused.email ? "text-indigo-600" : "text-slate-400"
                      }`}
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      onFocus={() =>
                        setIsFocused({ ...isFocused, email: true })
                      }
                      onBlur={() =>
                        setIsFocused({ ...isFocused, email: false })
                      }
                      className="w-full pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 bg-white/60 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition-all duration-300 focus:shadow-lg focus:shadow-indigo-100"
                      placeholder="name@company.com"
                      required
                      disabled={isSubmitting}
                    />
                  </motion.div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 ml-0.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <motion.div
                    className={`relative transition-all duration-300 ${
                      isFocused.password ? "scale-[1.01]" : ""
                    }`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <Lock
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                        isFocused.password
                          ? "text-indigo-600"
                          : "text-slate-400"
                      }`}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      onFocus={() =>
                        setIsFocused({ ...isFocused, password: true })
                      }
                      onBlur={() =>
                        setIsFocused({ ...isFocused, password: false })
                      }
                      className="w-full pl-11 pr-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 bg-white/60 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition-all duration-300 focus:shadow-lg focus:shadow-indigo-100"
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    loading={isLoading || isSubmitting}
                    disabled={isLoading || isSubmitting}
                    className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/70 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading || isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <LogIn size={16} />
                        Sign In
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex justify-center items-center gap-4 flex-wrap"
              >
                {[
                  { icon: Shield, label: "256-bit SSL" },
                  { icon: Zap, label: "Fast & Secure" },
                  { icon: Sparkles, label: "Premium" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100"
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "#f8fafc",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className="w-3 h-3 text-indigo-500" />
                    <span className="text-[10px] font-medium text-slate-600">
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Column - Quick Access */}
            <div className="relative bg-linear-to-br from-indigo-50/80 via-purple-50/80 to-pink-50/80 p-8 lg:p-10 border-l border-slate-200/50">
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />

              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-6"
                >
                  <div className="p-2 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Quick Access
                    </h2>
                    <p className="text-xs text-slate-500">
                      Click a user to auto-fill credentials
                    </p>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {loadingUsers && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-center py-8"
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span className="text-sm text-slate-400">
                          Loading users...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!loadingUsers && activeUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar pr-1"
                    >
                      {activeUsers.map((user, index) => (
                        <UserButton
                          key={user.id || user._id}
                          user={user}
                          onClick={() => handleUserSelect(user.email)}
                          isActive={activeUser === user.email}
                          index={index}
                        />
                      ))}

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 p-3 bg-slate-50/80 border border-slate-200 rounded-xl"
                      >
                        <p className="text-[10px] text-slate-500 text-center">
                          <span className="font-medium text-slate-600">
                            Demo:
                          </span>{" "}
                          Click any user to auto-fill. Password:{" "}
                          <span className="font-mono font-medium text-indigo-600">
                            Admin@123
                          </span>
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!loadingUsers && activeUsers.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8"
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">
                        No users available
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Please contact your administrator
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="border-t border-slate-200/50 px-8 py-3 text-center bg-white/50"
          >
            <p className="text-[10px] text-slate-400">
              © {new Date().getFullYear()} TaskManager. All rights reserved.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}
