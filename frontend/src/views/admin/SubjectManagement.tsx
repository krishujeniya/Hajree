import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Users,
  Trash2,
  CalendarCheck,
  UserCheck,
  UserX,
  Search,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { StudentInSubject, Subject, User } from "../../types";

export const SubjectManagement: React.FC = () => {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Subject Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Manage Students Modal
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentInSubject[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>("");

  const fetchData = async () => {
    try {
      const [subs, users] = await Promise.all([
        api.listSubjects(),
        api.listUsers("student"),
      ]);
      setSubjects(subs);
      setAllUsers(users);
    } catch (err: any) {
      toast.error(err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    setCreateLoading(true);
    try {
      await api.createSubject(newSubjectName.trim());
      toast.success("Subject created successfully!");
      setCreateModalOpen(false);
      setNewSubjectName("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create subject");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSubject = async (id: number, name: string) => {
    if (!window.confirm(`Delete course "${name}" and all associated lectures?`)) {
      return;
    }
    try {
      await api.deleteSubject(id);
      toast.success("Subject removed");
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete subject");
    }
  };

  const openStudentsModal = async (subject: Subject) => {
    setSelectedSubject(subject);
    setStudentsLoading(true);
    try {
      const list = await api.listSubjectStudents(subject.id);
      setEnrolledStudents(list);
    } catch (err: any) {
      toast.error("Failed to load students for this subject");
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedSubject || !selectedStudentToAdd) return;
    try {
      await api.enrollStudents(selectedSubject.id, [Number(selectedStudentToAdd)]);
      toast.success("Student enrolled in course");
      setSelectedStudentToAdd("");
      const list = await api.listSubjectStudents(selectedSubject.id);
      setEnrolledStudents(list);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll student");
    }
  };

  const handleRemoveStudent = async (userId: number) => {
    if (!selectedSubject) return;
    try {
      await api.removeStudentFromSubject(selectedSubject.id, userId);
      toast.success("Student unenrolled");
      setEnrolledStudents((prev) => prev.filter((s) => s.id !== userId));
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove student");
    }
  };

  const enrolledIds = new Set(enrolledStudents.map((s) => s.id));
  const availableStudents = allUsers.filter((u) => !enrolledIds.has(u.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Academic Subjects & Courses
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure lecture subjects, faculty instructors, and student rosters
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Subject
        </Button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-12">
            Loading subjects...
          </p>
        ) : subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-12">
            No subjects created yet. Click "Create Subject" to get started.
          </p>
        ) : (
          subjects.map((sub) => (
            <Card key={sub.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-md">
                    COURSE #{sub.id}
                  </span>
                  <button
                    onClick={() => handleDeleteSubject(sub.id, sub.name)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 tactile-button transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {sub.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Enrolled Students:{" "}
                  <span className="font-semibold text-foreground">
                    {sub.student_count || 0}
                  </span>
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-border/50 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => openStudentsModal(sub)}
                  icon={<Users className="w-3.5 h-3.5" />}
                >
                  Manage Roster ({sub.student_count || 0})
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Subject Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Subject"
        description="Enter the course title or subject code (e.g. CS301 - Computer Vision)"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="e.g. CS301 - Machine Learning Systems"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createLoading}>
              Save Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Students Modal */}
      <Modal
        isOpen={Boolean(selectedSubject)}
        onClose={() => setSelectedSubject(null)}
        title={`Roster: ${selectedSubject?.name}`}
        description="Enroll or remove students eligible for AI attendance in this course."
        maxWidth="xl"
      >
        <div className="space-y-4 pt-2">
          {/* Add Student Control */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStudentToAdd}
              onChange={(e) => setSelectedStudentToAdd(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="">Select student to enroll...</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (@{s.username})
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={!selectedStudentToAdd}
              onClick={handleEnrollStudent}
              icon={<UserCheck className="w-4 h-4" />}
            >
              Enroll
            </Button>
          </div>

          {/* Enrolled Students Table */}
          <div className="max-h-80 overflow-y-auto border border-border rounded-xl divide-y divide-border">
            {studentsLoading ? (
              <p className="text-xs text-center py-8 text-muted-foreground">
                Loading roster...
              </p>
            ) : enrolledStudents.length === 0 ? (
              <p className="text-xs text-center py-8 text-muted-foreground">
                No students enrolled in this course yet.
              </p>
            ) : (
              enrolledStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      @{s.username} • {s.face_count}/10 Face Models
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(s.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 tactile-button"
                    title="Remove from course"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="secondary" onClick={() => setSelectedSubject(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
