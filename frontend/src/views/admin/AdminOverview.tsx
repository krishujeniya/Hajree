import React, { useEffect, useState } from "react";
import { Users, GraduationCap, Briefcase, BookOpen, Activity, ShieldCheck, Plus, ArrowRight } from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { api } from "../../api/client";
import { User, Subject } from "../../types";

interface AdminOverviewProps {
  onNavigate: (tabId: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.listUsers(), api.listSubjects()])
      .then(([u, s]) => {
        if (mounted) {
          setUsers(u);
          setSubjects(s);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const studentsCount = users.filter((u) => u.role === "student").length;
  const teachersCount = users.filter((u) => u.role === "teacher").length;
  const enrolledFacesCount = users
    .filter((u) => u.role === "student")
    .reduce((acc, u) => acc + (u.face_count > 0 ? 1 : 0), 0);

  const stats = [
    {
      title: "Total Students",
      value: studentsCount,
      subtext: `${enrolledFacesCount} with trained face models`,
      icon: <GraduationCap className="w-5 h-5 text-indigo-500" />,
      bg: "bg-indigo-500/10",
    },
    {
      title: "Faculty Members",
      value: teachersCount,
      subtext: "Assigned course instructors",
      icon: <Briefcase className="w-5 h-5 text-emerald-500" />,
      bg: "bg-emerald-500/10",
    },
    {
      title: "Active Courses",
      value: subjects.length,
      subtext: "Tracked academic subjects",
      icon: <BookOpen className="w-5 h-5 text-amber-500" />,
      bg: "bg-amber-500/10",
    },
    {
      title: "System Status",
      value: "Operational",
      subtext: "DeepFace SFace model active",
      icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
      bg: "bg-sky-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 mb-3">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enterprise Attendance Engine</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Administration Center
          </h2>
          <p className="text-sm text-indigo-100/80 mt-2 leading-relaxed">
            Monitor institution-wide biometric face recognition, enroll new students, configure faculty assignments, and verify neural inference pipeline status.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate("admin-users")}
              icon={<Users className="w-4 h-4" />}
            >
              Manage Users
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("admin-subjects")}
              className="text-white border-white/20 hover:bg-white/10"
              icon={<BookOpen className="w-4 h-4" />}
            >
              Manage Courses
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => (
          <Card key={idx} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {item.title}
              </span>
              <div className={`p-2 rounded-xl ${item.bg}`}>{item.icon}</div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {loading ? "..." : item.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{item.subtext}</p>
          </Card>
        ))}
      </div>

      {/* Quick Launch & Courses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Active Academic Courses"
          description="Courses currently registered with biometric tracking"
          headerAction={
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate("admin-subjects")}
            >
              View All
            </Button>
          }
        >
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading subjects...</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No subjects created yet.</p>
          ) : (
            <div className="space-y-2.5">
              {subjects.slice(0, 4).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                      #{sub.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {sub.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Biometric tracking enabled
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigate("admin-subjects")}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Recent User Registrations"
          description="Latest student & faculty accounts registered"
          headerAction={
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate("admin-users")}
            >
              View Users
            </Button>
          }
        >
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No users found.</p>
          ) : (
            <div className="space-y-2.5">
              {users.slice(0, 4).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center uppercase">
                      {u.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        @{u.username} • {u.role}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      u.face_count > 0
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {u.role === "student"
                      ? `${u.face_count}/10 Faces`
                      : u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
