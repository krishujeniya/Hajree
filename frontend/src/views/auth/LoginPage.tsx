import React, { useState } from "react";
import { Camera, Lock, User, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("changeme");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      toast.success("Welcome back to Hajree!");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string, roleName: string) => {
    setUsername(u);
    setPassword(p);
    toast.info(`Filled credentials for ${roleName}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-xl shadow-indigo-500/30 mb-4 animate-in zoom-in-75 duration-300">
            <Camera className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Hajree.ai
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Next-Generation AI Attendance Management System
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-2xl p-7 shadow-xl shadow-black/5">
          {/* Quick Demo Selector */}
          <div className="mb-6 pb-5 border-b border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>One-Click Demo Credentials:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("admin", "changeme", "Admin")}
                className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition-all duration-150 tactile-button text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo("teacher", "changeme", "Faculty")}
                className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition-all duration-150 tactile-button text-center"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => fillDemo("student", "changeme", "Student")}
                className="px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition-all duration-150 tactile-button text-center"
              >
                Student
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Username / Enrollment ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, teacher, or student"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 mt-2"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Hajree
            </Button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              New student?{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold underline underline-offset-2"
              >
                Create student account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
