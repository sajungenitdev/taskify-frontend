"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Phone,
  MapPin,
  Clock,
  Bell,
  Mail as MailIcon,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  CalendarDays,
  Clock as ClockIcon,
  Camera,
  Users,
  Calendar,
  Check,
  FileText,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

// ============ TYPES ============
interface OnboardingData {
  profilePhoto?: File | string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  department: string;
  position: string;
  employeeId: string;
  bio: string;
  dailyHoursTarget: number;
  weeklyHoursTarget: number;
  startTime: string;
  endTime: string;
  breakDuration: number;
  workDays: string[];
  timezone: string;
  overtimeThreshold: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  taskReminderTime: string;
  leaveApprovals: boolean;
  teamUpdates: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  mentionNotifications: boolean;
  commentNotifications: boolean;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

// ============ CONSTANTS ============
const WORK_DAYS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

const TIMEZONES = [
  { value: "UTC-12:00", label: "(UTC-12:00) International Date Line West" },
  { value: "UTC-08:00", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { value: "UTC-05:00", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { value: "UTC+00:00", label: "(UTC+00:00) Greenwich Mean Time" },
  { value: "UTC+01:00", label: "(UTC+01:00) Central European Time" },
  { value: "UTC+05:30", label: "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
  { value: "UTC+06:00", label: "(UTC+06:00) Astana, Dhaka" },
  { value: "UTC+08:00", label: "(UTC+08:00) Beijing, Singapore, Hong Kong" },
  { value: "UTC+09:00", label: "(UTC+09:00) Tokyo, Seoul, Osaka" },
];

// ============ TOGGLE SWITCH COMPONENT ============
const ToggleSwitch = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
        ${enabled ? "bg-indigo-600" : "bg-gray-200"}
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
          ${enabled ? "translate-x-5" : "translate-x-0.5"}
        `}
      />
    </button>
  );
};

// ============ COMPONENT ============
export default function OnboardingWizard() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    profilePhoto: undefined,
    fullName: "",
    email: "",
    phone: "",
    location: "",
    department: "",
    position: "",
    employeeId: "",
    bio: "",
    dailyHoursTarget: 8,
    weeklyHoursTarget: 40,
    startTime: "09:00",
    endTime: "18:00",
    breakDuration: 60,
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    timezone: "UTC+06:00",
    overtimeThreshold: 2,
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    taskReminderTime: "09:00",
    leaveApprovals: true,
    teamUpdates: true,
    dailyDigest: true,
    weeklyReport: true,
    mentionNotifications: true,
    commentNotifications: true,
  });

  // ============ EFFECTS ============
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        setLoading(true);
        if (user) {
          setFormData((prev) => ({
            ...prev,
            fullName: user.fullName || "",
            email: user.email || "",
            department:
              typeof user.departmentId === "object"
                ? user.departmentId?._id || ""
                : "",
            position: user.position || "",
            employeeId: user.employeeId || "",
            phone: user.phoneNumber || "",
            location: user.location || "",
            bio: user.bio || "",
          }));
        }
        await fetchDepartments();
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      checkOnboardingStatus();
    } else if (!isAuthenticated && !loading) {
      router.push("/login");
    }
  }, [isAuthenticated, user]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setFallbackDepartments();
      }
    } catch (error) {
      setFallbackDepartments();
    }
  };

  const setFallbackDepartments = () => {
    setDepartments([
      { _id: "engineering", name: "Engineering", code: "ENG" },
      { _id: "marketing", name: "Marketing", code: "MKT" },
      { _id: "sales", name: "Sales", code: "SAL" },
      { _id: "hr", name: "Human Resources", code: "HR" },
      { _id: "finance", name: "Finance", code: "FIN" },
    ]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePhotoPreview(base64String);
        setProfilePhotoBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleWorkDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day],
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullName.trim()) {
          toast.error("Please enter your full name");
          return false;
        }
        if (!formData.department) {
          toast.error("Please select your department");
          return false;
        }
        return true;
      case 2:
        if (formData.dailyHoursTarget < 1 || formData.dailyHoursTarget > 24) {
          toast.error("Please enter a valid daily hours target (1-24)");
          return false;
        }
        if (formData.workDays.length === 0) {
          toast.error("Please select at least one working day");
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phone.trim(),
        location: formData.location.trim(),
        department: formData.department,
        position: formData.position.trim(),
        employeeId: formData.employeeId.trim(),
        bio: formData.bio.trim(),
        workSettings: {
          dailyHoursTarget: formData.dailyHoursTarget,
          weeklyHoursTarget: formData.weeklyHoursTarget,
          startTime: formData.startTime,
          endTime: formData.endTime,
          breakDuration: formData.breakDuration,
          workDays: formData.workDays,
          timezone: formData.timezone,
          overtimeThreshold: formData.overtimeThreshold,
        },
        notificationPreferences: {
          email: formData.emailNotifications,
          push: formData.pushNotifications,
          taskReminder: formData.taskReminders,
          taskReminderTime: formData.taskReminderTime,
          leaveApprovals: formData.leaveApprovals,
          teamUpdate: formData.teamUpdates,
          dailyDigest: formData.dailyDigest,
          weeklyReport: formData.weeklyReport,
          mentionNotifications: formData.mentionNotifications,
          commentNotifications: formData.commentNotifications,
        },
        profilePhoto: profilePhotoBase64,
        onboardingCompleted: true,
        firstLogin: false,
      };

      // Clean empty/undefined fields
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
          delete payload[key];
        }
      });

      const response = await api.post("/onboarding/complete", payload);

      if (response.data.success) {
        const updatedUser = {
          ...user,
          fullName: formData.fullName,
          phoneNumber: formData.phone,
          location: formData.location,
          department: formData.department,
          position: formData.position,
          employeeId: formData.employeeId,
          bio: formData.bio,
          profilePhoto: profilePhotoBase64 || undefined,
          onboardingCompleted: true,
          firstLogin: false,
        };

        updateUser(updatedUser);
        await refreshUser();

        setCompleted(true);
        toast.success("🎉 Onboarding completed successfully!");
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch (error: any) {
      console.error("❌ Error completing onboarding:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete onboarding. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ RENDER COMPONENTS ============
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400 animate-pulse">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your preferences have been saved successfully. Setting up your custom workspace...
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-medium border border-indigo-500/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Redirecting to Dashboard
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 relative selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Setup Your Profile</h1>
          <p className="text-slate-400 text-sm mt-1">
            Let's customize your experience to fit your schedule & team workflows.
          </p>
        </div>

        {/* Steps Progress Bar */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[
            { num: 1, label: "Profile" },
            { num: 2, label: "Schedule" },
            { num: 3, label: "Notifications" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-3 flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${currentStep === s.num
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-600/20"
                      : currentStep > s.num
                        ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                >
                  {currentStep > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${currentStep === s.num ? "text-white" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </div>
              {s.num < 3 && (
                <div className="flex-1 h-0.5 bg-slate-800 mx-2">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: currentStep > s.num ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">

          {/* ============ STEP 1: Profile Setup ============ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center pb-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-indigo-500/50 transition-all">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-500" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <span className="text-xs text-slate-400 mt-3 font-medium">Upload profile photo (Optional)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="e.g. Alex Morgan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-sm text-slate-500 cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id} className="bg-slate-900 text-white">
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Job Title / Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="EMP-10492"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Bio / Short Intro
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                  placeholder="A few words about yourself..."
                />
              </div>
            </div>
          )}

          {/* ============ STEP 2: Work Schedule ============ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Daily Hours Target <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={formData.dailyHoursTarget}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyHoursTarget: parseFloat(e.target.value) || 8 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Weekly Hours Target
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="168"
                    step="0.5"
                    value={formData.weeklyHoursTarget}
                    onChange={(e) =>
                      setFormData({ ...formData, weeklyHoursTarget: parseFloat(e.target.value) || 40 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Break (Mins)
                  </label>
                  <input
                    type="number"
                    step="15"
                    value={formData.breakDuration}
                    onChange={(e) =>
                      setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 60 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Working Days <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORK_DAYS.map((day) => {
                    const isSelected = formData.workDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWorkDay(day.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${isSelected
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value} className="bg-slate-900 text-white">
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Overtime Threshold (Hrs)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.overtimeThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, overtimeThreshold: parseFloat(e.target.value) || 2 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============ STEP 3: Notification Preferences ============ */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "emailNotifications", label: "Email Notifications", desc: "Receive email updates", icon: MailIcon },
                  { key: "pushNotifications", label: "Push Alerts", desc: "Browser and desktop push alerts", icon: Bell },
                  { key: "taskReminders", label: "Task Reminders", desc: "Reminders for pending tasks", icon: ClockIcon },
                  { key: "leaveApprovals", label: "Leave Updates", desc: "Status updates on your leaves", icon: CheckCircle },
                  { key: "teamUpdates", label: "Team Broadcasts", desc: "Announcements from leadership", icon: Users },
                  { key: "dailyDigest", label: "Daily Summary", desc: "Digest of everyday progress", icon: Calendar },
                ].map((item) => {
                  const isEnabled = formData[item.key as keyof OnboardingData] as boolean;
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          [item.key]: !isEnabled,
                        })
                      }
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${isEnabled
                          ? "bg-indigo-950/20 border-indigo-500/30"
                          : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isEnabled ? "bg-indigo-600/20 text-indigo-400" : "bg-slate-800 text-slate-500"}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{item.label}</p>
                          <p className="text-[11px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch enabled={isEnabled} onChange={() => { }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-800">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${currentStep === 1
                  ? "text-slate-600 cursor-not-allowed opacity-40"
                  : "text-slate-300 hover:bg-slate-800"
                }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 active:scale-95"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer Subtext */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Step {currentStep} of 3 • You can change these preferences later in your settings.
        </p>
      </div>
    </div>
  );
}