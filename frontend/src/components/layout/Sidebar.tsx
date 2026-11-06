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
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    id: "admin-users",
    label: "Accounts",
    icon: <Users className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    id: "admin-subjects",
    label: "Courses",
    icon: <BookOpen className="w-4 h-4" />,
    roles: ["admin"],
  },
  {
    id: "admin-health",
    label: "Diagnostics",
    icon: <Activity className="w-4 h-4" />,
    roles: ["admin"],
  },

  // Teacher Tabs
  {
    id: "teacher-dashboard",
    label: "Analytics",
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ["teacher"],
  },
  {
    id: "teacher-ai-attendance",
    label: "AI Camera",
    icon: <Camera className="w-4 h-4" />,
    roles: ["teacher"],
  },
  {
    id: "teacher-manual",
    label: "Roll Call",
    icon: <CalendarCheck className="w-4 h-4" />,
    roles: ["teacher"],
  },
  {
    id: "teacher-reports",
    label: "Registers & Export",
    icon: <FileSpreadsheet className="w-4 h-4" />,
    roles: ["teacher"],
  },

  // Student Tabs
  {
    id: "student-dashboard",
    label: "My Standing",
    icon: <UserCheck className="w-4 h-4" />,
    roles: ["student"],
  },
  {
    id: "student-history",
    label: "Session Log",
    icon: <History className="w-4 h-4" />,
    roles: ["student"],
  },
  {
    id: "student-face",
    label: "Face Profile",
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
    <aside className="w-64 border-r border-border/70 bg-card/40  flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border/60">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-white to-zinc-400 dark:from-white dark:to-zinc-500 flex items-center justify-center text-black shadow-md">
          <Camera className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-base text-foreground tracking-tight">
              Hajree
            </span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border border-border bg-muted/60 text-muted-foreground">
              v2.0
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Biometric Attendance
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {user.role === "admin"
            ? "Administration"
            : user.role === "teacher"
            ? "Faculty Control"
            : "Student Portal"}
        </div>
        {allowedItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 apple-button ${
                isActive
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-border/60">
        <div className="p-3 rounded-xl border border-border/80 bg-muted/30 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-foreground">
              DeepFace Engine
            </span>
            <span className="text-xs text-zinc-400 font-mono uppercase font-bold">
              SFace
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-normal">
            Precision cosine vector similarity with liveness anti-spoofing.
          </p>
        </div>
      </div>
    </aside>
  );
};
