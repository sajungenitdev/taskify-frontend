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
  ArrowLeft,
  Settings,
  LogOut,
  HelpCircle,
  FileText,
  Calendar as CalendarIcon,
  Star,
  Heart,
  Share2,
  MoreHorizontal,
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
import Link from "next/link";

// ============================================================
// TYPES
// ============================================================
interface Department {
  _id: string;
  name: string;
  code: string;
}

interface Manager {
  _id: string;
  fullName: string;
  email: string;
}

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  phoneNumber?: string;
  profilePhoto?: string;
  avatar?: string;
  role: string;
  department?: Department | null;
  managerId?: Manager | null;
  dailyHoursTarget: number;
  firstLogin: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  position?: string;
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
  skills: string[];
  languages: string[];
  achievements: {
    title: string;
    date: string;
    description: string;
  }[];
}

type FormData = Partial<UserProfile>;

export default function ProfilePage() {
  const { user, updateProfilePhoto, refreshUser, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageKey, setImageKey] = useState(Date.now());
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

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

  // When initializing formData, ensure socialLinks is an object
  const [formData, setFormData] = useState<FormData>({
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
      facebook: '',
      instagram: '',
    },
    skills: [],
    languages: [],
    achievements: [],
    notificationPreferences: {
      email: true,
      push: true,
      desktop: false,
      taskReminder: true,
      deadlineAlert: true,
      teamUpdate: true,
    },
  });

  // ============================================================
  // ROLE HELPERS
  // ============================================================
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

  const getRoleIcon = useCallback((role: string) => {
    switch (role) {
      case "super_admin":
        return <Crown size={18} className="text-purple-600" />;
      case "admin":
        return <Shield size={18} className="text-red-600" />;
      case "hr_manager":
        return <Users size={18} className="text-pink-600" />;
      case "dept_manager":
        return <Building2 size={18} className="text-orange-600" />;
      case "project_manager":
        return <Briefcase size={18} className="text-cyan-600" />;
      case "line_manager":
        return <UserCheck size={18} className="text-emerald-600" />;
      default:
        return <User size={18} className="text-gray-400" />;
    }
  }, []);

  // ============================================================
  // IMAGE HELPERS
  // ============================================================
  const isBase64Image = useCallback((imagePath: string | undefined): boolean => {
    if (!imagePath) return false;
    return imagePath.startsWith("data:image/");
  }, []);

  const getImageSource = useCallback((imagePath: string | undefined): string | null => {
    if (!imagePath || imageError) return null;
    if (isBase64Image(imagePath)) return imagePath;
    return null;
  }, [imageError, isBase64Image]);

  const getProfileImage = useCallback((): string | null => {
    if (profileImagePreview) return profileImagePreview;
    if (profile?.profilePhoto) return getImageSource(profile.profilePhoto);
    if (profile?.avatar) return getImageSource(profile.avatar);
    return null;
  }, [profile, profileImagePreview, getImageSource]);

  const refreshImage = useCallback(() => {
    setImageError(false);
    setImageKey(Date.now());
    setImageLoading(true);
    setProfileImagePreview(null);
  }, []);

  // ============================================================
  // CONVERT & COMPRESS IMAGE
  // ============================================================
  const compressImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // ============================================================
  // HANDLE PROFILE PHOTO UPLOAD
  // ============================================================
  const handleProfilePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, or WEBP)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      setIsUploading(true);
      setImageLoading(true);

      try {
        const base64String = await compressImage(file, 400, 400, 0.8);

        const response = await api.post("/auth/profile/photo", {
          profilePhoto: base64String
        });

        if (response.data.success) {
          toast.success("Profile photo updated successfully!");

          const photoUrl = response.data.data?.profilePhoto || response.data.data?.avatar;

          if (photoUrl) {
            setProfile(prev => prev ? { ...prev, profilePhoto: photoUrl, avatar: photoUrl } : null);
            setFormData(prev => ({ ...prev, profilePhoto: photoUrl, avatar: photoUrl }));
            setProfileImagePreview(photoUrl);
            updateProfilePhoto(photoUrl);
            await refreshUser();
            refreshImage();
          }
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error.response?.data?.message || "Failed to upload photo");
        setImageError(true);
      } finally {
        setIsUploading(false);
        setImageLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [updateProfilePhoto, refreshUser, refreshImage]
  );

  // ============================================================
  // HANDLE SAVE PROFILE - COMPLETELY FIXED
  // ============================================================
  const handleSave = useCallback(async () => {
    if (!formData) return;

    setIsSaving(true);
    try {
      // ✅ Create a clean copy of form data
      const updateData: any = { ...formData };

      // ✅ Handle department - convert to string ID if it's an object
      if (updateData.department && typeof updateData.department === 'object') {
        updateData.department = updateData.department._id;
      }

      // ✅ Keep profilePhoto if it exists
      if (!updateData.profilePhoto) {
        delete updateData.profilePhoto;
      }

      // ✅ Remove fields that shouldn't be sent to server
      const fieldsToRemove = [
        '_id', 'email', 'role', 'isActive', 'createdAt',
        'updatedAt', 'lastLogin', 'firstLogin', 'employeeId',
        '__v', 'avatar'
      ];
      fieldsToRemove.forEach(field => delete updateData[field]);

      // ✅ FIX: Ensure arrays are properly formatted
      // Skills - make sure it's an array of strings
      if (updateData.skills) {
        if (Array.isArray(updateData.skills)) {
          updateData.skills = updateData.skills.filter((s: string) => typeof s === 'string' && s.trim());
        } else {
          // If it's not an array, convert it or set to empty array
          console.warn("⚠️ Skills is not an array:", updateData.skills);
          updateData.skills = [];
        }
      } else {
        updateData.skills = [];
      }

      // Languages - make sure it's an array of strings
      if (updateData.languages) {
        if (Array.isArray(updateData.languages)) {
          updateData.languages = updateData.languages.filter((l: string) => typeof l === 'string' && l.trim());
        } else {
          console.warn("⚠️ Languages is not an array:", updateData.languages);
          updateData.languages = [];
        }
      } else {
        updateData.languages = [];
      }

      // Achievements - make sure it's an array of objects
      if (updateData.achievements) {
        if (Array.isArray(updateData.achievements)) {
          updateData.achievements = updateData.achievements.filter((a: any) =>
            typeof a === 'object' && a.title && a.description
          );
        } else {
          console.warn("⚠️ Achievements is not an array:", updateData.achievements);
          updateData.achievements = [];
        }
      } else {
        updateData.achievements = [];
      }

      // ✅ FIX: Social Links - make sure it's an object
      if (updateData.socialLinks) {
        if (typeof updateData.socialLinks !== 'object' || Array.isArray(updateData.socialLinks)) {
          console.warn("⚠️ SocialLinks is not an object:", updateData.socialLinks);
          // If it's an array, convert to object
          if (Array.isArray(updateData.socialLinks)) {
            const socialObj: any = {};
            const platforms = ['linkedin', 'github', 'twitter', 'facebook', 'instagram'];
            updateData.socialLinks.forEach((key: string) => {
              if (platforms.includes(key)) {
                socialObj[key] = '';
              }
            });
            updateData.socialLinks = socialObj;
          } else {
            updateData.socialLinks = {};
          }
        }
      } else {
        updateData.socialLinks = {
          linkedin: '',
          github: '',
          twitter: '',
          facebook: '',
          instagram: ''
        };
      }

      // ✅ Notification Preferences - ensure all fields exist
      if (updateData.notificationPreferences) {
        updateData.notificationPreferences = {
          email: updateData.notificationPreferences.email ?? true,
          push: updateData.notificationPreferences.push ?? true,
          desktop: updateData.notificationPreferences.desktop ?? false,
          taskReminder: updateData.notificationPreferences.taskReminder ?? true,
          deadlineAlert: updateData.notificationPreferences.deadlineAlert ?? true,
          teamUpdate: updateData.notificationPreferences.teamUpdate ?? true,
        };
      }

      console.log("📤 Sending update data:", {
        ...updateData,
        skills: updateData.skills,
        languages: updateData.languages,
        achievements: updateData.achievements,
        socialLinks: updateData.socialLinks,
        profilePhoto: updateData.profilePhoto ? 'BASE64_IMAGE' : undefined
      });

      const response = await api.put("/auth/profile", updateData);

      if (response.data.success) {
        const updatedData = response.data.data;

        // ✅ Merge the updated data with current form data
        const mergedData = {
          ...formData,
          ...updatedData,
          // Ensure arrays are properly set from response
          skills: Array.isArray(updatedData.skills) ? updatedData.skills : formData.skills || [],
          languages: Array.isArray(updatedData.languages) ? updatedData.languages : formData.languages || [],
          achievements: Array.isArray(updatedData.achievements) ? updatedData.achievements : formData.achievements || [],
          socialLinks: typeof updatedData.socialLinks === 'object' && !Array.isArray(updatedData.socialLinks)
            ? updatedData.socialLinks
            : formData.socialLinks || {},
          notificationPreferences: updatedData.notificationPreferences || formData.notificationPreferences || {
            email: true,
            push: true,
            desktop: false,
            taskReminder: true,
            deadlineAlert: true,
            teamUpdate: true,
          },
        };

        setProfile(mergedData as UserProfile);
        setFormData(mergedData);

        if (updatedData.profilePhoto) {
          updateProfilePhoto(updatedData.profilePhoto);
          setProfileImagePreview(updatedData.profilePhoto);
        }

        await refreshUser();
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
  }, [formData, updateProfilePhoto, refreshUser, refreshImage]);
  // ============================================================
  // HANDLE PASSWORD CHANGE
  // ============================================================
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

  // ============================================================
  // SKILLS
  // ============================================================
  const addSkill = useCallback(() => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), newSkill.trim()],
      });
      setNewSkill("");
    }
  }, [newSkill, formData]);

  const removeSkill = useCallback((skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills?.filter((s) => s !== skill) || [],
    });
  }, [formData]);

  // ============================================================
  // LANGUAGES
  // ============================================================
  const addLanguage = useCallback(() => {
    if (newLanguage.trim() && !formData.languages?.includes(newLanguage.trim())) {
      setFormData({
        ...formData,
        languages: [...(formData.languages || []), newLanguage.trim()],
      });
      setNewLanguage("");
    }
  }, [newLanguage, formData]);

  const removeLanguage = useCallback((language: string) => {
    setFormData({
      ...formData,
      languages: formData.languages?.filter((l) => l !== language) || [],
    });
  }, [formData]);

  // ============================================================
  // ACHIEVEMENTS
  // ============================================================
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

  const removeAchievement = useCallback((index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements?.filter((_, i) => i !== index) || [],
    });
  }, [formData]);

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
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

  // ============================================================
  // SOCIAL LINKS
  // ============================================================
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

  // ============================================================
  // LOAD PROFILE - FIXED
  // ============================================================
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const response = await api.get("/auth/me");
        if (isMounted && response.data.success) {
          const data = response.data.data;

          // ✅ Ensure all fields exist with proper defaults and correct types
          const normalizedData: UserProfile = {
            ...data,
            phoneNumber: data.phoneNumber || '',
            bio: data.bio || '',
            position: data.position || '',
            location: data.location || '',
            // ✅ Ensure skills is always an array
            skills: Array.isArray(data.skills) ? data.skills : [],
            // ✅ Ensure languages is always an array
            languages: Array.isArray(data.languages) ? data.languages : [],
            // ✅ Ensure achievements is always an array
            achievements: Array.isArray(data.achievements) ? data.achievements : [],
            // ✅ Ensure socialLinks is always an object
            socialLinks: data.socialLinks && typeof data.socialLinks === 'object' && !Array.isArray(data.socialLinks)
              ? data.socialLinks
              : {
                linkedin: '',
                github: '',
                twitter: '',
                facebook: '',
                instagram: '',
              },
            // ✅ Ensure notificationPreferences has all fields
            notificationPreferences: data.notificationPreferences ? {
              email: data.notificationPreferences.email ?? true,
              push: data.notificationPreferences.push ?? true,
              desktop: data.notificationPreferences.desktop ?? false,
              taskReminder: data.notificationPreferences.taskReminder ?? true,
              deadlineAlert: data.notificationPreferences.deadlineAlert ?? true,
              teamUpdate: data.notificationPreferences.teamUpdate ?? true,
            } : {
              email: true,
              push: true,
              desktop: false,
              taskReminder: true,
              deadlineAlert: true,
              teamUpdate: true,
            },
          };

          console.log("📥 Profile loaded:", {
            skills: normalizedData.skills,
            languages: normalizedData.languages,
            achievements: normalizedData.achievements,
            socialLinks: normalizedData.socialLinks,
          });

          setProfile(normalizedData);
          setFormData(normalizedData);
          setImageLoading(false);
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
  // ============================================================
  // RENDER
  // ============================================================
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

  const profileImageUrl = getProfileImage();
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profile.fullName || "User",
  )}&background=6366f1&color=fff&bold=true&size=120`;

  const imageSrc = profileImageUrl || fallbackAvatarUrl;
  const showImage = !imageError && !isUploading && !imageLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Manage your personal information and preferences
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (isEditing) {
                  setFormData(profile);
                  setProfileImagePreview(null);
                }
                setIsEditing(!isEditing);
              }}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm ${isEditing
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg"
                }`}
            >
              {isEditing ? <X size={16} /> : <Edit2 size={16} />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </motion.button>
          </div>
        </motion.div>

        {/* Main Layout - Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ============================================================
          LEFT SIDEBAR
          ============================================================ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden sticky top-24">
              {/* Profile Image */}
              <div className="relative">
                <div className={`h-24 bg-gradient-to-r ${getRoleColor(profile.role)}`} />
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                      {isUploading ? (
                        <div className="flex items-center justify-center w-full h-full bg-gray-100">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        </div>
                      ) : showImage ? (
                        <img
                          key={imageKey}
                          src={imageSrc}
                          alt={profile.fullName}
                          className="w-full h-full object-cover"
                          onError={() => {
                            setImageError(true);
                            setImageLoading(false);
                          }}
                          onLoad={() => setImageLoading(false)}
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
                </div>
              </div>

              {/* Profile Info */}
              <div className="mt-14 px-4 pb-4 text-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="text-lg font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1 w-full text-center focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                ) : (
                  <h2 className="text-lg font-bold text-gray-800">
                    {profile.fullName}
                  </h2>
                )}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(profile.role)}`}
                  >
                    {profile.role?.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{profile.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">ID: {profile.employeeId}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-lg font-bold text-gray-800">0</p>
                    <p className="text-[10px] text-gray-500">Tasks</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">0</p>
                    <p className="text-[10px] text-gray-500">Projects</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">0</p>
                    <p className="text-[10px] text-gray-500">Awards</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
                  >
                    <Lock size={14} />
                    Change Password
                  </button>
                  <button
                    onClick={() => router.push("/settings")}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
                  >
                    <Settings size={14} />
                    Settings
                  </button>
                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ============================================================
          RIGHT CONTENT
          ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                  <User size={18} className="text-indigo-600" />
                  Basic Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.fullName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{profile.fullName}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <p className="text-gray-800 font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phoneNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="+1 234 567 8900"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">
                      {profile.phoneNumber || "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Position</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.position || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="Software Engineer"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">
                      {profile.position || "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="New York, USA"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">
                      {profile.location || "Not specified"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Department</p>
                  <p className="text-gray-800 font-medium">
                    {profile.department?.name || "Not assigned"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Bio</p>
                  {isEditing ? (
                    <textarea
                      value={formData.bio || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-700">{profile.bio || "No bio added yet"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                  <Globe size={18} className="text-indigo-600" />
                  Social Links
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { icon: FaLinkedin, key: "linkedin", placeholder: "https://linkedin.com/in/username", color: "text-blue-600" },
                  { icon: FaGithub, key: "github", placeholder: "https://github.com/username", color: "text-gray-700" },
                  { icon: FaTwitterSquare, key: "twitter", placeholder: "https://twitter.com/username", color: "text-sky-600" },
                  { icon: FaFacebookF, key: "facebook", placeholder: "https://facebook.com/username", color: "text-blue-700" },
                  { icon: FaInstagram, key: "instagram", placeholder: "https://instagram.com/username", color: "text-pink-600" },
                ].map((social) => (
                  <div key={social.key} className="flex items-center gap-3">
                    <social.icon size={18} className={social.color} />
                    {isEditing ? (
                      <input
                        type="url"
                        value={formData.socialLinks?.[social.key as keyof typeof formData.socialLinks] || ""}
                        onChange={(e) =>
                          updateSocialLink(social.key as keyof typeof formData.socialLinks, e.target.value)
                        }
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                        placeholder={social.placeholder}
                      />
                    ) : (
                      <a
                        href={(profile.socialLinks as any)?.[social.key] || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-gray-600 hover:text-indigo-600 text-sm truncate transition ${!(profile.socialLinks as any)?.[social.key] ? "text-gray-400" : ""
                          }`}
                      >
                        {(profile.socialLinks as any)?.[social.key] || "Not added"}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills & Languages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                  <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                    <Zap size={16} className="text-indigo-600" />
                    Skills
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(formData.skills || []).length === 0 ? (
                      <p className="text-sm text-gray-400">No skills added yet</p>
                    ) : (
                      (formData.skills || []).map((skill) => (
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
                      ))
                    )}
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                  <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                    <Globe size={16} className="text-indigo-600" />
                    Languages
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(formData.languages || []).length === 0 ? (
                      <p className="text-sm text-gray-400">No languages added yet</p>
                    ) : (
                      (formData.languages || []).map((lang) => (
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
                      ))
                    )}
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
            </div>

            {/* Achievements */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                  <Award size={18} className="text-indigo-600" />
                  Achievements
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {(formData.achievements || []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No achievements added yet</p>
                ) : (
                  (formData.achievements || []).map((achievement, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-800 font-medium">{achievement.title}</p>
                          <p className="text-xs text-gray-500">{achievement.date}</p>
                          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
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
                  ))
                )}
                {isEditing && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                    <input
                      type="text"
                      placeholder="Achievement Title"
                      value={newAchievement.title}
                      onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                    <input
                      type="date"
                      value={newAchievement.date}
                      onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                    <textarea
                      placeholder="Description"
                      value={newAchievement.description}
                      onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <h3 className="text-gray-800 font-semibold flex items-center gap-2">
                  <Bell size={18} className="text-indigo-600" />
                  Notification Preferences
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
                  { key: "push", label: "Push Notifications", desc: "Get real-time push notifications" },
                  { key: "desktop", label: "Desktop Notifications", desc: "Show desktop alerts" },
                  { key: "taskReminder", label: "Task Reminders", desc: "Receive task deadline reminders" },
                  { key: "deadlineAlert", label: "Deadline Alerts", desc: "Get alerts for approaching deadlines" },
                  { key: "teamUpdate", label: "Team Updates", desc: "Stay updated with team activities" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-gray-800 text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateNotificationPreference(item.key as keyof NonNullable<UserProfile["notificationPreferences"]>)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${formData.notificationPreferences?.[item.key as keyof typeof formData.notificationPreferences]
                        ? "bg-indigo-600"
                        : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${formData.notificationPreferences?.[item.key as keyof typeof formData.notificationPreferences]
                          ? "translate-x-5"
                          : "translate-x-0.5"
                          }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-50 shadow-md hover:shadow-lg"
                  >
                    {isSaving ? (
                      <Loader2 size={20} className="animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Save size={18} />
                        Save All Changes
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // ✅ Reset to original profile data with proper types
                      const resetData: any = {
                        ...profile,
                        skills: Array.isArray(profile.skills) ? profile.skills : [],
                        languages: Array.isArray(profile.languages) ? profile.languages : [],
                        achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
                        socialLinks: profile.socialLinks && typeof profile.socialLinks === 'object' && !Array.isArray(profile.socialLinks)
                          ? profile.socialLinks
                          : { linkedin: '', github: '', twitter: '', facebook: '', instagram: '' },
                      };
                      setFormData(resetData);
                      setProfileImagePreview(null);
                    }}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

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
                    <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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
                      {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Update Password"}
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