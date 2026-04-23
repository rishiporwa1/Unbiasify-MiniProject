import { useState, useEffect } from "react";
import axios from "axios";
import LiquidEther from "./Components/LiquidEther";

const API = "https://unbiasify-miniproject.onrender.com/api";

// ─── AXIOS INSTANCE ────────────────────────────────────────────────────────
const api = axios.create({ baseURL: API });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── SENTIMENT COLORS ──────────────────────────────────────────────────────
const sentimentStyle = {
  Positive: "text-green-400",
  Negative: "text-red-400",
  Neutral: "text-yellow-300",
};

// ═══════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════════════
function Navbar({ page, setPage, user, onLogout }) {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-3 rounded-full flex items-center gap-8 shadow-[0_8px_30px_rgba(0,0,0,0.6)] z-50">
      <div
        className="font-semibold cursor-pointer hover:text-purple-300 transition"
        onClick={() => setPage("home")}
      >
        Unbiasify
      </div>

      <div className="flex gap-6 text-sm items-center">
        {user ? (
          <>
            <button
              onClick={() => setPage("home")}
              className={`hover:text-purple-300 transition ${page === "home" ? "text-purple-300" : ""}`}
            >
              Analyze
            </button>
            <button
              onClick={() => setPage("profile")}
              className={`hover:text-purple-300 transition ${page === "profile" ? "text-purple-300" : ""}`}
            >
              Profile
            </button>
            <button
              onClick={onLogout}
              className="hover:text-red-400 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setPage("login")}
              className={`hover:text-purple-300 transition ${page === "login" ? "text-purple-300" : ""}`}
            >
              Login
            </button>
            <button
              onClick={() => setPage("register")}
              className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition"
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS CARD WRAPPER
// ═══════════════════════════════════════════════════════════════════════════
function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${className}`}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
function LoginPage({ setPage, onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    if (!form.username || !form.password) {
      setError("Fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/login/`, form);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      onLogin({ username: res.data.username, email: res.data.email });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handle}
            className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handle}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p className="text-center text-white/50 text-sm mt-5">
          No account?{" "}
          <span
            className="text-purple-300 cursor-pointer hover:underline"
            onClick={() => setPage("register")}
          >
            Register
          </span>
        </p>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER PAGE
