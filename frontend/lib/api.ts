import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cb_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("cb_token");
      localStorage.removeItem("cb_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; password: string; full_name: string; consent_given: boolean }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }),
};

export const healthApi = {
  uploadLab: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/health/labs/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  // Labs: POST returns {id, status:"pending"}, GET polls for complete
  analyzeLabs: (data: object) => api.post("/health/labs/analyze", data),
  getLabs: () => api.get("/health/labs"),
  getLab: (id: string) => api.get(`/health/labs/${id}`),

  // Symptoms: POST returns {id, status:"pending"}, GET polls
  analyzeSymptoms: (data: object) => api.post("/health/symptoms/analyze", data),
  getSymptom: (id: string) => api.get(`/health/symptoms/${id}`),

  addTimeline: (data: object) => api.post("/health/timeline/add", data),
  getTimeline: (metric_type?: string) =>
    api.get("/health/timeline", { params: metric_type ? { metric_type } : {} }),

  // Medications: POST returns {id, status:"pending"}, GET polls
  analyzeMedications: (medications: string[]) =>
    api.post("/health/medications/analyze", { medications }),
  getMedication: (id: string) => api.get(`/health/medications/${id}`),

  // Generic job poll (for report, triage, doctor-visit, query, trend, prevention, route)
  getJob: (id: string) => api.get(`/health/jobs/${id}`),
  // Submit a signed tx hash back to the backend (path relative to /api/v1)
  submitTx: (submitPath: string, data: { tx_hash: string; record_id?: string }) =>
    api.post(submitPath, data),
  // Poll any path (returns {id, status, result, tx_hash})
  pollPath: (path: string) => api.get(path),

  // Now all async — POST returns {id, status:"pending"}, poll getJob()
  summarizeReport: (report_text: string, report_type?: string) =>
    api.post("/health/reports/summarize", { report_text, report_type }),
  triage: (data: object) => api.post("/health/triage", data),
  prepareDoctorVisit: (data: object) => api.post("/health/doctor-visit/prepare", { data }),
  healthQuery: (question: string, language: string) =>
    api.post("/health/query", { data: { question, language } }),
  interpretTrend: (data: object) => api.post("/health/trend/interpret", { data }),
  preventionPlan: (data: object) => api.post("/health/prevention/plan", { data }),
  routeToCare: (data: object) => api.post("/health/route", { data }),
};

export const userApi = {
  profile: () => api.get("/users/me"),
  updateProfile: (data: { full_name?: string; preferred_language?: string }) =>
    api.patch("/users/me", data),
  wallet: () => api.get("/users/me/wallet"),
};

export const adminApi = {
  stats: () => api.get("/admin/stats"),
  users: () => api.get("/admin/users"),
  updateUser: (id: string, data: { role?: string; is_active?: boolean; is_verified?: boolean; new_password?: string }) =>
    api.patch(`/admin/users/${id}`, data),
};
