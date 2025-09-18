import { useState, useEffect, useRef, useCallback } from "react";
import {
  NavLink,
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Stethoscope,
  CheckCircle,
  Shield,
  LogIn,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { api } from "../../lib/api";
import { setToken, setUser } from "../../lib/auth";
import { getRoleFromToken } from "../../lib/auth";

// Types
interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

export default function SignIn(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    setIsFormVisible(true);
    const t = setTimeout(() => usernameRef.current?.focus(), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 5000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.username.trim())
      newErrors.username = "Student ID is required";
    else if (formData.username.length < 3)
      newErrors.username = "Student ID must be at least 3 characters";
    else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim()))
      newErrors.username = "Only letters, numbers, hyphens, underscores";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (field: keyof FormData) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field])
          setErrors((prev) => ({
            ...prev,
            [field]: undefined,
            general: undefined,
          }));
      },
    [errors]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isOnline) {
      setErrors({ general: "No internet connection. Please try again." });
      return;
    }
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    try {
      // Backend: /auth/login expects form-urlencoded
      const form = new URLSearchParams();
      form.append("username", formData.username.trim());
      form.append("password", formData.password);

      const { data } = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!data?.access_token) throw new Error("No access token received");

      // Persist token
      setToken(data.access_token);

      // Optional remember flag
      try {
        localStorage.setItem("remember_me", rememberMe ? "1" : "0");
      } catch {}

      // ---- Fetch current user & cache for role-based guards ----
      const me = await api.get("/auth/me");
      setUser(me.data);

      // ---- Compute redirect target ----
      const next = params.get("next");
      const roleFromMe = String(me.data?.role || "").toLowerCase();
      const role =
        (roleFromMe || getRoleFromToken(data.access_token) || "").toLowerCase();

      // Use your actual existing routes:
      const target =
        next && !["/", "/signin", "/signup"].includes(next)
          ? next
          : role === "doctor" || role === "admin"
          ? "/doctor/dashboard"
          : "/student/dashboard";

      setSuccessMessage("Successfully signed in! Redirecting...");
      setTimeout(() => navigate(target, { replace: true }), 800);
    } catch (error) {
      const apiError = error as ApiError;
      let msg = "Login failed. Please try again.";
      if (apiError.response?.status === 401)
        msg = "Invalid student ID or password.";
      else if (apiError.response?.status === 403)
        msg = "Your account is disabled.";
      else if (apiError.response?.status === 429)
        msg = "Too many attempts. Try again later.";
      else if (apiError.response?.status === 500)
        msg = "Server error. Try again later.";
      else if (apiError.response?.data?.detail)
        msg = apiError.response.data.detail;
      else if (apiError.response?.data?.message)
        msg = apiError.response.data.message;
      setErrors({ general: msg });
      setTimeout(() => usernameRef.current?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-900/90 to-pink-900/90" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute top-40 right-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1000ms" }}
          />
          <div
            className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-emerald-400/25 to-teal-500/25 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "500ms" }}
          />
        </div>
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                  DentalEd Portal
                </h1>
                <p className="text-sm text-white/70 font-medium">
                  Advanced Student Management System
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOnline ? "bg-emerald-400" : "bg-red-400"
                } animate-pulse`}
              />
              <span className="text-sm text-white/80 font-medium">
                {isOnline ? "Connected" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center px-6 py-16 min-h-screen">
        <div
          className={`w-full max-w-md transform transition-all duration-1000 ${
            isFormVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* Welcome Section */}
          <div className="text-center mb-10">
            <div className="relative group mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <LogIn className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent mb-4 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-white/70 text-lg font-medium">
              Access your dental coursework dashboard
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6 transform transition-all duration-500 hover:scale-[1.02]">
            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 rounded-2xl overflow-hidden border border-white/20 bg-black/20 mb-6">
              <NavLink
                to="/signin"
                className={({ isActive }) =>
                  "text-center py-4 font-bold transition-all duration-300 relative overflow-hidden " +
                  (isActive
                    ? "text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10")
                }
              >
                <span className="relative z-10">Sign In</span>
                {window.location.pathname === "/signin" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 animate-pulse" />
                )}
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  "text-center py-4 font-bold transition-all duration-300 relative overflow-hidden " +
                  (isActive
                    ? "text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10")
                }
              >
                <span className="relative z-10">Sign Up</span>
              </NavLink>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-2xl backdrop-blur-sm animate-pulse">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-emerald-100">Success!</p>
                  <p className="text-sm text-emerald-200">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors.general && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl backdrop-blur-sm animate-pulse">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-sm font-bold text-red-100">
                    Authentication Error
                  </p>
                  <p className="text-sm text-red-200">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Offline Warning */}
            {!isOnline && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-2xl backdrop-blur-sm animate-pulse">
                <AlertCircle className="h-6 w-6 text-amber-400" />
                <div>
                  <p className="text-sm font-bold text-amber-100">
                    Connection Issue
                  </p>
                  <p className="text-sm text-amber-200">
                    Please check your internet connection
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-white/90">
                  Student ID / Username <span className="text-pink-400">*</span>
                </label>
                <div className="relative group">
                  <input
                    ref={usernameRef}
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange("username")}
                    className={`w-full px-6 py-4 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 transform hover:scale-[1.02] focus:scale-[1.02] ${
                      errors.username
                        ? "border-red-400/50 focus:ring-red-400/50 bg-red-500/10"
                        : "border-white/20 focus:ring-cyan-400/50 hover:border-white/30"
                    }`}
                    placeholder="Enter your student ID"
                    disabled={isLoading}
                    maxLength={50}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/0 via-blue-400/0 to-purple-400/0 group-hover:from-cyan-400/10 group-hover:via-blue-400/10 group-hover:to-purple-400/10 transition-all duration-500 pointer-events-none" />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-300 flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-white/90">
                  Password <span className="text-pink-400">*</span>
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    className={`w-full px-6 py-4 pr-14 bg-white/10 backdrop-blur-sm border rounded-2xl text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 transform hover:scale-[1.02] focus:scale-[1.02] ${
                      errors.password
                        ? "border-red-400/50 focus:ring-red-400/50 bg-red-500/10"
                        : "border-white/20 focus:ring-cyan-400/50 hover:border-white/30"
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10 transform hover:scale-110"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/0 via-blue-400/0 to-purple-400/0 group-hover:from-cyan-400/10 group-hover:via-blue-400/10 group-hover:to-purple-400/10 transition-all duration-500 pointer-events-none" />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300 flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 text-sm text-white/80 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 text-cyan-400 bg-white/10 border-white/20 rounded-lg focus:ring-cyan-400/50 focus:ring-2 transition-all duration-300 transform group-hover:scale-110"
                    disabled={isLoading}
                  />
                  <span className="select-none font-medium group-hover:text-white transition-colors duration-300">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-cyan-300 hover:text-cyan-100 font-medium underline decoration-cyan-300/50 underline-offset-4 hover:decoration-cyan-100 transition-all duration-300"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isLoading || !formData.username.trim() || !formData.password || !isOnline
                }
                className="group relative w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:via-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-2xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-transparent flex items-center justify-center gap-3 shadow-2xl hover:shadow-cyan-500/25 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
                <Shield className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-lg font-black relative z-10">
                  {isLoading ? "Signing In..." : "Access Portal"}
                </span>
                {!isLoading && (
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-white/70">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text hover:from-cyan-300 hover:to-blue-300 transition-all duration-300 underline decoration-cyan-400/50 underline-offset-4"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-xs text-white/50 font-medium">
              © 2025 Dental Education Portal • Secure • Advanced • Innovative
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
