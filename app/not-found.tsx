// app/not-found.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Home,
  ArrowLeft,
  Search,
  Settings,
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  Clock,
  AlertCircle,
  Rocket,
  Sparkles,
  Compass,
  Zap,
  RefreshCw,
  ArrowRight,
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  Twitter,
  Github,
  Linkedin,
  ChevronRight,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface Suggestion {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
}

// ============================================================
// ANIMATED BACKGROUND PARTICLES
// ============================================================
const FloatingParticles = () => {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; speed: number; opacity: number; delay: number }>
  >([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.3 + 0.1,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-blue-400/30 dark:bg-blue-300/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animation: `float-${particle.id} ${20 + particle.speed * 10}s infinite ease-in-out`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        ${particles.map(
          (p) => `
          @keyframes float-${p.id} {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            25% {
              transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(1.2);
            }
            50% {
              transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(0.8);
            }
            75% {
              transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(1.1);
            }
          }
        `
        )}
      `}</style>
    </div>
  );
};

// ============================================================
// ANIMATED ICON
// ============================================================
const AnimatedNotFoundIcon = () => {
  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glowing background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
      
      {/* Main icon container */}
      <div className="relative">
        {/* Rotating ring */}
        <svg className="absolute inset-0 w-48 h-48 animate-spin-slow" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeDasharray="70 100"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating icons around */}
        <div className="absolute -top-8 -right-8 animate-float-slow">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl shadow-lg">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="absolute -bottom-8 -left-8 animate-float-delayed">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl shadow-lg">
            <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="absolute -top-6 -left-10 animate-float-slower">
          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl shadow-lg">
            <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
        </div>
        <div className="absolute -bottom-6 -right-10 animate-float-faster">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-lg">
            <Rocket className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Main 404 icon */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-10 blur-2xl animate-pulse" />
          <div className="relative z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="relative">
              <Shield className="w-20 h-20 text-blue-600 dark:text-blue-400 animate-bounce-slow" />
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg animate-pulse">
                404
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const NotFoundPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const suggestions: Suggestion[] = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      description: "Go back to your dashboard",
      href: "/dashboard",
      color: "blue",
    },
    {
      icon: CheckSquare,
      title: "Tasks",
      description: "View your tasks",
      href: "/tasks",
      color: "green",
    },
    {
      icon: Users,
      title: "Team",
      description: "Manage your team members",
      href: "/team",
      color: "purple",
    },
    {
      icon: Calendar,
      title: "Calendar",
      description: "Check your schedule",
      href: "/calendar",
      color: "orange",
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Configure your preferences",
      href: "/settings",
      color: "gray",
    },
    {
      icon: Clock,
      title: "Activity",
      description: "View recent activity",
      href: "/activity",
      color: "pink",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Simulate search
      setTimeout(() => {
        setIsSearching(false);
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }, 1000);
    }
  };

  const quickActions = [
    { icon: Home, label: "Home", href: "/", color: "blue" },
    { icon: ArrowLeft, label: "Go Back", action: () => router.back(), color: "gray" },
    { icon: RefreshCw, label: "Reload", action: () => window.location.reload(), color: "green" },
    { icon: HelpCircle, label: "Help", href: "/help", color: "purple" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden relative">
      {/* Animated Background */}
      <FloatingParticles />

      {/* Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 dark:bg-blue-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div
          className="max-w-5xl w-full transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`,
          }}
        >
          <div className="text-center">
            {/* Animated 404 Icon */}
            <div className="mb-8 flex justify-center">
              <AnimatedNotFoundIcon />
            </div>

            {/* Error Title */}
            <div className="space-y-3 mb-6">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                Page Not Found
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Oops! The page you're looking for seems to have wandered off into the digital wilderness.
              </p>
            </div>

            {/* Error Code Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium mb-8 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              Error 404 - Resource Not Found
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search for what you're looking for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3.5 pl-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-300 shadow-sm hover:shadow-md dark:text-white"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action || (() => router.push(action.href!))}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-105 text-gray-700 dark:text-gray-300 group"
                >
                  <action.icon className={`w-4 h-4 text-${action.color}-500`} />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Suggestions Grid */}
            <div className="mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Here are some places you might want to go:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  const colorMap: Record<string, string> = {
                    blue: "from-blue-500 to-blue-600",
                    green: "from-green-500 to-green-600",
                    purple: "from-purple-500 to-purple-600",
                    orange: "from-orange-500 to-orange-600",
                    gray: "from-gray-500 to-gray-600",
                    pink: "from-pink-500 to-pink-600",
                  };
                  const bgColorMap: Record<string, string> = {
                    blue: "bg-blue-50 dark:bg-blue-900/20",
                    green: "bg-green-50 dark:bg-green-900/20",
                    purple: "bg-purple-50 dark:bg-purple-900/20",
                    orange: "bg-orange-50 dark:bg-orange-900/20",
                    gray: "bg-gray-50 dark:bg-gray-800",
                    pink: "bg-pink-50 dark:bg-pink-900/20",
                  };
                  const iconColorMap: Record<string, string> = {
                    blue: "text-blue-600 dark:text-blue-400",
                    green: "text-green-600 dark:text-green-400",
                    purple: "text-purple-600 dark:text-purple-400",
                    orange: "text-orange-600 dark:text-orange-400",
                    gray: "text-gray-600 dark:text-gray-400",
                    pink: "text-pink-600 dark:text-pink-400",
                  };

                  return (
                    <Link
                      key={index}
                      href={suggestion.href}
                      className="group p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${bgColorMap[suggestion.color]} transition-colors group-hover:scale-110`}>
                          <Icon className={`w-5 h-5 ${iconColorMap[suggestion.color]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {suggestion.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {suggestion.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer with Contact */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Need help?</span>
                <div className="flex items-center gap-3">
                  <a
                    href="mailto:support@taskmanager.com"
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    support@taskmanager.com
                  </a>
                  <span className="hidden sm:inline">•</span>
                  <a
                    href="tel:+1234567890"
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    +1 (555) 000-0000
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                © {new Date().getFullYear()} Task Management System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-faster {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 8s ease-in-out infinite;
        }
        .animate-float-faster {
          animation: float-faster 5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in-zoom {
          animation: zoom-in 0.3s ease-out;
        }
        .slide-in-top {
          animation: slideInTop 0.3s ease-out;
        }
        @keyframes slideInTop {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;