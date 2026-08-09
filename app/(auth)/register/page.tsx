// app/(auth)/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Building2,
  Briefcase,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Rocket,
  Gift,
  Timer,
  Crown,
  Star,
  TrendingUp,
  Zap,
  Sparkles,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/axios";

interface PricingPlan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isPopular: boolean;
  isActive: boolean;
  planType: "individual" | "team";
  billingCycle: "monthly" | "quarterly" | "semiannual" | "yearly" | "one-time";
  price: number;
  currency: string;
  discount: number;
  originalPrice: number;
  features: string[];
  limits: {
    users: number;
    projects: number;
    tasks: number;
    storage: number;
    teamMembers: number;
  };
  trialDays: number;
  badge: string;
  color: string;
  order: number;
  isOneTime: boolean;
  contactSales: boolean;
}

type Step = "user-type" | "pricing" | "details";

const getPlanEnumValue = (planName: string): string => {
  const normalized = planName.toLowerCase().trim();
  const PLAN_ENUM_MAP: Record<string, string> = {
    'individual': 'individual',
    'team': 'team',
    'pro': 'pro',
    'enterprise': 'enterprise',
    'starter': 'individual',
    'professional': 'team',
    'business': 'pro',
  };

  if (PLAN_ENUM_MAP[normalized]) {
    return PLAN_ENUM_MAP[normalized];
  }

  for (const [key, value] of Object.entries(PLAN_ENUM_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return 'individual';
};

// Floating Particles Component
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
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
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
          className="absolute rounded-full bg-emerald-400/30"
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

// Glowing Orbs Component
const GlowingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-linear-to-r from-emerald-500/10 to-teal-500/10 blur-[120px]"
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
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-linear-to-r from-cyan-500/10 to-emerald-500/10 blur-[120px]"
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
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>("user-type");
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "semiannual" | "yearly">("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userType, setUserType] = useState<"individual" | "team">("individual");
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    jobTitle: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch pricing plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      setFetchError(null);
      const response = await api.get("/pricing-plans");

      if (response.data.success) {
        const fetchedPlans = response.data.data || [];
        console.log("📋 Fetched plans:", fetchedPlans);
        setPlans(fetchedPlans);

        // Only auto-select a plan if we haven't already done so
        if (!hasAutoSelected && currentStep === "user-type") {
          // Try to find an Individual plan first
          let activePlan = fetchedPlans.find((p: PricingPlan) => p.isActive && p.planType === "individual");
          if (!activePlan) {
            // If no Individual plan, try any active plan
            activePlan = fetchedPlans.find((p: PricingPlan) => p.isActive);
          }
          if (activePlan) {
            setSelectedPlan(activePlan);
            setUserType(activePlan.planType || "individual");
            setHasAutoSelected(true);
          } else if (fetchedPlans.length > 0) {
            setSelectedPlan(fetchedPlans[0]);
            setUserType(fetchedPlans[0].planType || "individual");
            setHasAutoSelected(true);
          }
        }
      } else {
        setFetchError("Failed to load pricing plans");
      }
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      setFetchError(error.response?.data?.message || "Failed to load pricing plans");
      toast.error("Failed to load pricing plans");
    } finally {
      setLoadingPlans(false);
    }
  };

  const validateStep = () => {
    if (currentStep === "details") {
      const newErrors: Record<string, string> = {};

      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required";
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email address";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.phone)) {
        newErrors.phone = "Invalid phone number";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!agreeTerms) {
        newErrors.terms = "You must agree to the terms";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === "user-type") {
      setCurrentStep("pricing");
    } else if (currentStep === "pricing") {
      if (!selectedPlan) {
        toast.error("Please select a plan");
        return;
      }
      setCurrentStep("details");
    }
  };

  const handlePrevStep = () => {
    if (currentStep === "pricing") {
      setCurrentStep("user-type");
    } else if (currentStep === "details") {
      setCurrentStep("pricing");
    }
  };

  const getRole = (type: "individual" | "team"): string => {
    if (type === "team") {
      return "admin";
    }
    return "employee";
  };

  // app/(auth)/register/page.tsx - Updated handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError(null);

    if (!validateStep()) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    try {
      setIsSubmitting(true);

      let finalPrice = selectedPlan.price;
      let discountPercentage = 0;

      if (billingCycle === "quarterly") {
        discountPercentage = 10;
        finalPrice = selectedPlan.price * 3 * 0.9;
      } else if (billingCycle === "semiannual") {
        discountPercentage = 15;
        finalPrice = selectedPlan.price * 6 * 0.85;
      } else if (billingCycle === "yearly") {
        discountPercentage = 20;
        finalPrice = selectedPlan.price * 12 * 0.8;
      }

      const planEnum = getPlanEnumValue(selectedPlan.slug || selectedPlan.name);
      const role = getRole(userType);

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        companyName: formData.companyName?.trim() || (userType === "team" ? "Team Organization" : "Individual User"),
        jobTitle: formData.jobTitle?.trim() || (userType === "team" ? "Team Member" : "User"),
        role: role,
        userType: userType,
        plan: planEnum,
        planName: selectedPlan.name,
        billingCycle,
        price: Math.round(finalPrice),
        currency: selectedPlan.currency || "BDT",
        period: billingCycle,
        trialDays: selectedPlan.trialDays || 7,
        discountPercentage,
        teamName: userType === "team" ? formData.companyName?.trim() || "Team" : undefined,
      };

      console.log("📝 Registration payload:", payload);
      console.log("🔑 Email being sent:", payload.email);

      // Check if email is valid
      if (!payload.email || !payload.email.includes('@')) {
        toast.error("Please enter a valid email address");
        setIsSubmitting(false);
        return;
      }

      const response = await api.post("/auth/register", payload);

      if (response.data.success) {
        toast.success(
          `Account created successfully! A ${selectedPlan.trialDays || 7}-day trial has started.`,
          { duration: 8000 }
        );

        try {
          await login(formData.email.trim().toLowerCase(), formData.password);
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } catch (loginError) {
          console.warn("Auto-login failed:", loginError);
          setTimeout(() => {
            router.push("/login?registered=true");
          }, 2000);
        }
      }
      // app/(auth)/register/page.tsx - Add this in handleSubmit catch block
    } catch (error: any) {
      console.error("❌ Registration error:", error);

      // 🔍 Log the FULL error response
      console.log("🔍 Full error details:", {
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data ? JSON.parse(error.config.data) : null,
        }
      });

      // Get the actual error message from the server
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // If there are validation errors from the backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (Array.isArray(errors)) {
          errorMessage = errors.join(", ");
        } else if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${messages}`)
            .join(", ");
          errorMessage = errorMessages;
        }
      }

      // Check for specific field errors
      if (error.response?.data?.field) {
        const field = error.response.data.field;
        const value = error.response.data.value;
        errorMessage = `${field} "${value}" is already registered. Please use a different ${field}.`;

        if (field === 'email') {
          setErrors(prev => ({ ...prev, email: errorMessage }));
        } else if (field === 'phone') {
          setErrors(prev => ({ ...prev, phone: errorMessage }));
        }
      }

      // Check for duplicate key error from MongoDB
      if (errorMessage.includes("duplicate key") || errorMessage.includes("E11000")) {
        if (errorMessage.includes("email")) {
          errorMessage = `The email "${formData.email}" is already registered. Please use a different email.`;
          setErrors(prev => ({ ...prev, email: errorMessage }));
        } else if (errorMessage.includes("phone")) {
          errorMessage = "This phone number is already registered. Please use a different phone number.";
          setErrors(prev => ({ ...prev, phone: errorMessage }));
        } else {
          errorMessage = "This information is already registered. Please check your details.";
        }
      }

      setRegistrationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Users: Users,
      User: User,
      Crown: Crown,
      Briefcase: Briefcase,
      Star: Star,
      TrendingUp: TrendingUp,
      Zap: Zap,
      Sparkles: Sparkles,
      Shield: Shield,
    };
    return icons[iconName] || Users;
  };

  const getPriceDisplay = (plan: PricingPlan, cycle: string) => {
    if (plan.contactSales) return "Contact Sales";

    let price = plan.price;
    if (cycle === "quarterly") price = plan.price * 3 * 0.9;
    else if (cycle === "semiannual") price = plan.price * 6 * 0.85;
    else if (cycle === "yearly") price = plan.price * 12 * 0.8;

    return `${plan.currency || "BDT"} ${Math.round(price).toLocaleString()}`;
  };

  const getOriginalPrice = (plan: PricingPlan, cycle: string) => {
    if (plan.contactSales || cycle === "monthly") return null;

    let price = plan.price;
    if (cycle === "quarterly") price = plan.price * 3;
    else if (cycle === "semiannual") price = plan.price * 6;
    else if (cycle === "yearly") price = plan.price * 12;

    return `${plan.currency || "BDT"} ${Math.round(price).toLocaleString()}`;
  };

  const getSavings = (plan: PricingPlan, cycle: string) => {
    if (plan.contactSales || cycle === "monthly") return null;

    let discount = 0;
    if (cycle === "quarterly") discount = 10;
    else if (cycle === "semiannual") discount = 15;
    else if (cycle === "yearly") discount = 20;

    return `Save ${discount}%`;
  };

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      monthly: "Monthly",
      quarterly: "Quarterly",
      semiannual: "Semiannual",
      yearly: "Yearly",
      "one-time": "One-Time",
    };
    return labels[cycle] || cycle;
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-400" },
      emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-400" },
      blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-400" },
      purple: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", border: "border-purple-400" },
      pink: { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400", border: "border-pink-400" },
      orange: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-400" },
      teal: { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-600 dark:text-teal-400", border: "border-teal-400" },
      red: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", border: "border-red-400" },
      yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-400" },
    };
    return colors[color] || colors.indigo;
  };

  const steps = [
    { id: "user-type", label: "Choose Type" },
    { id: "pricing", label: "Select Plan" },
    { id: "details", label: "Complete Details" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  if (loadingPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-emerald-950 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-white/60 text-sm font-medium">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-emerald-950 to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Plans</h2>
          <p className="text-white/60 text-sm mb-6">{fetchError}</p>
          <button
            onClick={fetchPlans}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-medium"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-linear-to-br from-slate-900 via-emerald-950 to-slate-900">
      <FloatingParticles />
      <GlowingOrbs />

      <div className="relative z-10 w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 rounded-2xl p-[1px] bg-linear-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 pointer-events-none" />

          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

          <div className="relative p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 mb-3">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Create Your Account
              </h1>
              <p className="text-emerald-300/70 text-sm mt-1">
                Choose your plan and get started with TaskManager
              </p>
              {selectedPlan && selectedPlan.trialDays > 0 && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                  <Gift className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-300">
                    Free {selectedPlan.trialDays}-day trial included!
                  </span>
                </div>
              )}
            </motion.div>

            {/* Step Progress */}
            <div className="flex items-center justify-between mb-8 px-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${index <= currentStepIndex
                        ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-white/10 text-white/40"
                        }`}
                    >
                      {index < currentStepIndex ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium ${index <= currentStepIndex
                        ? "text-emerald-300"
                        : "text-white/30"
                        }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${index < currentStepIndex
                        ? "bg-linear-to-r from-emerald-500 to-teal-500"
                        : "bg-white/10"
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {registrationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{registrationError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === "user-type" && (
                  <div className="space-y-4">
                    <p className="text-sm text-emerald-300/60 text-center">
                      Choose how you want to use TaskManager
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Individual Option */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setUserType("individual");
                          setHasAutoSelected(true);

                          const individualPlan = plans.find(
                            p => p.isActive && p.planType === "individual"
                          );

                          if (individualPlan) {
                            setSelectedPlan(individualPlan);
                          } else {
                            toast.error("No individual plan available. Please contact support.");
                          }
                          setCurrentStep("pricing");
                        }}
                        className="relative p-6 rounded-xl border-2 border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 text-left"
                      >
                        <User className="w-8 h-8 mb-3 text-emerald-400" />
                        <h3 className="text-lg font-semibold text-white">Individual</h3>
                        <p className="text-sm text-white/40 mt-1">
                          Perfect for freelancers and solo professionals
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-emerald-400">
                          <Gift className="w-3 h-3" />
                          <span className="text-xs">7-day free trial</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                            👤 Individual
                          </span>
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
                            Role: Employee
                          </span>
                        </div>
                        <div className="mt-3 text-xs text-white/40">
                          {plans.filter(p => p.isActive && p.planType === "individual").length} plans available
                        </div>
                      </motion.button>

                      {/* Team Option */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setUserType("team");
                          setHasAutoSelected(true);

                          const teamPlan = plans.find(
                            p => p.isActive && p.planType === "team"
                          );

                          if (teamPlan) {
                            setSelectedPlan(teamPlan);
                          } else {
                            toast.error("No team plan available. Please contact support.");
                          }
                          setCurrentStep("pricing");
                        }}
                        className="relative p-6 rounded-xl border-2 border-white/10 hover:border-white/20 text-left"
                      >
                        <Users className="w-8 h-8 mb-3 text-white/40" />
                        <h3 className="text-lg font-semibold text-white">Team</h3>
                        <p className="text-sm text-white/40 mt-1">
                          Ideal for teams and growing businesses
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-emerald-400">
                          <Gift className="w-3 h-3" />
                          <span className="text-xs">7-day free trial</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                            👥 Team
                          </span>
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
                            Role: Admin
                          </span>
                        </div>
                        <div className="mt-3 text-xs text-white/40">
                          {plans.filter(p => p.isActive && p.planType === "team").length} plans available
                        </div>
                      </motion.button>
                    </div>
                    <button
                      onClick={handleNextStep}
                      className="w-full py-3 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {currentStep === "pricing" && (
                  <div className="space-y-6">
                    <div className="flex justify-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 flex-wrap">
                      {["monthly", "quarterly", "semiannual", "yearly"].map((cycle) => (
                        <button
                          key={cycle}
                          onClick={() => setBillingCycle(cycle as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${billingCycle === cycle
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "text-white/40 hover:text-white/60"
                            }`}
                        >
                          {getBillingCycleLabel(cycle)}
                          {cycle === "yearly" && (
                            <span className="ml-1 text-[10px] text-emerald-400">(Best Value)</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {plans
                        .filter(p => p.isActive && p.planType === userType)
                        .sort((a, b) => a.order - b.order)
                        .map((plan) => {
                          const Icon = getIcon(plan.icon);
                          const isSelected = selectedPlan?._id === plan._id;
                          const price = getPriceDisplay(plan, billingCycle);
                          const originalPrice = getOriginalPrice(plan, billingCycle);
                          const savings = getSavings(plan, billingCycle);
                          const color = getColorClass(plan.color || "indigo");
                          const isIndividualPlan = plan.planType === "individual";

                          return (
                            <motion.button
                              key={plan._id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setSelectedPlan(plan);
                              }}
                              className={`relative p-6 rounded-xl border-2 transition-all text-left ${isSelected
                                ? `${color.border} ${color.bg} shadow-lg shadow-emerald-500/20`
                                : "border-white/10 hover:border-white/20"
                                }`}
                            >
                              {plan.isPopular && (
                                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-linear-to-r from-yellow-500 to-orange-500 rounded-full text-[10px] font-bold text-white">
                                  POPULAR
                                </div>
                              )}
                              {plan.badge && (
                                <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-linear-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white">
                                  {plan.badge.toUpperCase()}
                                </div>
                              )}
                              <Icon
                                className={`w-8 h-8 mb-3 ${isSelected ? color.text : "text-white/40"
                                  }`}
                              />
                              <h3 className="text-lg font-semibold text-white">
                                {plan.name}
                              </h3>
                              <p className="text-sm text-white/40 mt-1 line-clamp-2">
                                {plan.description}
                              </p>
                              <div className="mt-3">
                                {plan.contactSales ? (
                                  <span className="text-lg font-bold text-white">
                                    Contact Sales
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-2xl font-bold text-white">
                                      {price}
                                    </span>
                                    <span className="text-xs text-white/40 ml-1">
                                      /{getBillingCycleLabel(billingCycle).toLowerCase()}
                                    </span>
                                    {originalPrice && (
                                      <span className="text-xs text-white/30 line-through ml-2">
                                        {originalPrice}
                                      </span>
                                    )}
                                    {savings && (
                                      <span className="block text-xs text-emerald-400 mt-1">
                                        {savings}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              {plan.trialDays > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-emerald-400">
                                  <Timer className="w-3 h-3" />
                                  <span className="text-xs">
                                    {plan.trialDays}-day free trial
                                  </span>
                                </div>
                              )}
                              <div className="mt-3 space-y-1">
                                {(plan.features || []).slice(0, 3).map((feature, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-white/30">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="line-clamp-1">{feature}</span>
                                  </div>
                                ))}
                                {(plan.features || []).length > 3 && (
                                  <div className="text-xs text-white/20">
                                    +{(plan.features || []).length - 3} more features
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                  {isIndividualPlan ? "👤 Individual" : "👥 Team"}
                                </span>
                                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                  {isIndividualPlan ? "Role: Employee" : "Role: Admin"}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="mt-3">
                                  <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                    </div>

                    {plans.filter(p => p.isActive && p.planType === userType).length === 0 && (
                      <div className="text-center py-8 text-white/60">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400/50" />
                        <p className="text-lg font-medium">No plans available</p>
                        <p className="text-sm text-white/40">Please contact support for assistance.</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handlePrevStep}
                        className="px-4 py-3 border border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="flex-1 py-3 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        Continue to Registration
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === "details" && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {selectedPlan && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/60">Selected Plan</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-lg font-semibold text-white">
                                {selectedPlan.name}
                              </p>
                              {selectedPlan.isPopular && (
                                <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                                  Popular
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                                {userType === "individual" ? "👤 Individual" : "👥 Team"}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                {userType === "team" ? "🎯 Role: Admin" : "🎯 Role: Employee"}
                              </span>
                            </div>
                            <p className="text-sm text-emerald-400 mt-1">
                              {getPriceDisplay(selectedPlan, billingCycle)} / {getBillingCycleLabel(billingCycle).toLowerCase()}
                              {selectedPlan.trialDays > 0 && (
                                <span className="text-xs text-white/40 ml-2">
                                  {selectedPlan.trialDays}-day trial included
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {userType === "team"
                                ? "👑 You will be the Admin with full access to manage your team"
                                : "👤 You will have Employee access"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep("pricing")}
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) =>
                              setFormData({ ...formData, fullName: e.target.value })
                            }
                            className={`w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.fullName
                              ? "border-red-400/50 focus:border-red-400"
                              : "border-white/10 focus:border-emerald-400"
                              } focus:shadow-lg focus:shadow-emerald-500/10`}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.fullName && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className={`w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.email
                              ? "border-red-400/50 focus:border-red-400"
                              : "border-white/10 focus:border-emerald-400"
                              } focus:shadow-lg focus:shadow-emerald-500/10`}
                            placeholder="john@example.com"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
                          Phone <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            className={`w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.phone
                              ? "border-red-400/50 focus:border-red-400"
                              : "border-white/10 focus:border-emerald-400"
                              } focus:shadow-lg focus:shadow-emerald-500/10`}
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
                          Company Name
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) =>
                              setFormData({ ...formData, companyName: e.target.value })
                            }
                            className="w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border border-white/10 focus:border-emerald-400 rounded-xl outline-none transition-all focus:shadow-lg focus:shadow-emerald-500/10"
                            placeholder={userType === "team" ? "Team Name" : "Company Inc."}
                          />
                        </div>
                        {userType === "team" && (
                          <p className="text-xs text-emerald-400/60 mt-1">
                            💡 This will be your team name
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
                          Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({ ...formData, password: e.target.value })
                            }
                            className={`w-full pl-11 pr-11 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.password
                              ? "border-red-400/50 focus:border-red-400"
                              : "border-white/10 focus:border-emerald-400"
                              } focus:shadow-lg focus:shadow-emerald-500/10`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.password}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
                          Confirm Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            className={`w-full pl-11 pr-11 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.confirmPassword
                              ? "border-red-400/50 focus:border-red-400"
                              : "border-white/10 focus:border-emerald-400"
                              } focus:shadow-lg focus:shadow-emerald-500/10`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
                        Job Title
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
                        <input
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) =>
                            setFormData({ ...formData, jobTitle: e.target.value })
                          }
                          className="w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border border-white/10 focus:border-emerald-400 rounded-xl outline-none transition-all focus:shadow-lg focus:shadow-emerald-500/10"
                          placeholder={userType === "team" ? "Team Lead" : "Software Engineer"}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                      />
                      <label className="text-sm text-white/50">
                        I agree to the{" "}
                        <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    {errors.terms && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.terms}
                      </p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-4 py-3 border border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Start {selectedPlan?.trialDays || 7}-Day Free Trial
                            <Gift className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 pt-4 border-t border-white/5 text-center"
            >
              <p className="text-sm text-white/40">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                  Sign In
                </Link>
              </p>
              <p className="text-xs text-white/20 mt-2">
                No credit card required. Cancel anytime.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}