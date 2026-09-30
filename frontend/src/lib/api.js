import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_PROXY_TARGET || ""}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

// ─── Locations ─────────────────────────────────────────────────────────────
export const locationsApi = {
  getAll: () => api.get("/locations"),
};

// ─── Fares ─────────────────────────────────────────────────────────────────
export const faresApi = {
  estimate: (data) => api.post("/fares/estimate", data),
};

// ─── Rides ─────────────────────────────────────────────────────────────────
export const ridesApi = {
  create: (data) => api.post("/rides", data),
  getActive: () => api.get("/rides/active"),
  getById: (id) => api.get(`/rides/${id}`),
  updatePoolingPreference: (id, poolingPreference) =>
    api.patch(`/rides/${id}/pooling-preference`, { poolingPreference }),
  cancel: (id) => api.post(`/rides/${id}/cancel`),
  getHistory: () => api.get("/rides/history"),
};

// ─── Pools ─────────────────────────────────────────────────────────────────
export const poolsApi = {
  getById: (id) => api.get(`/pools/${id}`),
  getMatching: () => api.get("/pools/matching"),
  getActive: () => api.get("/pools/active"),
  arrive: (id) => api.post(`/pools/${id}/arrive`),
  start: (id) => api.post(`/pools/${id}/start`),
  complete: (id) => api.post(`/pools/${id}/complete`),
  getHistory: () => api.get("/pools/history"),
};

// ─── Offers ────────────────────────────────────────────────────────────────
export const offersApi = {
  getAll: () => api.get("/offers"),
  accept: (id) => api.post(`/offers/${id}/accept`),
  reject: (id) => api.post(`/offers/${id}/reject`),
};

// ─── Vehicles ──────────────────────────────────────────────────────────────
export const vehiclesApi = {
  getMe: () => api.get("/vehicles/me"),
  updateStatus: (online) => api.patch("/vehicles/status", { online }),
};

export default api;
