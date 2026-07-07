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
  Moon,
  Sun,
  Globe,
  Award,
  Target,
  Zap,
  Shield,
  Eye,
  EyeOff,
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
  { value: "UTC-12:00", label: "UTC-12:00" },
  { value: "UTC-11:00", label: "UTC-11:00" },
  { value: "UTC-10:00", label: "UTC-10:00" },
  { value: "UTC-09:00", label: "UTC-09:00" },
  { value: "UTC-08:00", label: "UTC-08:00" },
  { value: "UTC-07:00", label: "UTC-07:00" },
  { value: "UTC-06:00", label: "UTC-06:00" },
  { value: "UTC-05:00", label: "UTC-05:00" },
  { value: "UTC-04:00", label: "UTC-04:00" },
  { value: "UTC-03:00", label: "UTC-03:00" },
  { value: "UTC-02:00", label: "UTC-02:00" },
  { value: "UTC-01:00", label: "UTC-01:00" },
  { value: "UTC+00:00", label: "UTC+00:00" },
  { value: "UTC+01:00", label: "UTC+01:00" },
  { value: "UTC+02:00", label: "UTC+02:00" },
  { value: "UTC+03:00", label: "UTC+03:00" },
  { value: "UTC+04:00", label: "UTC+04:00" },
  { value: "UTC+05:00", label: "UTC+05:00" },
  { value: "UTC+06:00", label: "UTC+06:00" },
  { value: "UTC+07:00", label: "UTC+07:00" },
  { value: "UTC+08:00", label: "UTC+08:00" },
  { value: "UTC+09:00", label: "UTC+09:00" },
  { value: "UTC+10:00", label: "UTC+10:00" },
  { value: "UTC+11:00", label: "UTC+11:00" },
  { value: "UTC+12:00", label: "UTC+12:00" },
];

