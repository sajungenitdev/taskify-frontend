// // app/(auth)/register/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   User,
//   Users,
//   Check,
//   ArrowRight,
//   ArrowLeft,
//   Mail,
//   Lock,
//   User as UserIcon,
//   Phone,
//   Building2,
//   Briefcase,
//   Calendar,
//   CreditCard,
//   Zap,
//   Shield,
//   Sparkles,
//   Loader2,
//   AlertCircle,
//   CheckCircle,
//   Eye,
//   EyeOff,
//   Star,
//   Crown,
//   Rocket,
//   Heart,
//   TrendingUp,
//   Timer,
//   Gift,
//   Clock,
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast from "react-hot-toast";
// import Link from "next/link";
// import api from "@/lib/axios";

// // ============================================================
// // FLOATING PARTICLES
// // ============================================================
// const FloatingParticles = () => {
//   const [particles, setParticles] = useState<
//     Array<{
//       id: number;
//       size: number;
//       x: number;
//       y: number;
//       duration: number;
//       delay: number;
//       opacity: number;
//       driftX: number;
//       driftY: number;
//     }>
//   >([]);

//   useEffect(() => {
//     const newParticles = Array.from({ length: 50 }, (_, i) => ({
//       id: i,
//       size: Math.random() * 5 + 2,
//       x: Math.random() * 100,
//       y: Math.random() * 100,
//       duration: Math.random() * 25 + 15,
//       delay: Math.random() * 10,
//       opacity: Math.random() * 0.2 + 0.1,
//       driftX: (Math.random() - 0.5) * 60,
//       driftY: (Math.random() - 0.5) * 60,
//     }));
//     setParticles(newParticles);
//   }, []);

//   if (particles.length === 0) return null;

//   return (
//     <div className="absolute inset-0 overflow-hidden pointer-events-none">
//       {particles.map((p) => (
//         <motion.div
//           key={p.id}
//           className="absolute rounded-full bg-emerald-400/30"
//           style={{
//             width: p.size,
//             height: p.size,
//             left: `${p.x}%`,
//             top: `${p.y}%`,
//           }}
//           animate={{
//             x: [0, p.driftX, -p.driftX * 0.5, p.driftX * 0.3, 0],
//             y: [0, p.driftY, -p.driftY * 0.5, p.driftY * 0.3, 0],
//             opacity: [
//               p.opacity,
//               p.opacity * 2,
//               p.opacity * 0.3,
//               p.opacity * 1.5,
//               p.opacity,
//             ],
//             scale: [1, 1.3, 0.7, 1.1, 1],
//           }}
//           transition={{
//             duration: p.duration,
//             delay: p.delay,
//             repeat: Infinity,
//             ease: "easeInOut",
//           }}
//         />
//       ))}
//     </div>
//   );
// };

// // ============================================================
// // GLOWING ORBS
// // ============================================================
// const GlowingOrbs = () => {
//   return (
//     <div className="absolute inset-0 overflow-hidden pointer-events-none">
//       <motion.div
//         className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-[120px]"
//         animate={{
//           x: [0, 50, -30, 20, 0],
//           y: [0, -30, 40, -20, 0],
//           scale: [1, 1.2, 0.8, 1.1, 1],
//         }}
//         transition={{
//           duration: 25,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//       />
//       <motion.div
//         className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 blur-[120px]"
//         animate={{
//           x: [0, -40, 30, -20, 0],
//           y: [0, 30, -40, 20, 0],
//           scale: [1, 1.3, 0.7, 1.2, 1],
//         }}
//         transition={{
//           duration: 30,
//           repeat: Infinity,
//           ease: "easeInOut",
//         }}
//       />
//     </div>
//   );
// };

