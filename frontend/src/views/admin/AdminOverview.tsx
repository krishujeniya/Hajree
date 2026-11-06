import React, { useEffect, useState } from "react";
import { Users, GraduationCap, Briefcase, BookOpen, Activity, ShieldCheck, ArrowRight } from "lucide-react";
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
    .reduce((acc, u) => acc + ((u.face_image_count ?? 0) > 0 ? 1 : 0), 0);

  const stats = [
    {
      title: "Students",
      value: studentsCount,
      subtext: `${enrolledFacesCount} face models registered`,
      icon: <GraduationCap className="w-4 h-4 text-white" />,
    },
    {
      title: "Faculty",
      value: teachersCount,
      subtext: "Assigned course instructors",
      icon: <Briefcase className="w-4 h-4 text-white" />,
    },
    {
      title: "Courses",
      value: subjects.length,
      subtext: "Tracked academic subjects",
      icon: <BookOpen className="w-4 h-4 text-white" />,
    },
    {
      title: "Engine Status",
      value: "Online",
      subtext: "DeepFace SFace Active",
      icon: <ShieldCheck className="w-4 h-4 text-white" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cupertino Titanium Header Card */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-8 text-white shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold bg-white/10  border border-white/15 text-zinc-300 mb-3 normal-case tracking-normal">
            <Activity className="w-3 h-3 text-white" />
            <span>Institutional Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            System Administration
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
            Manage facial embeddings, student course rosters, faculty permissions, and verify neural inference pipeline status.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate("admin-users")}
              icon={<Users className="w-3.5 h-3.5" />}
            >
              Manage Accounts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("admin-subjects")}
              icon={<BookOpen className="w-3.5 h-3.5" />}
            >
              Academic Courses
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => (
          <Card key={idx} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground normal-case tracking-normal">
                {item.title}
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center">
                {item.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {loading ? "..." : item.value}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{item.subtext}</p>
          </Card>
        ))}
      </div>

      {/* Courses & Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Active Courses"
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
            <p className="text-xs text-muted-foreground py-4 text-center">Loading subjects...</p>
          ) : subjects.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No subjects created yet.</p>
          ) : (
            <div className="space-y-2">
              {subjects.slice(0, 4).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 text-white flex items-center justify-center font-mono font-bold text-xs">
                      #{sub.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground tracking-tight">
                        {sub.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Biometric tracking active
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
          description="Latest accounts registered in the database"
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
            <p className="text-xs text-muted-foreground py-4 text-center">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.slice(0, 4).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700/60 text-white font-bold text-xs flex items-center justify-center uppercase">
                      {u.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground tracking-tight">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        @{u.username} • {u.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-border bg-muted/40 text-foreground font-mono">
                    {u.role === "student" ? `${u.face_image_count ?? 0}/10 Faces` : u.role}
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
