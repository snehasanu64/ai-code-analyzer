import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Loader2, Eye, EyeOff, Clipboard, ExternalLink, AlertCircle } from "lucide-react";
import api from "../../api/axios";

const PROVIDERS = [
  { key: "gemini", label: "Google Gemini (Recommended)", defaultModel: "gemini-2.5-flash" },
  { key: "openai", label: "OpenAI", defaultModel: "gpt-4o-mini" },
  { key: "mock", label: "Sandbox / Mock Engine (no key needed)", defaultModel: "" },
];

export default function WorkspaceKeysModal({ open, onClose }) {
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(true); // Default to visible so user can see what they paste
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSaved(false);
    setApiKey("");
    setShowKey(true);
    setLoading(true);
    api
      .get("/users/workspace-keys")
      .then(({ data }) => {
        const wk = data.workspaceKeys;
        setExisting(wk);
        const activeProv = wk.provider || "gemini";
        setProvider(activeProv);
        setModel(wk.model || PROVIDERS.find((p) => p.key === activeProv)?.defaultModel || "gemini-1.5-flash");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const handleProviderChange = (key) => {
    setProvider(key);
    const preset = PROVIDERS.find((p) => p.key === key);
    setModel(preset?.defaultModel || "");
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKey(text.trim());
      }
    } catch (err) {
      console.warn("Clipboard access denied", err);
    }
  };

  const isGeminiWarning = provider === "gemini" && apiKey.trim().length > 0 && !apiKey.trim().startsWith("AIza");

  const handleResetToMock = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/workspace-keys", { provider: "mock", model: "", apiKey: "" });
      setExisting(data.workspaceKeys);
      setProvider("mock");
      setApiKey("");
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/users/workspace-keys", { provider, model, apiKey });
      setExisting(data.workspaceKeys);
      setApiKey("");
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-gray-900 leading-tight">Workspace Keys</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Use your personal Gemini or OpenAI API key.</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-5" autoComplete="off">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    LLM Service Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="light-input font-medium"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {provider !== "mock" && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        Selected Model
                      </label>
                      <input
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder={provider === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini"}
                        className="light-input font-mono text-sm"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Private API Key
                        </label>
                        {existing?.hasKey && !apiKey && (
                          <span className="text-[10px] text-emerald-600 font-medium">Key saved ✓</span>
                        )}
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type={showKey ? "text" : "password"}
                          name="workspace_api_key_nofill"
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={
                            existing?.hasKey
                              ? existing.keyPreview
                              : provider === "gemini"
                              ? "AIzaSy..."
                              : "sk-proj-..."
                          }
                          className="light-input font-mono text-sm pr-24"
                        />
                        <div className="absolute right-2 flex items-center gap-1 bg-white pl-1">
                          <button
                            type="button"
                            onClick={handlePaste}
                            className="px-2 py-1 text-xs text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md font-medium flex items-center gap-1"
                            title="Paste from clipboard"
                          >
                            <Clipboard className="w-3 h-3" /> Paste
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowKey((v) => !v)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                            title={showKey ? "Hide key" : "Show key"}
                          >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isGeminiWarning && (
                        <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>Check Key Format:</strong> Google Gemini API keys usually start with <code>AIzaSy...</code> from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline font-semibold">Google AI Studio</a>.
                          </div>
                        </div>
                      )}

                      {provider === "gemini" && (
                        <div className="mt-2.5 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Don't have a Gemini Key?</span>
                          <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            Get free key on Google AI Studio <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                        Your key is encrypted and saved securely to your account.
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="light-btn-primary w-full !py-3.5 !rounded-2xl uppercase tracking-wide text-sm disabled:opacity-60"
                  >
                    {saving ? "Saving..." : saved ? "Saved ✓" : "Save Workspace Config"}
                  </button>

                  {provider !== "mock" && (
                    <button
                      type="button"
                      onClick={handleResetToMock}
                      className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                      Reset to Sandbox Engine (No API key needed)
                    </button>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