// // ============================================================
// // REGISTRATION PLANS WITH 7-DAY TRIAL
// // ============================================================
// const PLANS = {
//   individual: {
//     id: "individual",
//     label: "Individual",
//     icon: User,
//     description: "Perfect for freelancers and solo professionals",
//     pricing: {
//       monthly: { price: 10, currency: "$", period: "month" },
//       yearly: { price: 50, currency: "$", period: "year" },
//     },
//     features: [
//       "Up to 50 tasks per month",
//       "1 project workspace",
//       "Basic analytics",
//       "Email support",
//       "Mobile app access",
//     ],
//     popular: false,
//     trialDays: 7,
//   },
//   team: {
//     id: "team",
//     label: "Team",
//     icon: Users,
//     description: "Ideal for teams and growing businesses",
//     pricing: {
//       monthly: { price: 29, currency: "$", period: "month" },
//       yearly: { price: 99, currency: "$", period: "year" },
//     },
//     features: [
//       "Unlimited tasks",
//       "10 project workspaces",
//       "Advanced analytics",
//       "Priority support",
//       "Team collaboration",
//       "Role management",
//       "Custom workflows",
//     ],
//     popular: true,
//     trialDays: 7,
//   },
// };

// // ============================================================
// // REGISTRATION STEPS
// // ============================================================
// type Step = "user-type" | "pricing" | "details";

// // ============================================================
// // MAIN REGISTER PAGE
// // ============================================================
// export default function RegisterPage() {
//   const router = useRouter();
//   const { login } = useAuth();

//   // State
//   const [currentStep, setCurrentStep] = useState<Step>("user-type");
//   const [userType, setUserType] = useState<"individual" | "team">("individual");
//   const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [agreeTerms, setAgreeTerms] = useState(false);
//   const [registrationError, setRegistrationError] = useState<string | null>(null);

//   // Form Data
//   const [formData, setFormData] = useState({
//     fullName: "",
//     email: "",
//     phone: "",
//     companyName: "",
//     jobTitle: "",
//     password: "",
//     confirmPassword: "",
//   });

