import React from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Camera,
  CalendarCheck,
  FileSpreadsheet,
  Activity,
  UserCheck,
  History,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../types";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onCloseMobile?: () => void;
}

export const navItems: NavItem[] = [
  // Admin Tabs
  {
    id: "admin-overview",
    label: "System Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    id: "admin-users",
    label: "User Management",
    icon: <Users className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    id: "admin-subjects",
    label: "Subject Management",
    icon: <BookOpen className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    id: "admin-health",
    label: "AI Engine Health",
    icon: <Activity className="w-4 h-4" />,
    roles: ["admin"],
  },

  // Teacher Tabs
  {
    id: "teacher-dashboard",
    label: "Attendance Analytics",
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ["teacher"],
  },
  {
    id: "teacher-ai-attendance",
    label: "AI Face Recognition",
    icon: <Camera className="w-4 h-4" />,
    roles: ["teacher"],
  },
  {
    id: "teacher-manual",
    label: "Manual Attendance",
    icon: <CalendarCheck className="w-4 h-4" />,
    roles: ["teacher"],
  },
  {
    id: "teacher-reports",
    label: "Reports & Exports",
    icon: <FileSpreadsheet className="w-4 h-4" />,
    roles: ["teacher"],
  },

  // Student Tabs
  {
    id: "student-dashboard",
    label: "My Attendance",
    icon: <UserCheck className="w-4 h-4" />,
    roles: ["student"],
  },
  {
    id: "student-history",
    label: "Lecture History",
    icon: <History className="w-4 h-4" />,
    roles: ["student"],
  },
  {
    id: "student-face",
    label: "Face Enrollment",
    icon: <Sparkles className="w-4 h-4" />,
    roles: ["student"],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const allowedItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleSelect = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 border-r border-border/60 bg-card/60 backdrop-blur-xl flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg text-foreground tracking-tight">
              Hajree
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              v2.0
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">
            AI Attendance Platform
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {user.role === "admin"
            ? "Admin Portal"
            : user.role === "teacher"
            ? "Faculty Portal"
            : "Student Portal"}
        </div>
        {allowedItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 tactile-button ${
                isActive
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/20 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <span className={`shrink-0 ${isActive ? "text-white" : ""}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-border/60">
        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-foreground">
              Face Recognition
            </span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase">
              SFace-CNN
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-normal">
            Liveness & anti-spoofing enabled for fast multi-face capture.
          </p>
        </div>
      </div>
    </aside>
  );
};
