// app/(dashboard)/profile/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Globe,
  Plus,
  Trash2,
  Crown,
  UserCheck,
  Sparkles,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaTwitterSquare,
} from "react-icons/fa";

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
  const { user, updateUser, updateProfilePhoto, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All state declarations
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
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

  // Helper functions
  const getRoleColor = useCallback((role: string): string => {
    const colors: Record<string, string> = {
      super_admin: "from-purple-500 to-pink-500",
      admin: "from-red-500 to-rose-500",
      hr_manager: "from-pink-500 to-rose-500",
      dept_manager: "from-orange-500 to-amber-500",
      project_manager: "from-cyan-500 to-blue-500",
      line_manager: "from-emerald-500 to-teal-500",
      employee: "from-gray-400 to-gray-500",
    };
    return colors[role] || "from-indigo-500 to-purple-500";
  }, []);

  const getRoleBadgeColor = useCallback((role: string): string => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-800 border-purple-200",
      admin: "bg-red-100 text-red-800 border-red-200",
      hr_manager: "bg-pink-100 text-pink-800 border-pink-200",
      dept_manager: "bg-orange-100 text-orange-800 border-orange-200",
      project_manager: "bg-cyan-100 text-cyan-800 border-cyan-200",
      line_manager: "bg-emerald-100 text-emerald-800 border-emerald-200",
      employee: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[role] || "bg-indigo-100 text-indigo-800 border-indigo-200";
  }, []);

  // Check if image is base64
  const isBase64Image = useCallback(
    (imagePath: string | undefined): boolean => {
      if (!imagePath) return false;
      return imagePath.startsWith("data:image/");
    },
    [],
  );

  // Get image source
  const getImageSource = useCallback(
    (imagePath: string | undefined): string | null => {
      if (!imagePath || imageError) {
        return null;
      }

      // If it's a base64 image, return as is
      if (isBase64Image(imagePath)) {
        return imagePath;
      }

      // If the image path already starts with http, return as is
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }

      // Get the base URL without /api/v1
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const baseUrl = apiUrl.replace("/api/v1", "");

      // Ensure the path starts with /
      const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

      return `${baseUrl}${path}`;
    },
    [imageError, isBase64Image],
  );

  // Get full image URL for display
  const getImageUrl = useCallback(
    (imagePath: string | undefined): string | null => {
      if (!imagePath) return null;

      // If we have a preview image (for newly uploaded), use it
      if (profileImagePreview) {
        return profileImagePreview;
      }

      return getImageSource(imagePath);
    },
    [profileImagePreview, getImageSource],
  );

  const refreshImage = useCallback(() => {
    setImageTimestamp(Date.now());
    setImageError(false);
    setProfileImagePreview(null);
  }, []);

  // Handle save profile
  const handleSave = useCallback(async () => {
    if (!formData) return;

    setIsSaving(true);
    try {
      // If there's a base64 image preview, include it in the update
      const updateData = { ...formData };

      // If we have a preview image (base64), send it as profilePhoto
      if (
        profileImagePreview &&
        profileImagePreview.startsWith("data:image/")
      ) {
        updateData.profilePhoto = profileImagePreview;
      }

      const response = await api.put("/auth/profile", updateData);

      if (response.data.success) {
        const updatedData = response.data.data;

        // Update profile state
        setProfile(updatedData);
        setFormData(updatedData);

        // Update AuthContext user
        if (updatedData.profilePhoto) {
          updateProfilePhoto(updatedData.profilePhoto);
        }

        setIsEditing(false);
        toast.success("Profile updated successfully!");
        refreshImage();
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }, [formData, updateProfilePhoto, refreshImage, profileImagePreview]);

  // Handle profile photo upload - Convert to Base64
  const handleProfilePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, or WEBP)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      setIsUploading(true);

      try {
        // Convert file to Base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Image = event.target?.result as string;

          // Set preview immediately
          setProfileImagePreview(base64Image);

          // Update form data with base64 image
          setFormData((prev) => ({
            ...prev,
            profilePhoto: base64Image,
          }));

          // Upload to server
          const uploadFormData = new FormData();
          uploadFormData.append("profilePhoto", file);

          const response = await api.post(
            "/auth/profile/photo",
            uploadFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );

          if (response.data.success) {
            toast.success("Profile photo updated successfully!");

            // Get the updated user data from the response
            const updatedUserData = response.data.data;

            // Update profile state
            setProfile(updatedUserData);
            setFormData(updatedUserData);

            // Update AuthContext user
            if (updatedUserData.profilePhoto) {
              updateProfilePhoto(updatedUserData.profilePhoto);
            } else {
              // If no photo returned, refresh from server
              await refreshUser();
            }

            refreshImage();
          }
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error.response?.data?.message || "Failed to upload photo");
        setImageError(true);
        setProfileImagePreview(null);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [updateProfilePhoto, refreshUser],
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
        toast.success("Password changed successfully!");
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

  // Fetch profile on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const response = await api.get("/auth/me");
        if (isMounted && response.data.success) {
          setProfile(response.data.data);
          setFormData(response.data.data);
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        if (isMounted) {
          toast.error("Failed to load profile");
        }
      } finally {
        if (isMounted) {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-white/80 p-3" />
          </div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading profile...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!profile) return null;

  const profileImageUrl = getImageUrl(profile.profilePhoto);

  // Fallback avatar URL using UI Avatars
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profile.fullName || "User",
  )}&background=6366f1&color=fff&bold=true&size=120`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Manage your personal information and preferences
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                isEditing
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {isEditing ? <X size={16} /> : <Edit2 size={16} />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </motion.button>
          </div>
        </motion.div>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden"
        >
          {/* Cover & Avatar */}
          <div className="relative">
            <div
              className={`h-32 bg-gradient-to-r ${getRoleColor(profile.role)}`}
            />
            <div className="absolute -bottom-12 left-6 flex items-end gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                  {isUploading ? (
                    <div className="flex items-center justify-center w-full h-full bg-gray-100">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : profileImageUrl && !imageError ? (
                    <img
                      src={`${profileImageUrl}${!isBase64Image(profileImageUrl) ? `?t=${imageTimestamp}` : ""}`}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setImageError(true);
                      }}
                    />
                  ) : (
                    <img
                      src={fallbackAvatarUrl}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <label
                  htmlFor="profile-photo-upload"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full cursor-pointer hover:bg-gray-50 transition border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100"
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
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(profile.role)}`}
                  >
                    {profile.role?.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    ID: {profile.employeeId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="mt-16 p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Tasks Completed",
                  value: "0",
                  icon: CheckCircle,
                  gradient: "from-emerald-500 to-emerald-600",
                },
                {
                  label: "Active Tasks",
                  value: "0",
                  icon: Activity,
                  gradient: "from-blue-500 to-blue-600",
                },
                {
                  label: "On Time Rate",
                  value: "0%",
                  icon: Clock,
                  gradient: "from-indigo-500 to-indigo-600",
                },
                {
                  label: "Performance Score",
                  value: "0",
                  icon: Award,
                  gradient: "from-purple-500 to-purple-600",
                },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {stat.label}
                      </p>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-sm`}
                    >
                      <stat.icon size={14} className="text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <User size={16} className="text-indigo-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <p className="text-gray-800 font-medium">{profile.email}</p>
                  </div>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
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
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <p className="text-gray-800 font-medium">
                        {profile.phoneNumber || "Not provided"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
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
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-gray-400" />
                      <p className="text-gray-800 font-medium">
                        {profile.position || "Not specified"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
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
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <p className="text-gray-800 font-medium">
                        {profile.location || "Not specified"}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 col-span-2">
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
              </div>
            </motion.div>

            {/* Role Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-200/50 overflow-hidden"
            >
              <div className="p-4 border-b border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-indigo-600" />
                  <h3 className="text-gray-800 font-semibold">
                    Role & Permissions
                  </h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                    {profile.role === "super_admin" ? (
                      <Crown size={20} className="text-purple-600" />
                    ) : profile.role === "admin" ? (
                      <Shield size={20} className="text-red-600" />
                    ) : profile.role === "hr_manager" ? (
                      <Users size={20} className="text-pink-600" />
                    ) : profile.role === "dept_manager" ? (
                      <Building2 size={20} className="text-orange-600" />
                    ) : profile.role === "project_manager" ? (
                      <Briefcase size={20} className="text-cyan-600" />
                    ) : profile.role === "line_manager" ? (
                      <UserCheck size={20} className="text-emerald-600" />
                    ) : (
                      <User size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Current Role</p>
                        <p className="text-lg font-bold text-gray-800">
                          {profile.role?.replace(/_/g, " ").toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                        System Role
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Permanent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Work Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-600" />
                Work Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Department</p>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400" />
                    <p className="text-gray-800 font-medium">
                      {(profile.departmentId as any)?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
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
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                  <p className="text-gray-800 font-medium">
                    {profile.employeeId}
                  </p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
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
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-600" />
                Social Links
              </h3>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 space-y-3">
                {[
                  {
                    icon: FaLinkedin,
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
                    icon: FaTwitterSquare,
                    key: "twitter",
                    placeholder: "https://twitter.com/username",
                    color: "text-sky-600",
                  },
                  {
                    icon: FaFacebookF,
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
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Zap size={16} className="text-indigo-600" />
                Skills
              </h3>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
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
            </motion.div>

            {/* Languages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-600" />
                Languages
              </h3>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.languages?.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
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
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Award size={16} className="text-indigo-600" />
                Achievements
              </h3>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 space-y-3">
                {formData.achievements?.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition"
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
            </motion.div>

            {/* Notification Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Bell size={16} className="text-indigo-600" />
                Notification Preferences
              </h3>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 space-y-3">
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
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                <Shield size={16} className="text-indigo-600" />
                Security
              </h3>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
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
            </motion.div>

            {/* Save Button */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex gap-3 pt-4 border-t border-gray-200"
                >
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50 shadow-md hover:shadow-lg"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Save size={16} />
                        Save All Changes
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile);
                      setProfileImagePreview(null);
                    }}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Change Password Modal */}
        <AnimatePresence>
          {showPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
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
                      placeholder="Enter current password"
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
                      placeholder="Enter new password"
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
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handlePasswordChange}
                      disabled={isSaving}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-xl transition disabled:opacity-50 shadow-md hover:shadow-lg"
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
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