//   // Validation
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const validateStep = () => {
//     if (currentStep === "details") {
//       const newErrors: Record<string, string> = {};

//       if (!formData.fullName.trim()) {
//         newErrors.fullName = "Full name is required";
//       }
//       if (!formData.email.trim()) {
//         newErrors.email = "Email is required";
//       } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//         newErrors.email = "Invalid email address";
//       }
//       if (!formData.phone.trim()) {
//         newErrors.phone = "Phone number is required";
//       } else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.phone)) {
//         newErrors.phone = "Invalid phone number";
//       }
//       if (!formData.password) {
//         newErrors.password = "Password is required";
//       } else if (formData.password.length < 8) {
//         newErrors.password = "Password must be at least 8 characters";
//       }
//       if (formData.password !== formData.confirmPassword) {
//         newErrors.confirmPassword = "Passwords do not match";
//       }
//       if (!agreeTerms) {
//         newErrors.terms = "You must agree to the terms";
//       }

//       setErrors(newErrors);
//       return Object.keys(newErrors).length === 0;
//     }
//     return true;
//   };

//   const handleNextStep = () => {
//     if (currentStep === "user-type") {
//       setCurrentStep("pricing");
//     } else if (currentStep === "pricing") {
//       setCurrentStep("details");
//     }
//   };

//   const handlePrevStep = () => {
//     if (currentStep === "pricing") {
//       setCurrentStep("user-type");
//     } else if (currentStep === "details") {
//       setCurrentStep("pricing");
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setRegistrationError(null);

//     if (!validateStep()) {
//       toast.error("Please fix the errors before continuing");
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       const selectedPlan = PLANS[userType];
//       const pricing = selectedPlan.pricing[billingCycle];

//       // Register user - backend will auto-generate password and send trial email
//       const response = await api.post("/auth/register", {
//         fullName: formData.fullName,
//         email: formData.email,
//         phone: formData.phone,
//         password: formData.password,
//         companyName: formData.companyName || "Individual User",
//         jobTitle: formData.jobTitle || "User",
//         role: userType === "individual" ? "employee" : "admin",
//         plan: selectedPlan.id,
//         billingCycle,
//         price: pricing.price,
//         currency: pricing.currency,
//         period: pricing.period,
//         trialDays: selectedPlan.trialDays || 7,
//       });

//       if (response.data.success) {
//         toast.success(
//           `Account created successfully! A 7-day trial has started. Check your email at ${formData.email}`,
//           { duration: 8000 }
//         );

//         // Auto login after registration
//         try {
//           await login(formData.email, formData.password);
//           setTimeout(() => {
//             router.push("/dashboard");
//           }, 1500);
//         } catch (loginError) {
//           // If auto-login fails, redirect to login page
//           setTimeout(() => {
//             router.push("/login?registered=true");
//           }, 2000);
//         }
//       }
//     } catch (error: any) {
//       console.error("Registration error:", error);
//       setRegistrationError(
//         error.response?.data?.message || "Registration failed. Please try again."
//       );
//       toast.error(error.response?.data?.message || "Registration failed");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const selectedPlan = PLANS[userType];
//   const pricing = selectedPlan.pricing[billingCycle];

//   // Step Progress
//   const steps = [
//     { id: "user-type", label: "Choose Type" },
//     { id: "pricing", label: "Select Plan" },
//     { id: "details", label: "Complete Details" },
//   ];

//   const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

//   return (
//     <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
//       <FloatingParticles />
//       <GlowingOrbs />

//       <motion.div
//         initial={{ opacity: 0, y: 30, scale: 0.95 }}
//         animate={{ opacity: 1, y: 0, scale: 1 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//         className="relative z-10 w-full max-w-2xl"
//       >
//         <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
//           <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 pointer-events-none" />

//           <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
//           <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl" />

//           <div className="relative p-8">
//             {/* Header */}
//             <motion.div
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="text-center mb-6"
//             >
//               <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 mb-3">
//                 <Rocket className="w-7 h-7 text-white" />
//               </div>
//               <h1 className="text-2xl font-bold text-white">
//                 Create Your Account
//               </h1>
//               <p className="text-emerald-300/70 text-sm mt-1">
//                 Choose your plan and get started with TaskManager
//               </p>
//               <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
//                 <Gift className="w-3 h-3 text-emerald-400" />
//                 <span className="text-xs text-emerald-300">
//                   Free 7-day trial included!
//                 </span>
//               </div>
//             </motion.div>

//             {/* Step Progress */}
//             <div className="flex items-center justify-between mb-8 px-4">
//               {steps.map((step, index) => (
//                 <div key={step.id} className="flex items-center flex-1">
//                   <div className="flex flex-col items-center flex-1">
//                     <div
//                       className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${index <= currentStepIndex
//                           ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
//                           : "bg-white/10 text-white/40"
//                         }`}
//                     >
//                       {index < currentStepIndex ? (
//                         <Check className="w-4 h-4" />
//                       ) : (
//                         index + 1
//                       )}
//                     </div>
//                     <span
//                       className={`text-[10px] mt-1 font-medium ${index <= currentStepIndex
//                           ? "text-emerald-300"
//                           : "text-white/30"
//                         }`}
//                     >
//                       {step.label}
//                     </span>
//                   </div>
//                   {index < steps.length - 1 && (
//                     <div
//                       className={`flex-1 h-0.5 mx-2 ${index < currentStepIndex
//                           ? "bg-gradient-to-r from-emerald-500 to-teal-500"
//                           : "bg-white/10"
//                         }`}
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>

//             {/* Error Message */}
//             <AnimatePresence>
//               {registrationError && (
//                 <motion.div
//                   initial={{ opacity: 0, y: -10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2"
//                 >
//                   <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
//                   <p className="text-sm text-red-400">{registrationError}</p>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Step Content */}
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={currentStep}
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: -20 }}
//                 transition={{ duration: 0.3 }}
//               >
//                 {currentStep === "user-type" && (
//                   <div className="space-y-4">
//                     <p className="text-sm text-emerald-300/60 text-center">
//                       Choose how you want to use TaskManager
//                     </p>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {Object.entries(PLANS).map(([key, plan]) => {
//                         const Icon = plan.icon;
//                         const isSelected = userType === key;
//                         return (
//                           <motion.button
//                             key={key}
//                             whileHover={{ scale: 1.02 }}
//                             whileTap={{ scale: 0.98 }}
//                             onClick={() => setUserType(key as "individual" | "team")}
//                             className={`relative p-6 rounded-xl border-2 transition-all text-left ${isSelected
//                                 ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
//                                 : "border-white/10 hover:border-white/20"
//                               }`}
//                           >
//                             {plan.popular && (
//                               <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-[10px] font-bold text-white">
//                                 POPULAR
//                               </div>
//                             )}
//                             <Icon
//                               className={`w-8 h-8 mb-3 ${isSelected ? "text-emerald-400" : "text-white/40"
//                                 }`}
//                             />
//                             <h3 className="text-lg font-semibold text-white">
//                               {plan.label}
//                             </h3>
//                             <p className="text-sm text-white/40 mt-1">
//                               {plan.description}
//                             </p>
//                             <div className="mt-2 flex items-center gap-1 text-emerald-400">
//                               <Gift className="w-3 h-3" />
//                               <span className="text-xs">{plan.trialDays}-day free trial</span>
//                             </div>
//                             <div className="mt-3 space-y-1">
//                               {plan.features.slice(0, 3).map((feature, i) => (
//                                 <div key={i} className="flex items-center gap-2 text-xs text-white/30">
//                                   <Check className="w-3 h-3 text-emerald-400" />
//                                   {feature}
//                                 </div>
//                               ))}
//                               {plan.features.length > 3 && (
//                                 <div className="text-xs text-white/20">
//                                   +{plan.features.length - 3} more features
//                                 </div>
//                               )}
//                             </div>
//                             {isSelected && (
//                               <div className="mt-3">
//                                 <Check className="w-5 h-5 text-emerald-400 mx-auto" />
//                               </div>
//                             )}
//                           </motion.button>
//                         );
//                       })}
//                     </div>
//                     <button
//                       onClick={handleNextStep}
//                       className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
//                     >
//                       Continue
//                       <ArrowRight className="w-4 h-4" />
//                     </button>
//                   </div>
//                 )}

