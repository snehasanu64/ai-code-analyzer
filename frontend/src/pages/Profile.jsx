import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const { data } = await api.put("/users/profile", { name });
    setUser(data.user);
    localStorage.setItem("aica_user", JSON.stringify(data.user));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="light-shell px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/workspace")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to workspace
        </button>

        <h1 className="font-display font-bold text-2xl text-gray-900 mb-8">Your profile</h1>

        <form onSubmit={handleSaveProfile} className="light-card p-6 mb-6 space-y-4">
          <h2 className="font-display font-semibold text-gray-900">Account details</h2>
          <input className="light-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Username" />
          <input className="light-input opacity-60" value={user?.email} disabled />
          <button type="submit" className="light-btn-primary">
            {saved ? "Saved ✓" : <>Save changes <Save className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
