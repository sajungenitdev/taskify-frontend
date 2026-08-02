// app/not-found.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
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
    RefreshCw,
    HelpCircle,
    Mail,
    Phone,
    MessageCircle,
    Code,
    ChevronRight,
    Globe,
    Zap,
    Star,
    Moon,
    Sun,
    Cloud,
    CloudLightning,
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa";

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

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    color: string;
}

// ============================================================
// ANIMATED BACKGROUND PARTICLES
// ============================================================
const FloatingParticles = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Create particles
        const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#F59E0B", "#10B981"];
        const particles: Particle[] = [];
        for (let i = 0; i < 80; i++) {
            particles.push({
                id: i,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 4 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }
        particlesRef.current = particles;

        let mouseX = -1000;
        let mouseY = -1000;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        window.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections
            for (let i = 0; i < particlesRef.current.length; i++) {
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const p1 = particlesRef.current[i];
                    const p2 = particlesRef.current[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - distance / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // Update and draw particles
            for (const particle of particlesRef.current) {
                // Move towards mouse
                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200) {
                    particle.x += dx * 0.01;
                    particle.y += dy * 0.01;
                }

                // Random movement
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

                // Draw particle with glow
                const gradient = ctx.createRadialGradient(
                    particle.x,
                    particle.y,
                    0,
                    particle.x,
                    particle.y,
                    particle.size * 3
                );
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, "transparent");

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.opacity;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
        />
    );
};

// ============================================================
// FLOATING SHAPES
// ============================================================
const FloatingShapes = () => {
    const shapes = [
        { icon: Star, delay: 0, duration: 15, x: "10%", y: "20%" },
        { icon: Zap, delay: 2, duration: 18, x: "85%", y: "15%" },
        { icon: Cloud, delay: 4, duration: 20, x: "5%", y: "70%" },
        { icon: CloudLightning, delay: 6, duration: 16, x: "90%", y: "75%" },
        { icon: Rocket, delay: 8, duration: 22, x: "50%", y: "5%" },
        { icon: Compass, delay: 10, duration: 19, x: "75%", y: "85%" },
    ];

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {shapes.map((shape, index) => {
                const Icon = shape.icon;
                return (
                    <div
                        key={index}
                        className="absolute text-blue-400/20 dark:text-blue-300/10"
                        style={{
                            left: shape.x,
                            top: shape.y,
                            animation: `floatShape ${shape.duration}s ease-in-out infinite`,
                            animationDelay: `${shape.delay}s`,
                        }}
                    >
                        <Icon className="w-12 h-12 md:w-16 md:h-16" />
                    </div>
                );
            })}
            <style jsx>{`
        @keyframes floatShape {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          25% {
            transform: translate(30px, -40px) rotate(10deg) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) rotate(-5deg) scale(0.9);
          }
          75% {
            transform: translate(40px, 30px) rotate(7deg) scale(1.05);
          }
        }
      `}</style>
        </div>
    );
};