//                 {currentStep === "pricing" && (
//                   <div className="space-y-4">
//                     <div className="flex justify-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
//                       <button
//                         onClick={() => setBillingCycle("monthly")}
//                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === "monthly"
//                             ? "bg-emerald-500 text-white"
//                             : "text-white/40 hover:text-white/60"
//                           }`}
//                       >
//                         Monthly
//                       </button>
//                       <button
//                         onClick={() => setBillingCycle("yearly")}
//                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === "yearly"
//                             ? "bg-emerald-500 text-white"
//                             : "text-white/40 hover:text-white/60"
//                           }`}
//                       >
//                         Yearly
//                         <span className="ml-1 text-[10px] text-emerald-400">(Save 58%)</span>
//                       </button>
//                     </div>

//                     <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
//                       <div className="flex items-center justify-center gap-2 mb-2">
//                         {selectedPlan.icon && (
//                           <selectedPlan.icon className="w-6 h-6 text-emerald-400" />
//                         )}
//                         <h3 className="text-lg font-semibold text-white">
//                           {selectedPlan.label} Plan
//                         </h3>
//                       </div>
//                       <div className="flex items-baseline justify-center gap-1">
//                         <span className="text-3xl font-bold text-white">
//                           {pricing.currency}{pricing.price}
//                         </span>
//                         <span className="text-sm text-white/40">
//                           /{pricing.period}
//                         </span>
//                       </div>
//                       <div className="mt-2 flex items-center justify-center gap-2 text-emerald-400 text-sm">
//                         <Timer className="w-4 h-4" />
//                         <span>Start with {selectedPlan.trialDays}-day free trial</span>
//                       </div>
//                       <div className="mt-4 space-y-2 text-sm text-white/50">
//                         {selectedPlan.features.map((feature, i) => (
//                           <div key={i} className="flex items-center justify-center gap-2">
//                             <Check className="w-4 h-4 text-emerald-400" />
//                             {feature}
//                           </div>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="flex gap-3">
//                       <button
//                         onClick={handlePrevStep}
//                         className="px-4 py-3 border border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-all"
//                       >
//                         <ArrowLeft className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={handleNextStep}
//                         className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
//                       >
//                         Continue to Registration
//                         <ArrowRight className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 {currentStep === "details" && (
//                   <form onSubmit={handleSubmit} className="space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
//                           Full Name <span className="text-red-400">*</span>
//                         </label>
//                         <div className="relative">
//                           <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
//                           <input
//                             type="text"
//                             value={formData.fullName}
//                             onChange={(e) =>
//                               setFormData({ ...formData, fullName: e.target.value })
//                             }
//                             className={`w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.fullName
//                                 ? "border-red-400/50 focus:border-red-400"
//                                 : "border-white/10 focus:border-emerald-400"
//                               } focus:shadow-lg focus:shadow-emerald-500/10`}
//                             placeholder="John Doe"
//                           />
//                         </div>
//                         {errors.fullName && (
//                           <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
//                           Email <span className="text-red-400">*</span>
//                         </label>
//                         <div className="relative">
//                           <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
//                           <input
//                             type="email"
//                             value={formData.email}
//                             onChange={(e) =>
//                               setFormData({ ...formData, email: e.target.value })
//                             }
//                             className={`w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.email
//                                 ? "border-red-400/50 focus:border-red-400"
//                                 : "border-white/10 focus:border-emerald-400"
//                               } focus:shadow-lg focus:shadow-emerald-500/10`}
//                             placeholder="john@example.com"
//                           />
//                         </div>
//                         {errors.email && (
//                           <p className="text-xs text-red-400 mt-1">{errors.email}</p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
//                           Phone <span className="text-red-400">*</span>
//                         </label>
//                         <div className="relative">
//                           <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
//                           <input
//                             type="tel"
//                             value={formData.phone}
//                             onChange={(e) =>
//                               setFormData({ ...formData, phone: e.target.value })
//                             }
//                             className={`w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.phone
//                                 ? "border-red-400/50 focus:border-red-400"
//                                 : "border-white/10 focus:border-emerald-400"
//                               } focus:shadow-lg focus:shadow-emerald-500/10`}
//                             placeholder="+1 234 567 8900"
//                           />
//                         </div>
//                         {errors.phone && (
//                           <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
//                           Company Name
//                         </label>
//                         <div className="relative">
//                           <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
//                           <input
//                             type="text"
//                             value={formData.companyName}
//                             onChange={(e) =>
//                               setFormData({ ...formData, companyName: e.target.value })
//                             }
//                             className="w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border border-white/10 focus:border-emerald-400 rounded-xl outline-none transition-all focus:shadow-lg focus:shadow-emerald-500/10"
//                             placeholder="Company Inc."
//                           />
//                         </div>
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
//                           Password <span className="text-red-400">*</span>
//                         </label>
//                         <div className="relative">
//                           <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
//                           <input
//                             type={showPassword ? "text" : "password"}
//                             value={formData.password}
//                             onChange={(e) =>
//                               setFormData({ ...formData, password: e.target.value })
//                             }
//                             className={`w-full pl-11 pr-11 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.password
//                                 ? "border-red-400/50 focus:border-red-400"
//                                 : "border-white/10 focus:border-emerald-400"
//                               } focus:shadow-lg focus:shadow-emerald-500/10`}
//                             placeholder="••••••••"
//                           />
//                           <button
//                             type="button"
//                             onClick={() => setShowPassword(!showPassword)}
//                             className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
//                           >
//                             {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                           </button>
//                         </div>
//                         {errors.password && (
//                           <p className="text-xs text-red-400 mt-1">{errors.password}</p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
//                           Confirm Password <span className="text-red-400">*</span>
//                         </label>
//                         <div className="relative">
//                           <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
//                           <input
//                             type={showConfirmPassword ? "text" : "password"}
//                             value={formData.confirmPassword}
//                             onChange={(e) =>
//                               setFormData({ ...formData, confirmPassword: e.target.value })
//                             }
//                             className={`w-full pl-11 pr-11 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border rounded-xl outline-none transition-all ${errors.confirmPassword
//                                 ? "border-red-400/50 focus:border-red-400"
//                                 : "border-white/10 focus:border-emerald-400"
//                               } focus:shadow-lg focus:shadow-emerald-500/10`}
//                             placeholder="••••••••"
//                           />
//                           <button
//                             type="button"
//                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                             className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
//                           >
//                             {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                           </button>
//                         </div>
//                         {errors.confirmPassword && (
//                           <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>
//                         )}
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider ml-0.5 mb-1.5">
//                         Job Title
//                       </label>
//                       <div className="relative">
//                         <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/40" />
//                         <input
//                           type="text"
//                           value={formData.jobTitle}
//                           onChange={(e) =>
//                             setFormData({ ...formData, jobTitle: e.target.value })
//                           }
//                           className="w-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border border-white/10 focus:border-emerald-400 rounded-xl outline-none transition-all focus:shadow-lg focus:shadow-emerald-500/10"
//                           placeholder="Software Engineer"
//                         />
//                       </div>
//                     </div>

