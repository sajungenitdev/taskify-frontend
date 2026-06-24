"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Briefcase,
  Calendar,
  Clock,
  Phone,
  Building2,
  Users,
  Shield,
  Edit2,
  Save,
  X,
  Camera,
  Lock,
  CheckCircle,
  Loader2,
  MapPin,
  Award,
  Activity,
  Zap,
  Bell,
  TrendingUp,
  Star,
  Globe,
  Plus,
  Trash2,
  ImageOff,
  Crown,
  UserCheck,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { LiaLinkedin } from "react-icons/lia";
import { FaFacebook, FaGithub, FaInstagram, FaTwitter } from "react-icons/fa";

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  phoneNumber?: string;
  profilePhoto?: string;
  role: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  managerId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  dailyHoursTarget: number;
  firstLogin: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  position?: string;
  joinDate?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  notificationPreferences: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    taskReminder: boolean;
    deadlineAlert: boolean;
    teamUpdate: boolean;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  skills: string[];
  languages: string[];
  achievements: {
    title: string;
    date: string;
    description: string;
  }[];
  isSystemRole?: boolean;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newAchievement, setNewAchievement] = useState({
    title: "",
    date: "",
    description: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  // Helper functions for role display - Memoized
  const getRoleLevel = useCallback((role: string): number => {
    const levels: Record<string, number> = {
      super_admin: 100,
      admin: 90,
      hr_manager: 80,
      dept_manager: 70,
      project_manager: 65,
      line_manager: 60,
      employee: 10,
    };
    return levels[role] || 50;
  }, []);

  const getRoleDescription = useCallback((role: string): string => {
    const descriptions: Record<string, string> = {
      super_admin:
        "Full system access with all permissions. Can manage everything including users, roles, departments, and system settings.",
      admin:
        "Administrative access with limited system control. Can manage users, departments, and view reports.",
      hr_manager:
        "Human resources management access. Can manage employees, attendance, leaves, and recruitment.",
      dept_manager:
        "Department-level management access. Can manage team tasks, approve work, and view department reports.",
      project_manager:
        "Project-specific management access. Can manage project tasks, assign members, and track progress.",
      line_manager:
        "Team management access. Can assign daily tasks, review submissions, and provide feedback.",
      employee:
        "Basic user access. Can view and manage own tasks, track time, and submit work.",
    };
    return descriptions[role] || "Standard user access.";
  }, []);

  const getRoleIcon = useCallback((role: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      super_admin: <Crown size={16} className="text-purple-600" />,
      admin: <Shield size={16} className="text-red-600" />,
      hr_manager: <Users size={16} className="text-pink-600" />,
      dept_manager: <Building2 size={16} className="text-orange-600" />,
      project_manager: <Briefcase size={16} className="text-cyan-600" />,
      line_manager: <UserCheck size={16} className="text-green-600" />,
      employee: <User size={16} className="text-gray-400" />,
    };
    return icons[role] || <Shield size={16} className="text-gray-400" />;
  }, []);

  const getRoleColor = useCallback((role: string): string => {
    const colors: Record<string, string> = {
      super_admin: "text-purple-700 bg-purple-50 border-purple-200",
      admin: "text-red-700 bg-red-50 border-red-200",
      hr_manager: "text-pink-700 bg-pink-50 border-pink-200",
      dept_manager: "text-orange-700 bg-orange-50 border-orange-200",
      project_manager: "text-cyan-700 bg-cyan-50 border-cyan-200",
      line_manager: "text-green-700 bg-green-50 border-green-200",
      employee: "text-gray-600 bg-gray-50 border-gray-200",
    };
    return colors[role] || "text-indigo-700 bg-indigo-50 border-indigo-200";
  }, []);

  // Get full image URL with timestamp for cache busting
  const getImageUrl = useCallback(
    (imagePath: string | undefined): string | null => {
      if (!imagePath || imageError || !imagePath.startsWith("http")) {
        return `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(profile?.fullName || "User")}`;
      }
      return imagePath;
    },
    [imageError, profile?.fullName],
  );

  const refreshImage = useCallback(() => {
    setImageTimestamp(Date.now());
    setImageError(false);
  }, []);

  // Handle save profile
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await api.put("/auth/profile", formData);
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData(response.data.data);
        setIsEditing(false);
        toast.success("Profile updated successfully");
        const updatedUser = { ...user, ...response.data.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        refreshImage();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }, [formData, user, refreshImage]);

  // Handle profile photo upload
  const handleProfilePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Please select a valid image file (JPEG, PNG, GIF, or WEBP)",
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append("profilePhoto", file);
      setIsUploading(true);

      try {
        const response = await api.post("/auth/profile/photo", uploadFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          toast.success("Profile photo updated successfully");
          const profileResponse = await api.get("/auth/me");
          if (profileResponse.data.success) {
            setProfile(profileResponse.data.data);
            setFormData(profileResponse.data.data);
            refreshImage();
          }
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error.response?.data?.message || "Failed to upload photo");
        setImageError(true);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [refreshImage],
  );

  // Handle password change
  const handlePasswordChange = useCallback(async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.data.success) {
        toast.success("Password changed successfully");
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  }, [passwordData]);

  // Skills handlers
  const addSkill = useCallback(() => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), newSkill.trim()],
      });
      setNewSkill("");
    }
  }, [newSkill, formData]);

  const removeSkill = useCallback(
    (skill: string) => {
      setFormData({
        ...formData,
        skills: formData.skills?.filter((s) => s !== skill) || [],
      });
    },
    [formData],
  );

  // Languages handlers
  const addLanguage = useCallback(() => {
    if (
      newLanguage.trim() &&
      !formData.languages?.includes(newLanguage.trim())
    ) {
      setFormData({
        ...formData,
        languages: [...(formData.languages || []), newLanguage.trim()],
      });
      setNewLanguage("");
    }
  }, [newLanguage, formData]);

  const removeLanguage = useCallback(
    (language: string) => {
      setFormData({
        ...formData,
        languages: formData.languages?.filter((l) => l !== language) || [],
      });
    },
    [formData],
  );

  // Achievements handlers
  const addAchievement = useCallback(() => {
    if (newAchievement.title && newAchievement.description) {
      setFormData({
        ...formData,
        achievements: [
          ...(formData.achievements || []),
          {
            ...newAchievement,
            date: newAchievement.date || new Date().toISOString().split("T")[0],
          },
        ],
      });
      setNewAchievement({ title: "", date: "", description: "" });
    }
  }, [newAchievement, formData]);

  const removeAchievement = useCallback(
    (index: number) => {
      setFormData({
        ...formData,
        achievements:
          formData.achievements?.filter((_, i) => i !== index) || [],
      });
    },
    [formData],
  );

  // Notification preference handler
  const updateNotificationPreference = useCallback(
    (key: keyof NonNullable<UserProfile["notificationPreferences"]>) => {
      setFormData((prev) => ({
        ...prev,
        notificationPreferences: {
          email: prev.notificationPreferences?.email ?? true,
          push: prev.notificationPreferences?.push ?? true,
          desktop: prev.notificationPreferences?.desktop ?? false,
          taskReminder: prev.notificationPreferences?.taskReminder ?? true,
          deadlineAlert: prev.notificationPreferences?.deadlineAlert ?? true,
          teamUpdate: prev.notificationPreferences?.teamUpdate ?? true,
          [key]: !prev.notificationPreferences?.[key],
        },
      }));
    },
    [],
  );

  // Social link handler
  const updateSocialLink = useCallback(
    (platform: keyof typeof formData.socialLinks, value: string) => {
      setFormData({
        ...formData,
        socialLinks: {
          ...formData.socialLinks,
          [platform]: value,
        },
      });
    },
    [formData],
  );

  // Memoized stats
  const stats = useMemo(
    () => [
      {
        label: "Tasks Completed",
        value: "0",
        icon: CheckCircle,
        change: "0%",
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-600",
      },
      {
        label: "Active Tasks",
        value: "0",
        icon: Activity,
        change: "0",
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
      },
      {
        label: "On Time Rate",
        value: "0%",
        icon: Clock,
        change: "0%",
        color: "from-indigo-500 to-indigo-600",
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-600",
      },
      {
        label: "Performance Score",
        value: "0",
        icon: Award,
        change: "A",
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-50",
        textColor: "text-purple-600",
      },
    ],
    [],
  );

  // Fetch profile on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const response = await api.get("/auth/me");
        if (isMounted && response.data.success) {
          setProfile(response.data.data);
          setFormData(response.data.data);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        if (isMounted) {
          toast.error("Failed to load profile");
          setIsLoading(false);
        }
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const profileImageUrl = getImageUrl(profile.profilePhoto);
  const hasImage = profileImageUrl && !imageError;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-500 text-sm mt-1">
              View and manage your profile information
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition border border-gray-200 shadow-sm hover:shadow"
          >
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
            {isEditing ? "Cancel Edit" : "Edit Profile"}
          </button>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover & Avatar */}
          <div className="relative">
            <div className="h-32 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100" />
            <div className="absolute -bottom-12 left-6 flex items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                  {isUploading ? (
                    <div className="flex items-center justify-center w-full h-full bg-gray-100">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : hasImage ? (
                    <img
                      src={profileImageUrl}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {profile.fullName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="profile-photo-upload"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full cursor-pointer hover:bg-gray-50 transition border border-gray-200 shadow-sm"
                >
                  {isUploading ? (
                    <Loader2 size={14} className="text-gray-500 animate-spin" />
                  ) : (
                    <Camera size={14} className="text-gray-600" />
                  )}
                </label>
                <input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoUpload}
                  disabled={isUploading}
                  ref={fileInputRef}
                />
              </div>
              <div className="mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="text-xl font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-800">
                    {profile.fullName}
                  </h2>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {profile.role?.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    ID: {profile.employeeId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-16 px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-sm`}
                  >
                    <stat.icon size={14} className="text-white" />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <User size={16} className="text-indigo-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <p className="text-gray-800 font-medium">{profile.email}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phoneNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="+1 234 567 8900"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">
                      {profile.phoneNumber || "Not provided"}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Position</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.position || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="Software Engineer"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">
                      {profile.position || "Not specified"}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="New York, USA"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">
                      {profile.location || "Not specified"}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Bio</p>
                  {isEditing ? (
                    <textarea
                      value={formData.bio || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-700">
                      {profile.bio || "No bio added yet"}
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">
                    Daily Hours Target
                  </p>
                  {isEditing ? (
                    <select
                      value={formData.dailyHoursTarget || 8}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dailyHoursTarget: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    >
                      <option value={6}>6 hours</option>
                      <option value={7}>7 hours</option>
                      <option value={8}>8 hours</option>
                    </select>
                  ) : (
                    <p className="text-gray-800 font-medium">
                      {profile.dailyHoursTarget} hours/day
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl border border-indigo-200 overflow-hidden">
              <div className="p-4 border-b border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-indigo-600" />
                  <h3 className="text-gray-800 font-semibold">
                    Role & Permissions
                  </h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl border ${getRoleColor(profile.role)}`}
                  >
                    {getRoleIcon(profile.role)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Current Role</p>
                        <p className="text-lg font-bold text-gray-800">
                          {profile.role?.replace(/_/g, " ").toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Access Level</p>
                        <p className="text-lg font-bold text-gray-800">
                          {getRoleLevel(profile.role)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          profile.role === "super_admin"
                            ? "bg-purple-500"
                            : profile.role === "admin"
                              ? "bg-red-500"
                              : profile.role === "hr_manager"
                                ? "bg-pink-500"
                                : profile.role === "dept_manager"
                                  ? "bg-orange-500"
                                  : profile.role === "project_manager"
                                    ? "bg-cyan-500"
                                    : profile.role === "line_manager"
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                        }`}
                        style={{ width: `${getRoleLevel(profile.role)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {getRoleDescription(profile.role)}
                    </p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        System Role
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Permanent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-600" />
                Work Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Department</p>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400" />
                    <p className="text-gray-800 font-medium">
                      {(profile.departmentId as any)?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">
                    Reporting Manager
                  </p>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <p className="text-gray-800 font-medium">
                      {(profile.managerId as any)?.fullName || "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                  <p className="text-gray-800 font-medium">
                    {profile.employeeId}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Join Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <p className="text-gray-800 font-medium">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-600" />
                Social Links
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                {[
                  {
                    icon: LiaLinkedin,
                    key: "linkedin",
                    placeholder: "https://linkedin.com/in/username",
                    color: "text-blue-600",
                  },
                  {
                    icon: FaGithub,
                    key: "github",
                    placeholder: "https://github.com/username",
                    color: "text-gray-700",
                  },
                  {
                    icon: FaTwitter,
                    key: "twitter",
                    placeholder: "https://twitter.com/username",
                    color: "text-sky-600",
                  },
                  {
                    icon: FaFacebook,
                    key: "facebook",
                    placeholder: "https://facebook.com/username",
                    color: "text-blue-700",
                  },
                  {
                    icon: FaInstagram,
                    key: "instagram",
                    placeholder: "https://instagram.com/username",
                    color: "text-pink-600",
                  },
                ].map((social) => (
                  <div key={social.key} className="flex items-center gap-3">
                    <social.icon size={18} className={social.color} />
                    {isEditing ? (
                      <input
                        type="url"
                        value={
                          formData.socialLinks?.[
                            social.key as keyof typeof formData.socialLinks
                          ] || ""
                        }
                        onChange={(e) =>
                          updateSocialLink(
                            social.key as keyof typeof formData.socialLinks,
                            e.target.value,
                          )
                        }
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                        placeholder={social.placeholder}
                      />
                    ) : (
                      <a
                        href={
                          profile.socialLinks?.[
                            social.key as keyof typeof profile.socialLinks
                          ]
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-indigo-600 text-sm truncate transition"
                      >
                        {profile.socialLinks?.[
                          social.key as keyof typeof profile.socialLinks
                        ] || "Not added"}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Zap size={16} className="text-indigo-600" />
                Skills
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:text-rose-600 transition"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSkill()}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="Add a skill..."
                    />
                    <button
                      onClick={addSkill}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition text-white"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Languages */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-600" />
                Languages
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.languages?.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                    >
                      {lang}
                      {isEditing && (
                        <button
                          onClick={() => removeLanguage(lang)}
                          className="hover:text-rose-600 transition"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="Add a language..."
                    />
                    <button
                      onClick={addLanguage}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition text-white"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Award size={16} className="text-indigo-600" />
                Achievements
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                {formData.achievements?.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-800 font-medium">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {achievement.date}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {achievement.description}
                        </p>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeAchievement(idx)}
                          className="text-rose-500 hover:text-rose-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isEditing && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                    <input
                      type="text"
                      placeholder="Achievement Title"
                      value={newAchievement.title}
                      onChange={(e) =>
                        setNewAchievement({
                          ...newAchievement,
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                    <input
                      type="date"
                      placeholder="Date"
                      value={newAchievement.date}
                      onChange={(e) =>
                        setNewAchievement({
                          ...newAchievement,
                          date: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                    <textarea
                      placeholder="Description"
                      value={newAchievement.description}
                      onChange={(e) =>
                        setNewAchievement({
                          ...newAchievement,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                    />
                    <button
                      onClick={addAchievement}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition text-white text-sm"
                    >
                      Add Achievement
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Bell size={16} className="text-indigo-600" />
                Notification Preferences
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                {[
                  {
                    key: "email",
                    label: "Email Notifications",
                    desc: "Receive updates via email",
                  },
                  {
                    key: "push",
                    label: "Push Notifications",
                    desc: "Get real-time push notifications",
                  },
                  {
                    key: "desktop",
                    label: "Desktop Notifications",
                    desc: "Show desktop alerts",
                  },
                  {
                    key: "taskReminder",
                    label: "Task Reminders",
                    desc: "Receive task deadline reminders",
                  },
                  {
                    key: "deadlineAlert",
                    label: "Deadline Alerts",
                    desc: "Get alerts for approaching deadlines",
                  },
                  {
                    key: "teamUpdate",
                    label: "Team Updates",
                    desc: "Stay updated with team activities",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-gray-800 text-sm font-medium">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateNotificationPreference(
                          item.key as keyof NonNullable<
                            UserProfile["notificationPreferences"]
                          >,
                        )
                      }
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        formData.notificationPreferences?.[
                          item.key as keyof typeof formData.notificationPreferences
                        ]
                          ? "bg-indigo-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                          formData.notificationPreferences?.[
                            item.key as keyof typeof formData.notificationPreferences
                          ]
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Shield size={16} className="text-indigo-600" />
                Security
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center justify-between w-full p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Lock size={16} className="text-gray-400" />
                    <div className="text-left">
                      <p className="text-gray-800 text-sm font-medium">
                        Change Password
                      </p>
                      <p className="text-xs text-gray-500">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <span className="text-indigo-600 text-sm font-medium">
                    Change →
                  </span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    "Save All Changes"
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(profile);
                  }}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Change Password
                </h2>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePasswordChange}
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    "Update Password"
                  )}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
