import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { LoginPage } from "./views/auth/LoginPage";
import { RegisterPage } from "./views/auth/RegisterPage";

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
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<string>("");

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 animate-pulse mb-4">
          <Camera className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Starting Hajree...</span>
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

  // Determine current active tab if not set
  let currentTab = activeTab;
  if (!currentTab) {
    if (user.role === "admin") currentTab = "admin-overview";
    else if (user.role === "teacher") currentTab = "teacher-dashboard";
    else currentTab = "student-dashboard";
  }

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
