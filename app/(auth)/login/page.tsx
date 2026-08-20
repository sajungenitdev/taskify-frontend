// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  Mail,
  Lock
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [touchedFields, setTouchedFields] = useState<{
    email: boolean;
    password: boolean;
  }>({ email: false, password: false });

  // Email validation for login
  const validateEmail = (email: string) => {
    // Check if email is empty
    if (!email || email.trim() === '') {
      return { isValid: false, message: 'Email address is required' };
    }

    // Check if email has @ symbol
    if (!email.includes('@')) {
      return { isValid: false, message: 'Email must contain @ symbol' };
    }

    // Check if email has domain
    const parts = email.split('@');
    if (parts.length !== 2 || !parts[1]) {
      return { isValid: false, message: 'Please enter a complete email address' };
    }

    // Check if domain has a dot
    const domain = parts[1];
    if (!domain.includes('.')) {
      return { isValid: false, message: 'Please enter a complete email address with domain (e.g., .com, .org)' };
    }

    // Check if domain part after dot has at least 2 characters
    const domainParts = domain.split('.');
    if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
      return { isValid: false, message: 'Please enter a complete email address (e.g., name@domain.com)' };
    }

    // Full email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address (e.g., name@domain.com)' };
    }

    // Check for disposable/temporary email domains
    const disposableDomains = [
      'mailinator.com', 'mailnator.com', 'guerrillamail.com', '10minutemail.com',
      'temp-mail.org', 'yopmail.com', 'throwawaymail.com', 'trashmail.com',
      'jetable.com', 'spamgourmet.com', 'mailexpire.com', 'mailcatch.com',
      'maildrop.cc', 'spambox.us', 'mytrashmail.com', 'fakeinbox.com',
      'dispostable.com', 'mintemail.com', 'getnada.com', 'mailnesia.com',
      'inboxbear.com', 'guerrillamail-block.com'
    ];

    const emailDomain = domain.toLowerCase();
    if (disposableDomains.some(d => emailDomain.includes(d))) {
      return { isValid: false, message: 'Please use a valid email address. Temporary email services are not allowed.' };
    }

    return { isValid: true, message: '' };
  };

  // Password validation for login
  const validatePassword = (password: string) => {
    if (!password || password.trim() === '') {
      return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters' };
    }

    return { isValid: true, message: '' };
  };

  const handleFieldBlur = (field: 'email' | 'password') => {
    setTouchedFields({ ...touchedFields, [field]: true });

    // Only validate on blur when field has content
    if (field === 'email' && formData.email) {
      const result = validateEmail(formData.email);
      if (!result.isValid) {
        setFieldErrors({ ...fieldErrors, email: result.message });
      } else {
        setFieldErrors({ ...fieldErrors, email: undefined });
      }
    }

    if (field === 'password' && formData.password) {
      const result = validatePassword(formData.password);
      if (!result.isValid) {
        setFieldErrors({ ...fieldErrors, password: result.message });
      } else {
        setFieldErrors({ ...fieldErrors, password: undefined });
      }
    }
  };

  const handleFieldChange = (field: 'email' | 'password', value: string) => {
    setFormData({ ...formData, [field]: value });
    setLoginError(null);

    // Only clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: undefined });
    }

    // Real-time validation only for email when it's complete enough
    if (field === 'email' && value && touchedFields.email) {
      // Only show error if email is complete or has @ and domain
      if (value.includes('@') && value.split('@')[1]?.includes('.')) {
        const result = validateEmail(value);
        if (!result.isValid) {
          setFieldErrors({ ...fieldErrors, email: result.message });
        } else {
          setFieldErrors({ ...fieldErrors, email: undefined });
        }
      } else if (value.includes('@') && !value.split('@')[1]?.includes('.')) {
        // Don't show error while typing domain
        setFieldErrors({ ...fieldErrors, email: undefined });
      }
    }

    // Real-time validation for password
    if (field === 'password' && value && touchedFields.password) {
      const result = validatePassword(value);
      if (!result.isValid) {
        setFieldErrors({ ...fieldErrors, password: result.message });
      } else {
        setFieldErrors({ ...fieldErrors, password: undefined });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setFieldErrors({});

    // Mark fields as touched
    setTouchedFields({ email: true, password: true });

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setFieldErrors({ email: emailValidation.message });
      document.getElementById('email-field')?.focus();
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setFieldErrors({ password: passwordValidation.message });
      document.getElementById('password-field')?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const userData = await login(formData.email, formData.password);
      const token = localStorage.getItem("token");

      if (token) {
        toast.success(`Welcome back, ${userData?.fullName || "User"}!`, {
          icon: '👋',
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });

        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }

        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        setLoginError("Login failed. Please try again.");
        toast.error("Login failed. Please try again.");
      }
    } catch (error: unknown) {
      let errorMessage = "Invalid credentials. Please check your email and password.";

      if (error instanceof Error && error.message?.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      if (error && typeof error === 'object' && 'status' in error) {
        const err = error as { status?: number; response?: { data?: { message?: string } } };

        if (err.status === 401) {
          if (formData.password.length > 0) {
            errorMessage = "Invalid password. Please try again.";
            setFieldErrors({ password: errorMessage });
            document.getElementById('password-field')?.focus();
          } else if (formData.email.length > 0) {
            errorMessage = "Invalid email address. Please check and try again.";
            setFieldErrors({ email: errorMessage });
            document.getElementById('email-field')?.focus();
          } else {
            errorMessage = "Invalid credentials. Please check your email and password.";
          }
        } else if (err.status === 404) {
          errorMessage = "No account found with this email address. Please check and try again.";
          setFieldErrors({ email: errorMessage });
          document.getElementById('email-field')?.focus();
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;

          if (errorMessage.toLowerCase().includes('password') ||
            errorMessage.toLowerCase().includes('incorrect')) {
            setFieldErrors({ password: "Invalid password. Please try again." });
            document.getElementById('password-field')?.focus();
          } else if (errorMessage.toLowerCase().includes('email') ||
            errorMessage.toLowerCase().includes('user') ||
            errorMessage.toLowerCase().includes('account')) {
            setFieldErrors({ email: "Invalid email address. Please check and try again." });
            document.getElementById('email-field')?.focus();
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
        if (errorMessage.toLowerCase().includes('password')) {
          setFieldErrors({ password: "Invalid password. Please try again." });
          document.getElementById('password-field')?.focus();
        } else if (errorMessage.toLowerCase().includes('email')) {
          setFieldErrors({ email: "Invalid email address. Please check and try again." });
          document.getElementById('email-field')?.focus();
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.toLowerCase().includes('password')) {
          setFieldErrors({ password: "Invalid password. Please try again." });
          document.getElementById('password-field')?.focus();
        } else if (errorMessage.toLowerCase().includes('email')) {
          setFieldErrors({ email: "Invalid email address. Please check and try again." });
          document.getElementById('email-field')?.focus();
        }
      }

      if (!fieldErrors.email && !fieldErrors.password) {
        setLoginError(errorMessage);
        toast.error(errorMessage, {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
      }

      setFormData((prev) => ({ ...prev, password: "" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0B1528] via-[#1a2a4a] to-[#0B1528]">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-white backdrop-blur-sm rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1A60FF] to-[#4A8CFF] rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div> */}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Task<span className="text-[#1A60FF]">Flow</span> Pro
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 font-normal">
            Sign in to your workspace
          </p>
        </motion.div>

        {/* Login Error */}
        <AnimatePresence mode="wait">
          {loginError && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 shadow-sm"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium">{loginError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              {/* <Mail className="w-3 h-3" /> */}
              WORK EMAIL
            </label>
            <div className="relative">
              <input
                id="email-field"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                className={`w-full px-4 py-3 text-sm text-gray-800 bg-white border-2 ${fieldErrors.email
                    ? 'border-red-500 focus:border-red-500'
                    : formData.email && !fieldErrors.email && touchedFields.email
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-gray-200 focus:border-[#1A60FF]'
                  } rounded-xl outline-none transition-all duration-200 pr-10`}
                placeholder="you@company.com"
                required
                disabled={isSubmitting || isLoading}
                autoComplete="email"
                autoFocus
              />
              {touchedFields.email && formData.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {fieldErrors.email ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            <AnimatePresence>
              {fieldErrors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              {/* <Lock className="w-3 h-3" /> */}
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="password-field"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                onBlur={() => handleFieldBlur('password')}
                className={`w-full pl-4 pr-12 py-3 text-sm text-gray-800 bg-white border-2 ${fieldErrors.password
                    ? 'border-red-500 focus:border-red-500'
                    : formData.password && !fieldErrors.password && touchedFields.password
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-gray-200 focus:border-[#1A60FF]'
                  } rounded-xl outline-none transition-all duration-200`}
                placeholder="Enter your password"
                required
                disabled={isSubmitting || isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting || isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <AnimatePresence>
              {fieldErrors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Remember Me & Forgot Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between pt-1"
          >
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#1A60FF] focus:ring-[#1A60FF] accent-[#1A60FF] cursor-pointer transition-all"
              />
              <span className="text-sm text-gray-500 font-normal group-hover:text-gray-700 transition-colors">
                Remember me
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#1A60FF] hover:text-[#4A8CFF] font-medium transition-colors hover:underline"
            >
              Forgot password?
            </Link>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-2"
          >
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-gradient-to-r from-[#1A60FF] to-[#4A8CFF] hover:from-[#0F4FD4] hover:to-[#3A7CEE] text-white font-semibold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 text-sm transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  {/* <Shield className="w-4 h-4" /> */}
                  <span>Sign In</span>
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center space-y-3"
        >
          <p className="text-xs text-[#6b7280] leading-relaxed">
            Don't have an account? Contact your admin.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}