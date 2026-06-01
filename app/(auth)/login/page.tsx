"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  ArrowRight,
  Loader2,
  Users,
  Shield,
  Briefcase,
  CheckCircle2,
  Zap,
  Fingerprint,
  Mail,
  Lock,
  CheckSquare,
  User,
  Crown,
  Star,
  Orbit,
} from "lucide-react";
import { Button } from "@/components/UI/Button";
import api from "@/lib/axios";

interface DemoUser {
  role: string;
  email: string;
  name: string;
  badge: string;
  icon: React.ReactNode;
  gradient: string;
}

const DemoUserButton = memo(
  ({
    user,
    onClick,
    isActive,
  }: {
    user: DemoUser;
    onClick: () => void;
    isActive: boolean;
  }) => {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
          isActive
            ? `bg-gradient-to-r ${user.gradient} border-indigo-500/40 shadow-lg shadow-indigo-500/20 scale-[1.02]`
            : "bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 hover:scale-[1.01]"
        } border backdrop-blur-sm`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${user.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        />

        <div className="relative px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-lg bg-gradient-to-br ${user.gradient} flex items-center justify-center shadow-md`}
            >
              {user.icon}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-200 group-hover:text-white transition-colors tracking-wide">
                {user.role}
              </p>
              <p className="text-[9px] text-slate-500 font-medium">
                {user.name.split(" ")[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-slate-800/60 border border-slate-700 text-slate-300">
              {user.badge}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </button>
    );
  },
);

