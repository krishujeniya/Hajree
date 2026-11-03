export type Role = "admin" | "teacher" | "student";

export type AttendanceStatus = "present" | "absent" | "late";

export interface User {
  id: number;
  username: string;
  name: string;
  email?: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  face_count: number;
}

export interface AuthSession {
  access_token: string;
  expires_in: number;
  user: User;
}

export interface Subject {
  id: number;
  name: string;
  created_at: string;
  teacher_count?: number;
  student_count?: number;
  lecture_count?: number;
}

export interface StudentInSubject {
  id: number;
  username: string;
  name: string;
  email?: string | null;
  face_count: number;
}

export interface Lecture {
  id: number;
  subject_id: number;
  name: string;
  held_on: string;
  created_at: string;
  present_count: number;
  total_students: number;
}

export interface LectureStudent {
  user_id: number;
  enrollment: string;
  name: string;
  status: AttendanceStatus;
}

export interface LectureAttendanceOut {
  lecture: Lecture;
  students: LectureStudent[];
  present_count: number;
  absent_count: number;
}

export interface DashboardMetrics {
  total_students: number;
  total_lectures: number;
  overall_attendance: number;
  defaulter_count: number;
}

export interface TrendPoint {
  lecture_id: number;
  lecture: string;
  held_on: string;
  present: number;
  total: number;
  percentage: number;
}

export interface ReportStudent {
  user_id: number;
  enrollment: string;
  name: string;
  email?: string | null;
  present: number;
  total: number;
  percentage: number;
  marks: Record<string, AttendanceStatus>;
}

export interface DashboardOut {
  subject: {
    id: number;
    name: string;
  };
  threshold: number;
  metrics: DashboardMetrics;
  trends: TrendPoint[];
  students: ReportStudent[];
  defaulters: ReportStudent[];
}

export interface StudentLectureRecord {
  lecture_id: number;
  lecture: string;
  held_on: string;
  status: AttendanceStatus;
}

export interface StudentSubjectReport {
  subject_id: number;
  subject: string;
  total_lectures: number;
  present: number;
  percentage: number;
  records: StudentLectureRecord[];
}

export interface StudentReportOut {
  overall_percentage: number;
  subjects: StudentSubjectReport[];
}

export interface RecognitionMatch {
  user_id: number;
  username: string;
  name: string;
  distance: number;
  confidence: number;
}

export interface RecognitionFace {
  box: [number, number, number, number];
  match?: RecognitionMatch | null;
}

export interface RecognitionOut {
  total_faces: number;
  matches: RecognitionMatch[];
  faces: RecognitionFace[];
}

export interface AppMeta {
  app_name: string;
  version: string;
  environment: string;
  self_registration: boolean;
  enrollment_target: number;
  logo_url?: string | null;
  docs_url?: string | null;
}

export interface ReadinessResponse {
  status: string;
  database: boolean;
  face_index_entries: number;
  model_warm: boolean;
}
