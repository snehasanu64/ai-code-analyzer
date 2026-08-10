// Local-only storage for a user's personal OpenAI/Gemini key, read by the
// axios interceptor and sent as request headers. Never touches the backend
// database — this stays entirely in the user's own browser.
const STORAGE_KEY = "aica_workspace_keys";

export const PROVIDERS = [
  {
    key: "openai",
    label: "OpenAI (recommended)",
    models: [
      { key: "gpt-4o-mini", label: "gpt-4o-mini (Recommended)" },
      { key: "gpt-4o", label: "gpt-4o" },
      { key: "gpt-4-turbo", label: "gpt-4-turbo" },
      { key: "o1-mini", label: "o1-mini" },
    ],
    keyPlaceholder: "e.g., sk-proj-...",
  },
  {
    key: "gemini",
    label: "Google Gemini",
    models: [
      { key: "gemini-1.5-flash", label: "gemini-1.5-flash (Recommended)" },
      { key: "gemini-1.5-pro", label: "gemini-1.5-pro" },
      { key: "gemini-2.0-flash", label: "gemini-2.0-flash" },
    ],
    keyPlaceholder: "e.g., AIzaSy...",
  },
];

export function getWorkspaceKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWorkspaceKeys(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearWorkspaceKeys() {
  localStorage.removeItem(STORAGE_KEY);
}
