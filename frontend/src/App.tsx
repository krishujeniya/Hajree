import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { LoginPage } from "./views/auth/LoginPage";
import { RegisterPage } from "./views/auth/RegisterPage";
import { LandingPage } from "./marketing/LandingPage";

// Admin Views
import { AdminOverview } from "./views/admin/AdminOverview";
import { UserManagement } from "./views/admin/UserManagement";
import { SubjectManagement } from "./views/admin/SubjectManagement";
import { SystemHealth } from "./views/admin/SystemHealth";

// Teacher Views
import { TeacherDashboard } from "./views/teacher/TeacherDashboard";
import { AIAttendanceView } from "./views/teacher/AIAttendanceView";
import { ManualAttendanceView } from "./views/teacher/ManualAttendanceView";
import { ReportsView } from "./views/teacher/ReportsView";

// Student Views
import { StudentDashboard } from "./views/student/StudentDashboard";
import { StudentAttendanceHistory } from "./views/student/StudentAttendanceHistory";
import { FaceEnrollmentView } from "./views/student/FaceEnrollmentView";

import { Camera, Loader2 } from "lucide-react";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">(() => window.location.pathname === "/register" ? "register" : "login");
  const [activeTab, setActiveTab] = useState<string>("");

  // The public product story remains available regardless of authentication status.
  // Keep existing authenticated workflows on /app, /login and /register.
  if (window.location.pathname === "/") return <LandingPage />;

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="w-14 h-14 rounded-xl bg-card flex items-center justify-center text-foreground border border-border mb-4">
          <Camera className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading your workspace</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (authView === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView("register")} />;
  }

  // Determine current active tab based on authorized role
  const defaultTabForRole = (role: string) => {
    if (role === "admin") return "admin-overview";
    if (role === "teacher") return "teacher-dashboard";
    return "student-dashboard";
  };

  const allowedTabsForRole = (role: string) => {
    if (role === "admin") return ["admin-overview", "admin-users", "admin-subjects", "admin-health"];
    if (role === "teacher") return ["teacher-dashboard", "teacher-ai-attendance", "teacher-manual", "teacher-reports"];
    return ["student-dashboard", "student-history", "student-face"];
  };

  const currentTab =
    activeTab && allowedTabsForRole(user.role).includes(activeTab)
      ? activeTab
      : defaultTabForRole(user.role);

  return (
    <DashboardLayout activeTab={currentTab} onSelectTab={setActiveTab}>
      {/* Admin Views */}
      {currentTab === "admin-overview" && (
        <AdminOverview onNavigate={setActiveTab} />
      )}
      {currentTab === "admin-users" && <UserManagement />}
      {currentTab === "admin-subjects" && <SubjectManagement />}
      {currentTab === "admin-health" && <SystemHealth />}

      {/* Teacher Views */}
      {currentTab === "teacher-dashboard" && <TeacherDashboard />}
      {currentTab === "teacher-ai-attendance" && <AIAttendanceView />}
      {currentTab === "teacher-manual" && <ManualAttendanceView />}
      {currentTab === "teacher-reports" && <ReportsView />}

      {/* Student Views */}
      {currentTab === "student-dashboard" && (
        <StudentDashboard onNavigate={setActiveTab} />
      )}
      {currentTab === "student-history" && <StudentAttendanceHistory />}
      {currentTab === "student-face" && <FaceEnrollmentView />}
    </DashboardLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
