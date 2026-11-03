import {
  AppMeta,
  AuthSession,
  DashboardOut,
  Lecture,
  LectureAttendanceOut,
  ReadinessResponse,
  RecognitionOut,
  Role,
  StudentInSubject,
  StudentReportOut,
  Subject,
  User,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "hajree_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes("/auth/login")) {
    // Attempt token refresh
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
      });
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as AuthSession;
        setStoredToken(data.access_token);
        headers.set("Authorization", `Bearer ${data.access_token}`);
        const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({ detail: "Request failed" }));
          throw new Error(err.detail || "Request failed");
        }
        return (await retryRes.json()) as T;
      }
    } catch {
      setStoredToken(null);
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const err = await response.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      // Non-JSON response
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<AuthSession> {
    const session = await request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(session.access_token);
    return session;
  },

  async register(data: {
    username: string;
    name: string;
    email?: string;
    password: string;
    role: Role;
  }): Promise<AuthSession> {
    const session = await request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setStoredToken(session.access_token);
    return session;
  },

  async me(): Promise<User> {
    return request<User>("/auth/me");
  },

  async logout(): Promise<void> {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      setStoredToken(null);
    }
  },

  // Users
  async listUsers(role?: Role, search?: string): Promise<User[]> {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (search) params.set("search", search);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<User[]>(`/users${qs}`);
  },

  async createUser(data: {
    username: string;
    name: string;
    email?: string;
    password: string;
    role: Role;
  }): Promise<User> {
    return request<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateUser(
    userId: number,
    data: { name?: string; email?: string; is_active?: boolean; role?: Role }
  ): Promise<User> {
    return request<User>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteUser(userId: number): Promise<void> {
    return request<void>(`/users/${userId}`, { method: "DELETE" });
  },

  async uploadUserFace(userId: number, file: File): Promise<{ message: string; enrolled_count: number }> {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ message: string; enrolled_count: number }>(`/users/${userId}/face`, {
      method: "POST",
      body: formData,
    });
  },

  async getUserFaceStatus(userId: number): Promise<{ user_id: number; enrolled_count: number; is_enrolled: boolean; target_count: number; images: string[] }> {
    return request(`/users/${userId}/face`);
  },

  // Subjects
  async listSubjects(): Promise<Subject[]> {
    return request<Subject[]>("/subjects");
  },

  async createSubject(name: string): Promise<Subject> {
    return request<Subject>("/subjects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async deleteSubject(subjectId: number): Promise<void> {
    return request<void>(`/subjects/${subjectId}`, { method: "DELETE" });
  },

  async listSubjectStudents(subjectId: number): Promise<StudentInSubject[]> {
    return request<StudentInSubject[]>(`/subjects/${subjectId}/students`);
  },

  async enrollStudents(subjectId: number, userIds: number[]): Promise<void> {
    return request<void>(`/subjects/${subjectId}/students`, {
      method: "POST",
      body: JSON.stringify({ user_ids: userIds }),
    });
  },

  async removeStudentFromSubject(subjectId: number, userId: number): Promise<void> {
    return request<void>(`/subjects/${subjectId}/students/${userId}`, {
      method: "DELETE",
    });
  },

  async listSubjectLectures(subjectId: number): Promise<Lecture[]> {
    return request<Lecture[]>(`/subjects/${subjectId}/lectures`);
  },

  async createLecture(
    subjectId: number,
    name: string,
    heldOn?: string
  ): Promise<Lecture> {
    return request<Lecture>(`/subjects/${subjectId}/lectures`, {
      method: "POST",
      body: JSON.stringify({ name, held_on: heldOn || undefined }),
    });
  },

  // Lectures & Attendance
  async getLectureAttendance(lectureId: number): Promise<LectureAttendanceOut> {
    return request<LectureAttendanceOut>(`/lectures/${lectureId}/attendance`);
  },

  async saveLectureAttendance(
    lectureId: number,
    records: { user_id: number; status: string }[]
  ): Promise<LectureAttendanceOut> {
    return request<LectureAttendanceOut>(`/lectures/${lectureId}/attendance`, {
      method: "PUT",
      body: JSON.stringify({ records }),
    });
  },

  async markManualAttendance(
    lectureId: number,
    enrollment: string
  ): Promise<LectureAttendanceOut> {
    return request<LectureAttendanceOut>(`/lectures/${lectureId}/attendance/manual`, {
      method: "POST",
      body: JSON.stringify({ enrollment }),
    });
  },

  exportCsvUrl(lectureId: number): string {
    return `${BASE_URL}/lectures/${lectureId}/attendance/export/csv`;
  },

  exportPdfUrl(lectureId: number): string {
    return `${BASE_URL}/lectures/${lectureId}/attendance/export/pdf`;
  },

  async notifyLowAttendance(
    lectureId: number,
    threshold: number = 75
  ): Promise<{ queued: number }> {
    return request<{ queued: number }>(
      `/lectures/${lectureId}/attendance/notify?threshold=${threshold}`,
      { method: "POST" }
    );
  },

  // Attendance Reports
  async getDashboard(subjectId: number, threshold: number = 75): Promise<DashboardOut> {
    return request<DashboardOut>(
      `/attendance/dashboard?subject_id=${subjectId}&threshold=${threshold}`
    );
  },

  async getMyReport(): Promise<StudentReportOut> {
    return request<StudentReportOut>("/attendance/me");
  },

  // Recognition
  async recognizePhoto(subjectId: number, file: File): Promise<RecognitionOut> {
    const formData = new FormData();
    formData.append("file", file);
    return request<RecognitionOut>(`/recognition?subject_id=${subjectId}`, {
      method: "POST",
      body: formData,
    });
  },

  // Meta & Health
  async getMeta(): Promise<AppMeta> {
    return request<AppMeta>("/meta");
  },

  async getReadiness(): Promise<ReadinessResponse> {
    return request<ReadinessResponse>("/health/ready");
  },
};
