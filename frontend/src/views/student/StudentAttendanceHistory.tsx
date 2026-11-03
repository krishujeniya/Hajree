import React, { useEffect, useState } from "react";
import { History, Calendar, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { Card } from "../../components/common/Card";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { StudentLectureRecord, StudentReportOut } from "../../types";

export const StudentAttendanceHistory: React.FC = () => {
  const toast = useToast();
  const [report, setReport] = useState<StudentReportOut | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .getMyReport()
      .then((rep) => {
        if (mounted) {
          setReport(rep);
          setLoading(false);
        }
      })
      .catch((err) => {
        toast.error("Failed to load attendance history");
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const allRecords: (StudentLectureRecord & { subject: string })[] = [];
  report?.subjects.forEach((sub) => {
    sub.records.forEach((rec) => {
      allRecords.push({ ...rec, subject: sub.subject });
    });
  });

  // Sort descending by date
  allRecords.sort((a, b) => (a.held_on < b.held_on ? 1 : -1));

  const filtered = allRecords.filter((rec) => {
    if (selectedSubjectFilter === "all") return true;
    return rec.subject === selectedSubjectFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Lecture Attendance History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log of all academic lecture sessions and your biometric attendance marks
          </p>
        </div>

        {/* Course Filter */}
        {report && report.subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-semibold">
              Filter Course:
            </label>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Courses</option>
              {report.subjects.map((s) => (
                <option key={s.subject_id} value={s.subject}>
                  {s.subject}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3.5">Session / Lecture</th>
                <th className="px-6 py-3.5">Course</th>
                <th className="px-6 py-3.5">Date Held</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Loading lecture history...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No lecture sessions recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {rec.lecture}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {rec.subject}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {rec.held_on}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          rec.status === "present"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {rec.status === "present" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
