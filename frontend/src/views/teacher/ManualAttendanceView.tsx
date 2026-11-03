import React, { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Save,
  UserPlus,
  BookOpen,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  AttendanceStatus,
  Lecture,
  LectureStudent,
  Subject,
} from "../../types";

export const ManualAttendanceView: React.FC = () => {
  const toast = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);

  const [students, setStudents] = useState<LectureStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quick mark by roll
  const [quickRoll, setQuickRoll] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.listSubjects().then((subs) => {
      if (mounted && subs.length > 0) {
        setSubjects(subs);
        setSelectedSubjectId(subs[0].id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    api.listSubjectLectures(selectedSubjectId).then((lecs) => {
      setLectures(lecs);
      if (lecs.length > 0) {
        setSelectedLectureId(lecs[0].id);
      } else {
        setSelectedLectureId(null);
        setStudents([]);
      }
    });
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!selectedLectureId) return;
    setLoading(true);
    api
      .getLectureAttendance(selectedLectureId)
      .then((res) => {
        setStudents(res.students);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load lecture attendance");
        setLoading(false);
      });
  }, [selectedLectureId]);

  const setStatus = (userId: number, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, status } : s))
    );
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
    toast.info(`Marked all students as ${status}`);
  };

  const handleSave = async () => {
    if (!selectedLectureId) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        user_id: s.user_id,
        status: s.status,
      }));
      await api.saveLectureAttendance(selectedLectureId, records);
      toast.success("Attendance sheet saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLectureId || !quickRoll.trim()) return;

    setQuickLoading(true);
    try {
      const res = await api.markManualAttendance(selectedLectureId, quickRoll.trim());
      setStudents(res.students);
      toast.success(`Marked present for student ${quickRoll.trim()}`);
      setQuickRoll("");
    } catch (err: any) {
      toast.error(err.message || "Student not found in this course.");
    } finally {
      setQuickLoading(false);
    }
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-6">
      {/* Subject and Lecture Selection */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Select Subject
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

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Select Lecture
            </label>
            <select
              value={selectedLectureId || ""}
              onChange={(e) => setSelectedLectureId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary font-medium"
            >
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.held_on})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main Sheet */}
      <Card
        title="Manual Attendance Grid"
        description="Review or adjust individual student attendance entries"
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAll("present")}
            >
              Mark All Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAll("absent")}
            >
              Mark All Absent
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={students.length === 0}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {/* Quick Roll Input */}
        <form onSubmit={handleQuickMark} className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Quick mark by Roll Number (e.g. 240233111029)..."
            value={quickRoll}
            onChange={(e) => setQuickRoll(e.target.value)}
            className="flex-1 max-w-sm px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            loading={quickLoading}
            disabled={!quickRoll.trim()}
          >
            Mark Present
          </Button>
        </form>

        {/* Table */}
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Roll Number</th>
                <th className="px-5 py-3">Attendance Status</th>
                <th className="px-5 py-3 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    Loading attendance sheet...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    No students or lectures found.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.user_id} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-semibold text-foreground">
                      {s.name}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      @{s.enrollment}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          s.status === "present"
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex rounded-lg border border-border p-0.5 bg-background">
                        <button
                          onClick={() => setStatus(s.user_id, "present")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md tactile-button ${
                            s.status === "present"
                              ? "bg-foreground text-background shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => setStatus(s.user_id, "absent")}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md tactile-button ${
                            s.status === "absent"
                              ? "bg-foreground text-background shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Absent
                        </button>
                      </div>
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
