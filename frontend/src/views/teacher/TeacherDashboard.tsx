import React, { useEffect, useState } from "react";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Mail,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { DashboardOut, Subject } from "../../types";

export const TeacherDashboard: React.FC = () => {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DashboardOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(75);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .listSubjects()
      .then((subs) => {
        if (mounted) {
          setSubjects(subs);
          if (subs.length > 0) {
            setSelectedSubjectId(subs[0].id);
          } else {
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        toast.error("Failed to load subjects");
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    setLoading(true);
    api
      .getDashboard(selectedSubjectId, threshold)
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load dashboard metrics");
        setLoading(false);
      });
  }, [selectedSubjectId, threshold]);

  const handleNotifyDefaulters = async () => {
    if (!selectedSubjectId || !dashboard) return;
    if (dashboard.defaulters.length === 0) {
      toast.info("No defaulters in this subject under threshold!");
      return;
    }

    setNotifying(true);
    try {
      // Find latest lecture
      const lectures = await api.listSubjectLectures(selectedSubjectId);
      if (lectures.length === 0) {
        toast.error("Please create at least one lecture first.");
        return;
      }
      const latest = lectures[0];
      const res = await api.notifyLowAttendance(latest.id, threshold);
      toast.success(
        `Dispatched low attendance notification emails to ${res.queued} students!`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch email notifications");
    } finally {
      setNotifying(false);
    }
  };

  const metrics = dashboard?.metrics;

  return (
    <div className="space-y-6">
      {/* Top Filter & Course Switcher */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <BookOpen className="w-5 h-5 text-foreground shrink-0" />
            <div className="w-full sm:w-80">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Select Active Subject
              </label>
              <select
                value={selectedSubjectId || ""}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary font-medium"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Defaulter Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary font-mono text-center"
                />
                <span className="text-sm font-bold text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Enrolled Students
            </span>
            <Users className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {loading ? "..." : metrics?.total_students || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Registered for this course
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Lectures
            </span>
            <Calendar className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {loading ? "..." : metrics?.total_lectures || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Completed lecture sessions
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg. Attendance Rate
            </span>
            <TrendingUp className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {loading ? "..." : `${metrics?.overall_attendance.toFixed(1) || 0}%`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all enrolled students
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Defaulters Alert
            </span>
            <AlertTriangle className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {loading ? "..." : metrics?.defaulter_count || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Under {threshold}% attendance
          </p>
        </Card>
      </div>

      {/* Defaulters Section */}
      <Card
        title={`Attendance Defaulters (< ${threshold}%)`}
        description="Students at risk of examination debarment due to low attendance"
        headerAction={
          <Button
            size="sm"
            variant="outline"
            onClick={handleNotifyDefaulters}
            loading={notifying}
            disabled={!dashboard?.defaulters || dashboard.defaulters.length === 0}
            icon={<Mail className="w-4 h-4" />}
          >
            Email Defaulters ({dashboard?.defaulters.length || 0})
          </Button>
        }
      >
        {loading ? (
          <p className="text-xs text-center py-6 text-muted-foreground">
            Checking attendance records...
          </p>
        ) : !dashboard?.defaulters || dashboard.defaulters.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-foreground">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">
              Excellent! No students fall below the {threshold}% attendance threshold.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll / Enrollment</th>
                  <th className="px-4 py-3">Attended</th>
                  <th className="px-4 py-3">Attendance %</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {dashboard.defaulters.map((s) => (
                  <tr key={s.user_id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      @{s.enrollment}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {s.present} of {s.total} lectures
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-foreground">
                      {s.percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 tracking-wider">
                        Critical Defaulter
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