DemoUserButton.displayName = "DemoUserButton";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(true);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    const fetchDemoUsers = async () => {
      try {
        const response = await api.get("/auth/demo-users");
        if (response.data.success && response.data.data.length > 0) {
          setDemoUsers(
            response.data.data.slice(0, 5).map((user: any) => ({
              ...user,
              icon: getRoleIcon(user.role),
              gradient: getRoleGradient(user.role),
            })),
          );
        } else {
          throw new Error("No users found");
        }
      } catch (error) {
        setDemoUsers([
          {
            role: "SUPER ADMIN",
            email: "superadmin@taskmanager.com",
            name: "Super Admin",
            badge: "Full",
            icon: <Crown className="w-3 h-3 text-white" />,
            gradient: "from-purple-600 to-pink-600",
          },
          {
            role: "ADMIN",
            email: "admin@taskmanager.com",
            name: "Admin",
            badge: "Mgmt",
            icon: <Shield className="w-3 h-3 text-white" />,
            gradient: "from-blue-600 to-cyan-600",
          },
          {
            role: "HR MANAGER",
            email: "hr@taskmanager.com",
            name: "HR Manager",
            badge: "HR",
            icon: <Users className="w-3 h-3 text-white" />,
            gradient: "from-emerald-600 to-teal-600",
          },
          {
            role: "DEPT MANAGER",
            email: "manager@taskmanager.com",
            name: "Dept Mgr",
            badge: "Lead",
            icon: <Briefcase className="w-3 h-3 text-white" />,
            gradient: "from-orange-600 to-red-600",
          },
          {
            role: "EMPLOYEE",
            email: "employee1@taskmanager.com",
            name: "Employee",
            badge: "Staff",
            icon: <User className="w-3 h-3 text-white" />,
            gradient: "from-indigo-600 to-purple-600",
          },
        ]);
      } finally {
        setLoadingDemo(false);
      }
    };
    fetchDemoUsers();
  }, []);

  const getRoleIcon = (role: string) => {
    if (role.includes("SUPER")) return <Crown className="w-3 h-3 text-white" />;
    if (role.includes("ADMIN"))
      return <Shield className="w-3 h-3 text-white" />;
    if (role.includes("HR")) return <Users className="w-3 h-3 text-white" />;
    if (role.includes("MANAGER"))
      return <Briefcase className="w-3 h-3 text-white" />;
    return <User className="w-3 h-3 text-white" />;
  };

  const getRoleGradient = (role: string) => {
    if (role.includes("SUPER")) return "from-purple-600 to-pink-600";
    if (role.includes("ADMIN")) return "from-blue-600 to-cyan-600";
    if (role.includes("HR")) return "from-emerald-600 to-teal-600";
    if (role.includes("MANAGER")) return "from-orange-600 to-red-600";
    return "from-indigo-600 to-purple-600";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    try {
      await login(formData.email, formData.password);
      router.push("/dashboard");
    } catch (error) {
      // Error handled in auth context
    }
  };

  const handleQuickFill = useCallback((email: string) => {
    setFormData({ email, password: "Admin@123" });
    setActiveDemo(email);
    setTimeout(() => setActiveDemo(null), 400);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[35%] h-[35%] rounded-full bg-gradient-to-r from-indigo-600/15 to-purple-600/15 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-[15%] right-[5%] w-[30%] h-[30%] rounded-full bg-gradient-to-r from-blue-600/15 to-cyan-600/15 blur-[120px] animate-float-slow delay-2000" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-gradient-to-r from-emerald-600/8 to-teal-600/8 blur-[140px] animate-pulse-slow" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Animated Scan Lines */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent animate-slide" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent animate-slide delay-1000" />
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-indigo-400/30 rounded-full animate-float-particle"
            style={{
              top: `${10 + i * 7}%`,
              left: `${5 + i * 8}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[400px] animate-fade-in-up">
        {/* Glass Card */}
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6">
          {/* Logo Section */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-md opacity-50 animate-pulse-glow" />
              <div className="relative w-11 h-11 bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-xl flex items-center justify-center shadow-xl">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <h1 className="mt-3 text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Sign in to your workspace
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-0.5 mb-1">
                Email
              </label>
              <div
                className={`relative transition-all duration-200 ${isFocused.email ? "scale-[1.01]" : ""}`}
              >
                <Mail
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${isFocused.email ? "text-indigo-400" : "text-slate-500"}`}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  onFocus={() => setIsFocused({ ...isFocused, email: true })}
                  onBlur={() => setIsFocused({ ...isFocused, email: false })}
                  className="w-full pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 bg-slate-900/40 border border-slate-700 focus:border-indigo-500 rounded-lg outline-none transition-all duration-200"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1 ml-0.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div
                className={`relative transition-all duration-200 ${isFocused.password ? "scale-[1.01]" : ""}`}
              >
                <Lock
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors duration-200 ${isFocused.password ? "text-indigo-400" : "text-slate-500"}`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  onFocus={() => setIsFocused({ ...isFocused, password: true })}
                  onBlur={() => setIsFocused({ ...isFocused, password: false })}
                  className="w-full pl-9 pr-9 py-2 text-sm text-white placeholder:text-slate-500 bg-slate-900/40 border border-slate-700 focus:border-indigo-500 rounded-lg outline-none transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs py-2 rounded-lg transition-all shadow-lg shadow-indigo-600/20 mt-2 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <LogIn size={13} />
                  Sign In
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                Demo Access
              </span>
            </div>
          </div>

          {/* Demo Users Grid - Compact */}
          {loadingDemo ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {demoUsers.map((user) => (
                <DemoUserButton
                  key={user.email}
                  user={user}
                  onClick={() => handleQuickFill(user.email)}
                  isActive={activeDemo === user.email}
                />
              ))}
            </div>
          )}

          {/* Security Footer */}
          <div className="mt-5 pt-3 border-t border-slate-800/50 text-center">
            <p className="text-[9px] text-slate-500 font-medium inline-flex items-center justify-center gap-1.5 flex-wrap">
              <Fingerprint className="w-2.5 h-2.5" />
              Secure
              <span className="w-0.5 h-0.5 rounded-full bg-slate-600" />
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500/70" />
              AES-256
              <span className="w-0.5 h-0.5 rounded-full bg-slate-600" />
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              99.99% Uptime
            </p>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/20 backdrop-blur-sm border border-slate-800">
            <Star className="w-2.5 h-2.5 text-yellow-500/80" />
            <span className="text-[9px] font-medium text-slate-400">
              Trusted by 500+ enterprises
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-15px) translateX(8px);
          }
          66% {
            transform: translateY(8px) translateX(-8px);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes slide {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        @keyframes float-particle {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-60px) translateX(15px);
            opacity: 0;
          }
        }

        .animate-fade-in-up {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-slide {
          animation: slide 6s ease-in-out infinite;
        }

        .animate-float-particle {
          animation: float-particle 5s ease-in-out infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
