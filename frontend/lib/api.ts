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
      window.location.href = "/auth/login";
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
    return api.post("/health/labs/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  analyzeLabs: (data: object) => api.post("/health/labs/analyze", data),
  getLabs: () => api.get("/health/labs"),
  getLab: (id: string) => api.get(`/health/labs/${id}`),

  analyzeSymptoms: (data: object) => api.post("/health/symptoms/analyze", data),

  addTimeline: (data: object) => api.post("/health/timeline/add", data),
  getTimeline: (metric_type?: string) =>
    api.get("/health/timeline", { params: metric_type ? { metric_type } : {} }),

  analyzeMedications: (medications: string[]) =>
    api.post("/health/medications/analyze", { medications }),

  summarizeReport: (report_text: string, report_type?: string) =>
    api.post("/health/reports/summarize", { report_text, report_type }),

  triage: (data: object) => api.post("/health/triage", data),
};

export const userApi = {
  profile: () => api.get("/users/me"),
  wallet: () => api.get("/users/me/wallet"),
};