//                     <div className="flex items-start gap-3">
//                       <input
//                         type="checkbox"
//                         checked={agreeTerms}
//                         onChange={(e) => setAgreeTerms(e.target.checked)}
//                         className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
//                       />
//                       <label className="text-sm text-white/50">
//                         I agree to the{" "}
//                         <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">
//                           Terms of Service
//                         </Link>{" "}
//                         and{" "}
//                         <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
//                           Privacy Policy
//                         </Link>
//                       </label>
//                     </div>
//                     {errors.terms && (
//                       <p className="text-xs text-red-400">{errors.terms}</p>
//                     )}

//                     <div className="flex gap-3 pt-2">
//                       <button
//                         type="button"
//                         onClick={handlePrevStep}
//                         className="px-4 py-3 border border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-all"
//                       >
//                         <ArrowLeft className="w-4 h-4" />
//                       </button>
//                       <button
//                         type="submit"
//                         disabled={isSubmitting}
//                         className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                       >
//                         {isSubmitting ? (
//                           <>
//                             <Loader2 className="w-4 h-4 animate-spin" />
//                             Creating Account...
//                           </>
//                         ) : (
//                           <>
//                             Start 7-Day Free Trial
//                             <Gift className="w-4 h-4" />
//                           </>
//                         )}
//                       </button>
//                     </div>
//                   </form>
//                 )}
//               </motion.div>
//             </AnimatePresence>

