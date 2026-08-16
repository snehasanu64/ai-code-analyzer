import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("aica_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("aica_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("aica_user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("aica_token");
        localStorage.removeItem("aica_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const register = async (name, email) => {
    const { data } = await api.post("/auth/quick-login", { name, email });
    localStorage.setItem("aica_token", data.token);
    localStorage.setItem("aica_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const sendOtp = async (name, email) => {
    const { data } = await api.post("/auth/send-otp", { name, email });
    return data;
  };

  const verifyOtp = async (name, email, otp) => {
    const { data } = await api.post("/auth/verify-otp", { name, email, otp });
    localStorage.setItem("aica_token", data.token);
    localStorage.setItem("aica_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("aica_token");
    localStorage.removeItem("aica_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, register, sendOtp, verifyOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