// ============ TOGGLE SWITCH COMPONENT ============
const ToggleSwitch = ({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: () => void;
  label?: string;
  description?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
        ${enabled ? "bg-indigo-600" : "bg-gray-300"}
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        hover:scale-105 transform transition-transform
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300
          ${enabled ? "translate-x-5" : "translate-x-0.5"}
        `}
      />
      {enabled && (
        <span className="absolute inset-0 rounded-full bg-indigo-600 animate-pulse opacity-30" />
      )}
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
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null,
  );
  const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(
    null,
  );
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

        // console.log("👤 ===== USER DATA FROM AUTH ===== 👤");
        // console.log("User:", user);
        // console.log("=====================================");

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

  // ============ API FUNCTIONS ============
  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setFallbackDepartments();
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
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

  // ============ HANDLERS ============
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

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phone.trim(),
        location: formData.location.trim(),
        departmentId: formData.department,
        position: formData.position.trim(),
        employeeId: formData.employeeId.trim(),
        bio: formData.bio.trim(),
        dailyHoursTarget: formData.dailyHoursTarget,
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

      // console.log("📝 ===== ONBOARDING DATA ===== 📝");
      // console.log("📦 Full Payload:", payload);
      // console.log("=====================================");

      const response = await api.post("/onboarding/complete", payload);

      if (response.data.success) {
        // ✅ FIX: Handle null profilePhoto
        const updatedUser = {
          ...user,
          fullName: formData.fullName,
          phoneNumber: formData.phone,
          location: formData.location,
          departmentId: formData.department,
          position: formData.position,
          employeeId: formData.employeeId,
          bio: formData.bio,
          profilePhoto: profilePhotoBase64 || undefined, // Convert null to undefined
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
        error.response?.data?.message ||
          "Failed to complete onboarding. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ RENDER FUNCTIONS ============
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-10">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
              currentStep === step
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                : currentStep > step
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {currentStep > step ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-0.5 transition-all duration-500 ${
                currentStep > step ? "bg-emerald-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepTitle = () => {
    const titles = [
      {
        step: 1,
        title: "Profile Setup",
        description: "Tell us about yourself",
        icon: User,
      },
      {
        step: 2,
        title: "Work Schedule",
        description: "Set your working hours",
        icon: Clock,
      },
      {
        step: 3,
        title: "Notifications",
        description: "Choose how you want to be notified",
        icon: Bell,
      },
    ];
    const current = titles.find((t) => t.step === currentStep);
    const Icon = current?.icon || User;
    return (
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 mb-3">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{current?.title}</h2>
        <p className="text-gray-500 text-sm mt-1">{current?.description}</p>
      </div>
    );
  };

  // ============ LOADING & COMPLETED STATES ============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-md w-full p-10 text-center animate-fade-in-up">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🎉 Welcome Aboard!
          </h2>
          <p className="text-gray-500 mb-6">
            Your onboarding is complete. You're now ready to start using the
            platform.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Getting Started
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            Complete these steps to set up your account
          </p>
        </div>

        {renderStepIndicator()}
        {renderStepTitle()}

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200/80 p-8 transition-all duration-300 hover:shadow-2xl">
          {/* STEP 1: Profile Setup */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all duration-300">
                    {profilePhotoPreview ? (
                      <img
                        src={profilePhotoPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-14 h-14 text-indigo-500" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Upload a profile photo (optional)
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                    placeholder="Enter your location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800 appearance-none"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Position / Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                    placeholder="Enter your position"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                    placeholder="Enter your employee ID"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bio / About You
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 resize-none text-gray-800"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: Work Schedule */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Daily Hours Target <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={formData.dailyHoursTarget}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyHoursTarget: parseFloat(e.target.value) || 8,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Hours per day (1-24)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Weekly Hours Target
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="168"
                    step="0.5"
                    value={formData.weeklyHoursTarget}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weeklyHoursTarget: parseFloat(e.target.value) || 40,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Hours per week (5-168)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Break Duration
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    step="15"
                    value={formData.breakDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        breakDuration: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                  />
                  <p className="text-xs text-gray-400 mt-1">Minutes (0-180)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Days <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORK_DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWorkDay(day.value)}
                      className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        formData.workDays.includes(day.value)
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Select your working days
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) =>
                      setFormData({ ...formData, timezone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800 appearance-none"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Overtime Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.overtimeThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overtimeThreshold: parseFloat(e.target.value) || 2,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-800"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Hours after which overtime is calculated
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Notification Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Email & Push Notifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-indigo-200 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${formData.emailNotifications ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-400"}`}
                      >
                        <MailIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Email Notifications
                        </p>
                        <p className="text-xs text-gray-500">
                          Receive updates via email
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={formData.emailNotifications}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          emailNotifications: !formData.emailNotifications,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-indigo-200 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${formData.pushNotifications ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-400"}`}
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Push Notifications
                        </p>
                        <p className="text-xs text-gray-500">
                          Receive push notifications
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      enabled={formData.pushNotifications}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          pushNotifications: !formData.pushNotifications,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Task Reminders */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-indigo-200 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${formData.taskReminders ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-400"}`}
                    >
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        Task Reminders
                      </p>
                      <p className="text-xs text-gray-500">
                        Get reminded about upcoming tasks
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={formData.taskReminders}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        taskReminders: !formData.taskReminders,
                      })
                    }
                  />
                </div>
                {formData.taskReminders && (
                  <div className="ml-16">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={formData.taskReminderTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taskReminderTime: e.target.value,
                        })
                      }
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-colors text-gray-800 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Other Notification Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: "leaveApprovals",
                    label: "Leave Approvals",
                    desc: "Notifications for leave status",
                    icon: CheckCircle,
                  },
                  {
                    key: "teamUpdates",
                    label: "Team Updates",
                    desc: "Notifications from your team",
                    icon: Users,
                  },
                  {
                    key: "dailyDigest",
                    label: "Daily Digest",
                    desc: "Daily summary of activities",
                    icon: Calendar,
                  },
                  {
                    key: "weeklyReport",
                    label: "Weekly Report",
                    desc: "Weekly performance report",
                    icon: FileText,
                  },
                  {
                    key: "mentionNotifications",
                    label: "Mentions",
                    desc: "When someone mentions you",
                    icon: MessageSquare,
                  },
                  {
                    key: "commentNotifications",
                    label: "Comments",
                    desc: "When someone comments on your tasks",
                    icon: MessageSquare,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="bg-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-indigo-200 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${formData[item.key as keyof OnboardingData] ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-400"}`}
                        >
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={
                          formData[item.key as keyof OnboardingData] as boolean
                        }
                        onChange={() =>
                          setFormData({
                            ...formData,
                            [item.key]:
                              !formData[item.key as keyof OnboardingData],
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-8 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                currentStep === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/40 flex items-center gap-2 transform hover:scale-105"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-medium transition-all duration-300 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/40 flex items-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
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

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Step {currentStep} of 3
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-slow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
