import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Video,
  VideoOff,
  UserCheck,
  Save,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { Lecture, RecognitionOut, StudentInSubject, Subject } from "../../types";

export const AIAttendanceView: React.FC = () => {
  const toast = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);
  const [newLectureName, setNewLectureName] = useState("");
  const [students, setStudents] = useState<StudentInSubject[]>([]);

  // Camera & Image state
  const [mode, setMode] = useState<"webcam" | "upload">("upload");
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Recognition state
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionOut | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initial Load
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
      stopWebcam();
    };
  }, []);

  // When subject changes, load lectures and enrolled students
  useEffect(() => {
    if (!selectedSubjectId) return;
    api.listSubjectLectures(selectedSubjectId).then((lecs) => {
      setLectures(lecs);
      if (lecs.length > 0) {
        setSelectedLectureId(lecs[0].id);
      } else {
        setSelectedLectureId(null);
      }
    });
    api.listSubjectStudents(selectedSubjectId).then((stus) => {
      setStudents(stus);
      // Initialize all to absent by default
      const initialMap: Record<number, boolean> = {};
      stus.forEach((s) => {
        initialMap[s.id] = false;
      });
      setAttendanceMap(initialMap);
    });
  }, [selectedSubjectId]);

  // Webcam Controls
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setWebcamActive(true);
      toast.info("Webcam feed active. Center classroom faces in view.");
    } catch (err: any) {
      toast.error("Could not access camera. Please check browser permissions.");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          stopWebcam();
          toast.success("Snapshot captured! Ready for AI Face Recognition.");
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setCapturedBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRecognitionResult(null);
    setSavedSuccess(false);
    toast.info("Classroom photo loaded.");
  };

  // Run AI Face Recognition
  const handleRunRecognition = async () => {
    if (!selectedSubjectId || !capturedBlob) {
      toast.error("Please provide a photo first.");
      return;
    }

    setRecognizing(true);
    setSavedSuccess(false);
    try {
      const file = new File([capturedBlob], "classroom.jpg", {
        type: "image/jpeg",
      });
      const result = await api.recognizePhoto(selectedSubjectId, file);
      setRecognitionResult(result);

      // Auto-mark matched students as Present
      const matchedUserIds = new Set(result.matches.map((m) => m.user_id));
      setAttendanceMap((prev) => {
        const next = { ...prev };
        students.forEach((s) => {
          if (matchedUserIds.has(s.id)) {
            next[s.id] = true;
          }
        });
        return next;
      });

      toast.success(
        `AI Analysis complete: Detected ${result.total_faces} faces, matched ${result.matches.length} students!`
      );
    } catch (err: any) {
      toast.error(err.message || "Face recognition failed. Please try again.");
    } finally {
      setRecognizing(false);
    }
  };

  const toggleStudent = (userId: number) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCreateNewLecture = async () => {
    if (!selectedSubjectId || !newLectureName.trim()) return;
    try {
      const lec = await api.createLecture(selectedSubjectId, newLectureName.trim());
      toast.success(`Created "${lec.name}"`);
      setLectures((prev) => [lec, ...prev]);
      setSelectedLectureId(lec.id);
      setNewLectureName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create lecture");
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedLectureId) {
      toast.error("Please select or create a lecture first.");
      return;
    }

    setSaving(true);
    try {
      const records = students.map((s) => ({
        user_id: s.id,
        status: attendanceMap[s.id] ? "present" : "absent",
      }));

      await api.saveLectureAttendance(selectedLectureId, records);
      setSavedSuccess(true);
      toast.success("Attendance successfully marked and saved to lecture!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-6">
      {/* Session Header Card */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject & Lecture */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              1. Select Subject Course
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
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              2. Target Lecture Session
            </label>
            <div className="flex gap-2">
              <select
                value={selectedLectureId || ""}
                onChange={(e) => setSelectedLectureId(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary font-medium"
              >
                {lectures.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.held_on})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="+ New lecture name"
                value={newLectureName}
                onChange={(e) => setNewLectureName(e.target.value)}
                className="w-40 px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCreateNewLecture}
                disabled={!newLectureName.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Capture & AI Processing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image / Video Input (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title="Classroom Biometric Capture"
            description="Take a live photo via webcam or upload a classroom group picture"
            headerAction={
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border text-xs">
                <button
                  onClick={() => {
                    setMode("upload");
                    stopWebcam();
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all tactile-button ${
                    mode === "upload"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  File Upload
                </button>
                <button
                  onClick={() => {
                    setMode("webcam");
                    startWebcam();
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all tactile-button ${
                    mode === "webcam"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Live Webcam
                </button>
              </div>
            }
          >
            {mode === "webcam" ? (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/90 border border-border flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Overlays */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Live 720p Stream</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={captureWebcamSnapshot}
                    icon={<Camera className="w-4 h-4" />}
                  >
                    Capture Attendance Snapshot
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {previewUrl ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted/30 border border-border">
                    <img
                      src={previewUrl}
                      alt="Classroom preview"
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute bottom-3 right-3 cursor-pointer">
                      <span className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-medium hover:bg-black/90 tactile-button shadow-sm">
                        Change Photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-border hover:border-foreground/40 cursor-pointer p-6 text-center transition-colors bg-muted/10">
                    <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-semibold text-foreground">
                      Upload Classroom Group Photo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Supports wide-angle group shots, classroom photos, and student face clusters (JPEG, PNG, WebP)
                    </p>
                    <span className="mt-4 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 tactile-button shadow-sm">
                      Select Photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
            )}

            {/* AI Action Trigger */}
            {previewUrl && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  Ready to run DeepFace SFace feature extraction.
                </div>
                <Button
                  onClick={handleRunRecognition}
                  loading={recognizing}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Run AI Recognition
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Attendance Verification & Submission (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Attendance Sheet Review"
            description="Toggle student chips or finalize batch attendance"
            headerAction={
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-foreground text-background">
                  {presentCount} Present
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {absentCount} Absent
                </span>
              </div>
            }
          >
            {recognitionResult && (
              <div className="mb-4 p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <div className="flex items-center justify-between font-semibold text-foreground mb-1">
                  <span>Recognition Summary</span>
                  <span>{recognitionResult.matches.length} Matched</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Found {recognitionResult.total_faces} faces in frame. Matched against enrolled student vector database.
                </p>
              </div>
            )}

            {/* Students Attendance List */}
            <div className="max-h-96 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {students.length === 0 ? (
                <p className="text-xs text-center py-8 text-muted-foreground">
                  No students enrolled in this course.
                </p>
              ) : (
                students.map((student) => {
                  const isPresent = attendanceMap[student.id];
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex items-center justify-between p-3 cursor-pointer select-none transition-colors ${
                        isPresent
                          ? "bg-muted/40"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                            isPresent
                              ? "bg-foreground text-background shadow-sm"
                              : "border border-border text-muted-foreground"
                          }`}
                        >
                          {isPresent ? "✓" : ""}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {student.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            @{student.username}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isPresent
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {isPresent ? "Present" : "Absent"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Finalize Button */}
            <div className="pt-4 mt-2 border-t border-border flex flex-col gap-2">
              <Button
                className="w-full py-2.5"
                onClick={handleSaveAttendance}
                loading={saving}
                disabled={!selectedLectureId || students.length === 0}
                icon={<Save className="w-4 h-4" />}
              >
                Confirm & Save Attendance
              </Button>

              {savedSuccess && selectedLectureId && (
                <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-200">
                  <a
                    href={api.exportPdfUrl(selectedLectureId)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground text-center flex items-center justify-center gap-1.5 tactile-button"
                  >
                    <FileText className="w-3.5 h-3.5 text-foreground" />
                    <span>Download PDF</span>
                  </a>
                  <a
                    href={api.exportCsvUrl(selectedLectureId)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground text-center flex items-center justify-center gap-1.5 tactile-button"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-foreground" />
                    <span>Export CSV</span>
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