//             {/* Footer */}
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 0.6 }}
//               className="mt-6 pt-4 border-t border-white/5 text-center"
//             >
//               <p className="text-sm text-white/40">
//                 Already have an account?{" "}
//                 <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
//                   Sign In
//                 </Link>
//               </p>
//               <p className="text-xs text-white/20 mt-2">
//                 No credit card required. Cancel anytime.
//               </p>
//             </motion.div>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }


// app/(auth)/register/page.tsx - Updated to fetch dynamic plans
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
    CreditCard,
    Zap,
    Shield,
    Sparkles,
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
    pricing: {
        monthly: { finalPrice: number; currency: string; savings: number; discountPercentage: number };
        quarterly: { finalPrice: number; currency: string; savings: number; discountPercentage: number };
        semiannual: { finalPrice: number; currency: string; savings: number; discountPercentage: number };
        yearly: { finalPrice: number; currency: string; savings: number; discountPercentage: number };
    };
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
}

type Step = "user-type" | "pricing" | "details";

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
            const response = await api.get("/pricing-plans");
            if (response.data.success) {
                setPlans(response.data.data);
                // Auto-select first plan
                if (response.data.data.length > 0) {
                    setSelectedPlan(response.data.data[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
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

            const pricingData = selectedPlan.pricing[billingCycle];
            const price = pricingData?.finalPrice || 0;
            const currency = pricingData?.currency || "BDT";

            const response = await api.post("/auth/register", {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                companyName: formData.companyName || "Individual User",
                jobTitle: formData.jobTitle || "User",
                role: selectedPlan.limits.users > 1 ? "admin" : "employee",
                plan: selectedPlan.slug,
                billingCycle,
                price: price,
                currency: currency,
                period: billingCycle,
                trialDays: selectedPlan.trialDays || 7,
            });

            if (response.data.success) {
                toast.success(
                    `Account created successfully! A ${selectedPlan.trialDays}-day trial has started.`,
                    { duration: 8000 }
                );

                try {
                    await login(formData.email, formData.password);
                    setTimeout(() => {
                        router.push("/dashboard");
                    }, 1500);
                } catch (loginError) {
                    setTimeout(() => {
                        router.push("/login?registered=true");
                    }, 2000);
                }
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            setRegistrationError(
                error.response?.data?.message || "Registration failed. Please try again."
            );
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPriceDisplay = (plan: PricingPlan, cycle: string) => {
        const pricing = plan.pricing[cycle as keyof typeof plan.pricing];
        if (!pricing) return "Contact Sales";
        return `${pricing.currency} ${pricing.finalPrice.toLocaleString()}`;
    };

    const getOriginalPrice = (plan: PricingPlan, cycle: string) => {
        const pricing = plan.pricing[cycle as keyof typeof plan.pricing];
        if (!pricing || !pricing.savings) return null;
        return `${pricing.currency} ${(pricing.finalPrice + pricing.savings).toLocaleString()}`;
    };

    const getSavings = (plan: PricingPlan, cycle: string) => {
        const pricing = plan.pricing[cycle as keyof typeof plan.pricing];
        if (!pricing || !pricing.savings) return null;
        return `Save ${pricing.discountPercentage}%`;
    };

    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            Users: Users,
            User: User,
            Crown: Crown,
            Briefcase: Briefcase,
            Star: Star,
            TrendingUp: TrendingUp,
        };
        return icons[iconName] || Users;
    };

    // Steps
    const steps = [
        { id: "user-type", label: "Choose Type" },
        { id: "pricing", label: "Select Plan" },
        { id: "details", label: "Complete Details" },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

    if (loadingPlans) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    <p className="text-white/60">Loading pricing plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
            <div className="relative z-10 w-full max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
                >
                    <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 pointer-events-none" />

                    <div className="relative p-8">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-center mb-6"
                        >
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 mb-3">
                                <Rocket className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
                            <p className="text-emerald-300/70 text-sm mt-1">
                                Choose your plan and get started with TaskManager
                            </p>
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                                <Gift className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs text-emerald-300">
                                    Free {selectedPlan?.trialDays || 7}-day trial included!
                                </span>
                            </div>
                        </motion.div>

                        {/* Step Progress */}
                        <div className="flex items-center justify-between mb-8 px-4">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${index <= currentStepIndex
                                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
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
                                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
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
                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
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
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    // Auto-select Individual plan
                                                    const individualPlan = plans.find(p => p.limits.users === 1);
                                                    if (individualPlan) setSelectedPlan(individualPlan);
                                                    setCurrentStep("pricing");
                                                }}
                                                className="relative p-6 rounded-xl border-2 border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 text-left"
                                            >
                                                <UserIcon className="w-8 h-8 mb-3 text-emerald-400" />
                                                <h3 className="text-lg font-semibold text-white">Individual</h3>
                                                <p className="text-sm text-white/40 mt-1">Perfect for freelancers and solo professionals</p>
                                                <div className="mt-2 flex items-center gap-1 text-emerald-400">
                                                    <Gift className="w-3 h-3" />
                                                    <span className="text-xs">Free trial included</span>
                                                </div>
                                                <div className="mt-4">
                                                    <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                                                </div>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    // Auto-select Team plan
                                                    const teamPlan = plans.find(p => p.limits.users > 1);
                                                    if (teamPlan) setSelectedPlan(teamPlan);
                                                    setCurrentStep("pricing");
                                                }}
                                                className="relative p-6 rounded-xl border-2 border-white/20 hover:border-white/40 text-left"
                                            >
                                                <Users className="w-8 h-8 mb-3 text-white/40" />
                                                <h3 className="text-lg font-semibold text-white">Team</h3>
                                                <p className="text-sm text-white/40 mt-1">Ideal for teams and growing businesses</p>
                                                <div className="mt-2 flex items-center gap-1 text-emerald-400">
                                                    <Gift className="w-3 h-3" />
                                                    <span className="text-xs">Free trial included</span>
                                                </div>
                                            </motion.button>
                                        </div>
                                        <button
                                            onClick={handleNextStep}
                                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                        >
                                            Continue
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {currentStep === "pricing" && (
                                    <div className="space-y-6">
                                        {/* Billing Cycle Toggle */}
                                        <div className="flex justify-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                                            {["monthly", "quarterly", "semiannual", "yearly"].map((cycle) => (
                                                <button
                                                    key={cycle}
                                                    onClick={() => setBillingCycle(cycle as any)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${billingCycle === cycle
                                                            ? "bg-emerald-500 text-white"
                                                            : "text-white/40 hover:text-white/60"
                                                        }`}
                                                >
                                                    {cycle}
                                                    {cycle === "yearly" && (
                                                        <span className="ml-1 text-[10px] text-emerald-400">(Best Value)</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Plans Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {plans.map((plan) => {
                                                const Icon = getIcon(plan.icon);
                                                const isSelected = selectedPlan?._id === plan._id;
                                                const price = getPriceDisplay(plan, billingCycle);
                                                const originalPrice = getOriginalPrice(plan, billingCycle);
                                                const savings = getSavings(plan, billingCycle);

                                                return (
                                                    <motion.button
                                                        key={plan._id}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setSelectedPlan(plan)}
                                                        className={`relative p-6 rounded-xl border-2 transition-all text-left ${isSelected
                                                                ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                                                                : "border-white/10 hover:border-white/20"
                                                            }`}
                                                    >
                                                        {plan.isPopular && (
                                                            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-[10px] font-bold text-white">
                                                                POPULAR
                                                            </div>
                                                        )}
                                                        {plan.badge && (
                                                            <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white">
                                                                {plan.badge.toUpperCase()}
                                                            </div>
                                                        )}
                                                        <Icon className={`w-8 h-8 mb-3 ${isSelected ? "text-emerald-400" : "text-white/40"}`} />
                                                        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                                                        <p className="text-sm text-white/40 mt-1">{plan.description}</p>
                                                        <div className="mt-3">
                                                            <span className="text-2xl font-bold text-white">{price}</span>
                                                            <span className="text-xs text-white/40 ml-1">/{billingCycle}</span>
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
                                                        </div>
                                                        <div className="mt-3 flex items-center gap-1 text-emerald-400">
                                                            <Timer className="w-3 h-3" />
                                                            <span className="text-xs">{plan.trialDays}-day free trial</span>
                                                        </div>
                                                        <div className="mt-3 space-y-1">
                                                            {plan.features.slice(0, 3).map((feature, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-xs text-white/30">
                                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                                    {feature}
                                                                </div>
                                                            ))}
                                                            {plan.features.length > 3 && (
                                                                <div className="text-xs text-white/20">
                                                                    +{plan.features.length - 3} more features
                                                                </div>
                                                            )}
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

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handlePrevStep}
                                                className="px-4 py-3 border border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-all"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleNextStep}
                                                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                            >
                                                Continue to Registration
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {currentStep === "details" && (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Selected Plan Summary */}
                                        {selectedPlan && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-white/60">Selected Plan</p>
                                                        <p className="text-lg font-semibold text-white">{selectedPlan.name}</p>
                                                        <p className="text-sm text-emerald-400">
                                                            {getPriceDisplay(selectedPlan, billingCycle)} / {billingCycle}
                                                            <span className="text-xs text-white/40 ml-2">
                                                                {selectedPlan.trialDays}-day trial included
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentStep("pricing")}
                                                        className="text-sm text-emerald-400 hover:text-emerald-300"
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
                                                    <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>
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
                                                    <p className="text-xs text-red-400 mt-1">{errors.email}</p>
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
                                                    <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
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
                                                        placeholder="Company Inc."
                                                    />
                                                </div>
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
                                                    <p className="text-xs text-red-400 mt-1">{errors.password}</p>
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
                                                    <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>
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
                                                    placeholder="Software Engineer"
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
                                            <p className="text-xs text-red-400">{errors.terms}</p>
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
                                                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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