// ═══════════════════════════════════════════════════════════════════════════
function RegisterPage({ setPage, onLogin }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    if (!form.username || !form.password) {
      setError("Username and password are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/register/`, form);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      onLogin({ username: res.data.username, email: res.data.email });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handle}
            className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            name="email"
            type="email"
            placeholder="Email (optional)"
            value={form.email}
            onChange={handle}
            className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 8 chars)"
            value={form.password}
            onChange={handle}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full p-3 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </div>

        <p className="text-center text-white/50 text-sm mt-5">
          Already have an account?{" "}
          <span
            className="text-purple-300 cursor-pointer hover:underline"
            onClick={() => setPage("login")}
          >
            Login
          </span>
        </p>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME / ANALYZE PAGE
// ═══════════════════════════════════════════════════════════════════════════
function HomePage({ user, setPage }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeText = async () => {
    setError("");
    setResult(null);

    if (!text.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    if (text.trim().length > 5000) {
      setError("Text too long. Max 5000 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/analyze/", { text });
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError(err.response?.data?.error || "Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
        <span className="text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]">
          Unbiasify
        </span>
      </h1>
      <p className="text-white/50 text-sm mb-10">AI-powered sentiment & bias detection</p>

      {!user && (
        <div className="mb-6 px-5 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-sm">
          <span
            className="cursor-pointer underline"
            onClick={() => setPage("login")}
          >
            Login
          </span>{" "}
          or{" "}
          <span
            className="cursor-pointer underline"
            onClick={() => setPage("register")}
          >
            Register
          </span>{" "}
          to analyze text and save your history.
        </div>
      )}

      <GlassCard className="w-full max-w-[520px] p-8">
        <textarea
          className="w-full p-4 rounded-lg bg-black/30 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          rows="5"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex justify-between items-center mt-1 mb-4 text-xs text-white/30">
          <span>{text.length} / 5000 characters</span>
          {text.length > 0 && (
            <span
              className="cursor-pointer hover:text-white/60 transition"
              onClick={() => { setText(""); setResult(null); setError(""); }}
            >
              Clear
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={user ? analyzeText : () => setPage("login")}
          className="w-full px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition shadow-lg disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Analyzing..." : user ? "Analyze" : "Login to Analyze"}
        </button>

        {result && (
          <div className="mt-6 p-4 rounded-xl bg-black/30 border border-white/10 text-left space-y-2">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-3">Result</p>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Sentiment</span>
              <span className={`font-bold text-lg ${sentimentStyle[result.sentiment]}`}>
                {result.sentiment}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Polarity Score</span>
              <span className="font-mono text-white">{result.polarity}</span>
            </div>
            {/* Polarity bar */}
            <div className="mt-3">
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    result.polarity > 0 ? "bg-green-400" : result.polarity < 0 ? "bg-red-400" : "bg-yellow-300"
                  }`}
                  style={{ width: `${((result.polarity + 1) / 2) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>-1 Negative</span>
                <span>+1 Positive</span>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════════════════════════════════════
function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/");
        setProfile(res.data);
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await api.get("/history/");
        setHistory(res.data);
      } catch {
        setError("Failed to load history.");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchProfile();
    fetchHistory();
  }, []);

  return (
    <div className="flex-grow flex flex-col items-center px-4 pt-36 pb-12 gap-6 w-full max-w-2xl mx-auto">

      {error && (
        <div className="w-full px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <GlassCard className="w-full p-6">
        {loadingProfile ? (
          <p className="text-white/40 text-center">Loading profile...</p>
        ) : profile ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-2xl font-bold text-purple-300">
                {profile.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold">{profile.username}</p>
                <p className="text-white/50 text-sm">{profile.email || "No email set"}</p>
                <p className="text-white/30 text-xs">Joined {profile.date_joined}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: "Total", value: profile.total_analyses, color: "text-white" },
                { label: "Positive", value: profile.positive, color: "text-green-400" },
                { label: "Negative", value: profile.negative, color: "text-red-400" },
                { label: "Neutral", value: profile.neutral, color: "text-yellow-300" },
              ].map((s) => (
                <div key={s.label} className="bg-black/20 rounded-xl p-3">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-white/40 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </GlassCard>

      {/* History Card */}
      <GlassCard className="w-full p-6">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-4">Recent Analyses</p>

        {loadingHistory ? (
          <p className="text-white/40 text-center">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-white/30 text-center text-sm">No analyses yet. Go analyze some text!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-black/20 rounded-xl p-4 border border-white/5"
              >
                <div className="flex justify-between items-start gap-3 mb-1">
                  <p className="text-white/80 text-sm flex-1 leading-relaxed">{item.text}</p>
                  <span className={`text-sm font-semibold shrink-0 ${sentimentStyle[item.sentiment]}`}>
                    {item.sentiment}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-white/30">
                  <span>Polarity: {item.polarity}</span>
                  <span>{item.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access");
    const username = localStorage.getItem("username");
    return token && username ? { username } : null;
  });

  const onLogin = (userData) => {
    localStorage.setItem("username", userData.username);
    setUser(userData);
    setPage("home");
  };

  const onLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    setUser(null);
    setPage("home");
  };

  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-hidden">

      {/* LIQUID BACKGROUND */}
      <div className="absolute inset-0 -z-10 w-full h-full">
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
        />
      </div>

      <Navbar page={page} setPage={setPage} user={user} onLogout={onLogout} />

      {page === "home" && <HomePage user={user} setPage={setPage} />}
      {page === "login" && <LoginPage setPage={setPage} onLogin={onLogin} />}
      {page === "register" && <RegisterPage setPage={setPage} onLogin={onLogin} />}
      {page === "profile" && user && <ProfilePage user={user} />}
      {page === "profile" && !user && (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-white/50">Please login to view your profile.</p>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full py-6 bg-black/40 backdrop-blur-xl border-t border-white/10 text-center text-white/40 text-sm">
        AI Bias Detection • 2026 • Built with React + Django
      </footer>
    </div>
  );
}