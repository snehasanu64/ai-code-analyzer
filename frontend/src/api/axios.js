import axios from "axios";
import { getWorkspaceKeys } from "../utils/workspaceKeys";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aica_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const workspaceKeys = getWorkspaceKeys();
  if (workspaceKeys?.apiKey && workspaceKeys?.provider) {
    config.headers["X-AI-Provider"] = workspaceKeys.provider;
    config.headers["X-AI-Api-Key"] = workspaceKeys.apiKey;
    if (workspaceKeys.model) config.headers["X-AI-Model"] = workspaceKeys.model;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("aica_token");
      localStorage.removeItem("aica_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