// ============================================================
// ANIMATED 404 ICON
// ============================================================
const Animated404Icon = () => {
    return (
        <div className="relative inline-flex items-center justify-center">
            {/* Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-4 border-blue-500/20 animate-ping-slow"></div>
                <div className="absolute w-56 h-56 rounded-full border-4 border-purple-500/15 animate-ping-slower"></div>
                <div className="absolute w-64 h-64 rounded-full border-4 border-pink-500/10 animate-ping-slowest"></div>
            </div>

            {/* Rotating gradient ring */}
            <svg className="absolute w-52 h-52 animate-spin-slow" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#ringGradient)"
                    strokeWidth="2"
                    strokeDasharray="70 100"
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6">
                            <animate attributeName="stop-color" values="#3B82F6;#8B5CF6;#EC4899;#3B82F6" dur="6s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="50%" stopColor="#8B5CF6">
                            <animate attributeName="stop-color" values="#8B5CF6;#EC4899;#3B82F6;#8B5CF6" dur="6s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#EC4899">
                            <animate attributeName="stop-color" values="#EC4899;#3B82F6;#8B5CF6;#EC4899" dur="6s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                </defs>
            </svg>

            {/* Floating icons */}
            <div className="absolute -top-10 -right-10 animate-float-slow">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl shadow-lg backdrop-blur-sm border border-blue-200 dark:border-blue-800">
                    <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            <div className="absolute -bottom-10 -left-10 animate-float-delayed">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-2xl shadow-lg backdrop-blur-sm border border-purple-200 dark:border-purple-800">
                    <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
            <div className="absolute -top-8 -left-12 animate-float-slower">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-2xl shadow-lg backdrop-blur-sm border border-pink-200 dark:border-pink-800">
                    <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                </div>
            </div>
            <div className="absolute -bottom-8 -right-12 animate-float-faster">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-2xl shadow-lg backdrop-blur-sm border border-green-200 dark:border-green-800">
                    <Rocket className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
            </div>

            {/* Main icon */}
            <div className="relative z-10">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                    <div className="relative">
                        <Shield className="w-24 h-24 text-blue-600 dark:text-blue-400 animate-float-gentle" />
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg animate-bounce-subtle">
                            404
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes ping-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        @keyframes ping-slower {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.3; }
        }
        @keyframes ping-slowest {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(8px, -12px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-10px, 10px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(6px, -8px); }
        }
        @keyframes float-faster {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-6px, 6px); }
        }
        .animate-ping-slow {
          animation: ping-slow 3s ease-in-out infinite;
        }
        .animate-ping-slower {
          animation: ping-slower 4s ease-in-out infinite;
        }
        .animate-ping-slowest {
          animation: ping-slowest 5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-float-gentle {
          animation: float-gentle 3s ease-in-out infinite;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
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
      `}</style>
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
            <FloatingShapes />

            {/* Gradient Orbs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 dark:bg-blue-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-500 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div
                    className="max-w-4xl w-full transition-transform duration-300 ease-out"
                    style={{
                        transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`,
                    }}
                >
                    <div className="text-center">
                        {/* Animated 404 Icon */}
                        <div className="mb-10 flex justify-center">
                            <Animated404Icon />
                        </div>

                        {/* Error Title */}
                        <div className="space-y-3 mb-6">
                            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                                Page Not Found
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Oops! The page you're looking for seems to have wandered off into the digital wilderness.
                            </p>
                        </div>

                        {/* Error Code Badge */}
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium mb-8 animate-pulse-slow border border-red-200 dark:border-red-800">
                            <AlertCircle className="w-4 h-4" />
                            Error 404 - Resource Not Found
                        </div>

                        {/* Search Bar */}
                        {/* <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search for what you're looking for..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-5 py-3.5 pl-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 shadow-lg hover:shadow-xl dark:text-white"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 hover:scale-105"
                                >
                                    {isSearching ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Search"
                                    )}
                                </button>
                            </div>
                        </form> */}

                        {/* Quick Actions */}
                        <div className="flex flex-wrap justify-center gap-3 mb-10">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.action || (() => router.push(action.href!))}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 text-gray-700 dark:text-gray-300 group"
                                >
                                    <action.icon className={`w-4 h-4 text-${action.color}-500 transition-transform group-hover:scale-110`} />
                                    <span className="text-sm font-medium">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Suggestions Grid */}
                        <div className="mb-10">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Here are some places you might want to go:
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {suggestions.map((suggestion, index) => {
                                    const Icon = suggestion.icon;
                                    const bgColorMap: Record<string, string> = {
                                        blue: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
                                        green: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
                                        purple: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
                                        orange: "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30",
                                        gray: "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700",
                                        pink: "bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30",
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
                                            className="group p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 text-left"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2.5 rounded-xl ${bgColorMap[suggestion.color]} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
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
                                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>Need help?</span>
                                <div className="flex items-center gap-3">
                                    <a
                                        href="mailto:support@taskmanager.com"
                                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                                    >
                                        <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        support@taskmanager.com
                                    </a>
                                    <span className="hidden sm:inline">•</span>
                                    <a
                                        href="tel:+1234567890"
                                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                                    >
                                        <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        +1 (555) 000-0000
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                                        <FaTwitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    </a>
                                    <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                                        <FaGithub className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    </a>
                                    <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                                        <FaLinkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    </a>
                                    <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                                        <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
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

            {/* Global styles */}
            <style jsx global>{`
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
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
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
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default NotFoundPage;