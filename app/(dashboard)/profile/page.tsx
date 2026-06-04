"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { LiaLinkedin } from "react-icons/lia";
import { FaFacebook, FaGithub, FaInstagram, FaTwitter } from "react-icons/fa";
import Image from "next/image";

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
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/users/me");
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put("/users/profile", formData);
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData(response.data.data);
        setIsEditing(false);
        toast.success("Profile updated successfully");
        // Update auth context user
        const updatedUser = { ...user, ...response.data.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Get full image URL
  const getImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return "";
    // If it's already a full URL, return it
    if (imagePath.startsWith("http")) return imagePath;
    // Use base URL without /api/v1 for static files
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
    return `${baseUrl}${imagePath}`;
  };

  const handleProfilePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("profilePhoto", file);

    setIsUploading(true);
    try {
      const response = await api.post("/users/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        toast.success("Profile photo updated");
        // Refresh profile data to get the new photo URL
        await fetchProfile();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePasswordChange = async () => {
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
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills?.filter((s) => s !== skill) || [],
    });
  };

  const addLanguage = () => {
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
  };

  const removeLanguage = (language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages?.filter((l) => l !== language) || [],
    });
  };

  const addAchievement = () => {
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
  };

  const removeAchievement = (index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements?.filter((_, i) => i !== index) || [],
    });
  };

  // Replace the existing updateNotificationPreference function with this:

  const updateNotificationPreference = (
    key: keyof NonNullable<UserProfile["notificationPreferences"]>,
  ) => {
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
  };

  const updateSocialLink = (
    platform: keyof typeof formData.socialLinks,
    value: string,
  ) => {
    setFormData({
      ...formData,
      socialLinks: {
        ...formData.socialLinks,
        [platform]: value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const profileImageUrl = getImageUrl(profile.profilePhoto);

  const getStats = () => {
    return [
      {
        label: "Tasks Completed",
        value: "0",
        icon: CheckCircle,
        change: "0%",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        label: "Active Tasks",
        value: "0",
        icon: Activity,
        change: "0",
        color: "from-blue-500 to-blue-600",
      },
      {
        label: "On Time Rate",
        value: "0%",
        icon: Clock,
        change: "0%",
        color: "from-indigo-500 to-indigo-600",
      },
      {
        label: "Performance Score",
        value: "0",
        icon: Award,
        change: "A",
        color: "from-purple-500 to-purple-600",
      },
    ];
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-slate-400 text-sm mt-1">
              View and manage your profile information
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
          >
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
            {isEditing ? "Cancel Edit" : "Edit Profile"}
          </button>
        </div>

        {/* Main Profile Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          {/* Cover & Avatar */}
          <div className="relative">
            <div className="h-32 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20" />
            <div className="absolute -bottom-12 left-6 flex items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center border-4 border-slate-900 shadow-xl overflow-hidden">
                  {profile.profilePhoto ? (
                    <Image
                      src={getImageUrl(profile.profilePhoto)}
                      alt={profile.fullName}
                      fill
                      className="object-cover"
                      unoptimized={true}
                      onError={() => {
                        console.error("Image failed to load");
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {profile.fullName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="profile-photo-upload"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700 transition border border-slate-700"
                >
                  {isUploading ? (
                    <Loader2
                      size={14}
                      className="text-slate-300 animate-spin"
                    />
                  ) : (
                    <Camera size={14} className="text-slate-300" />
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
                    className="text-xl font-bold text-white bg-slate-800 border border-slate-700 rounded-lg px-3 py-1"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white">
                    {profile.fullName}
                  </h2>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {profile.role?.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">
                    ID: {profile.employeeId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-16 px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {getStats().map((stat, idx) => (
              <div
                key={idx}
                className="bg-slate-800/30 rounded-xl p-4 border border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon size={14} className="text-white" />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400 mt-2">
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <User size={16} className="text-indigo-400" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Email Address</p>
                  <p className="text-white font-medium">{profile.email}</p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Phone Number</p>
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-indigo-500 outline-none"
                      placeholder="+1 234 567 8900"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {profile.phoneNumber || "Not provided"}
                    </p>
                  )}
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Position</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.position || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-indigo-500 outline-none"
                      placeholder="Software Engineer"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {profile.position || "Not specified"}
                    </p>
                  )}
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-indigo-500 outline-none"
                      placeholder="New York, USA"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {profile.location || "Not specified"}
                    </p>
                  )}
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800 col-span-2">
                  <p className="text-xs text-slate-400 mb-1">Bio</p>
                  {isEditing ? (
                    <textarea
                      value={formData.bio || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-indigo-500 outline-none resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-white">
                      {profile.bio || "No bio added yet"}
                    </p>
                  )}
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-indigo-500 outline-none"
                    >
                      <option value={6}>6 hours</option>
                      <option value={7}>7 hours</option>
                      <option value={8}>8 hours</option>
                    </select>
                  ) : (
                    <p className="text-white font-medium">
                      {profile.dailyHoursTarget} hours/day
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-400" />
                Work Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Department</p>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-500" />
                    <p className="text-white font-medium">
                      {(profile.departmentId as any)?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">
                    Reporting Manager
                  </p>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-500" />
                    <p className="text-white font-medium">
                      {(profile.managerId as any)?.fullName || "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Employee ID</p>
                  <p className="text-white font-medium">{profile.employeeId}</p>
                </div>
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Join Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500" />
                    <p className="text-white font-medium">
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
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-400" />
                Social Links
              </h3>
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800 space-y-3">
                {[
                  {
                    icon: LiaLinkedin,
                    key: "linkedin",
                    placeholder: "https://linkedin.com/in/username",
                    color: "text-blue-400",
                  },
                  {
                    icon: FaGithub,
                    key: "github",
                    placeholder: "https://github.com/username",
                    color: "text-slate-300",
                  },
                  {
                    icon: FaTwitter,
                    key: "twitter",
                    placeholder: "https://twitter.com/username",
                    color: "text-sky-400",
                  },
                  {
                    icon: FaFacebook,
                    key: "facebook",
                    placeholder: "https://facebook.com/username",
                    color: "text-blue-500",
                  },
                  {
                    icon: FaInstagram,
                    key: "instagram",
                    placeholder: "https://instagram.com/username",
                    color: "text-pink-500",
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
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
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
                        className="text-slate-400 hover:text-white text-sm truncate"
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
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Zap size={16} className="text-indigo-400" />
                Skills
              </h3>
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:text-rose-400"
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
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                      placeholder="Add a skill..."
                    />
                    <button
                      onClick={addSkill}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
                    >
                      <Plus size={16} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Languages */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Globe size={16} className="text-indigo-400" />
                Languages
              </h3>
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.languages?.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                    >
                      {lang}
                      {isEditing && (
                        <button
                          onClick={() => removeLanguage(lang)}
                          className="hover:text-rose-400"
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
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                      placeholder="Add a language..."
                    />
                    <button
                      onClick={addLanguage}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
                    >
                      <Plus size={16} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Award size={16} className="text-indigo-400" />
                Achievements
              </h3>
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800 space-y-3">
                {formData.achievements?.map((achievement, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {achievement.date}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">
                          {achievement.description}
                        </p>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeAchievement(idx)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isEditing && (
                  <div className="p-3 bg-slate-800/30 rounded-lg space-y-2">
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none resize-none"
                    />
                    <button
                      onClick={addAchievement}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition text-white text-sm"
                    >
                      Add Achievement
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Bell size={16} className="text-indigo-400" />
                Notification Preferences
              </h3>
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800 space-y-3">
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
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue =
                          formData.notificationPreferences?.[
                            item.key as keyof typeof formData.notificationPreferences
                          ] ?? true;
                        setFormData({
                          ...formData,
                          notificationPreferences: {
                            email:
                              formData.notificationPreferences?.email ?? true,
                            push:
                              formData.notificationPreferences?.push ?? true,
                            desktop:
                              formData.notificationPreferences?.desktop ??
                              false,
                            taskReminder:
                              formData.notificationPreferences?.taskReminder ??
                              true,
                            deadlineAlert:
                              formData.notificationPreferences?.deadlineAlert ??
                              true,
                            teamUpdate:
                              formData.notificationPreferences?.teamUpdate ??
                              true,
                            [item.key]: !currentValue,
                          },
                        });
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        formData.notificationPreferences?.[
                          item.key as keyof typeof formData.notificationPreferences
                        ]
                          ? "bg-indigo-500"
                          : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
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
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield size={16} className="text-indigo-400" />
                Security
              </h3>
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center justify-between w-full p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <Lock size={16} className="text-slate-400" />
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">
                        Change Password
                      </p>
                      <p className="text-xs text-slate-400">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <span className="text-indigo-400 text-sm">Change →</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
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
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">
                  Change Password
                </h2>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
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
                  className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
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
                  className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
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
                  className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePasswordChange}
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    "Update Password"
                  )}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
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
