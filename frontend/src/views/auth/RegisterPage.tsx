import React, { useState } from "react";
import { Camera, Lock, User, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
}) => {
  const { register } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim() || !password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        password: password.trim(),
        role: "student",
      });
      toast.success("Account created successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 shadow-sm border border-border/40 overflow-hidden">
            <img
              src={`${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}/logo.svg`}
              alt="Hajree Logo"
              className="w-12 h-12"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Student Enrollment
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create account for neural biometric attendance
          </p>
        </div>

        <div className="apple-glass rounded-xl p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:ring-1 focus:ring-white/40 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Roll Number / ID *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <span className="text-xs font-mono">#</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="240233111050"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:ring-1 focus:ring-white/40 transition-colors font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:ring-1 focus:ring-white/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:ring-1 focus:ring-white/40 transition-colors"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 mt-2"
              loading={loading}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>

          <div className="mt-5 text-center pt-4 border-t border-border/50">
            <button
              onClick={onSwitchToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
