import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const rawApi = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").trim().replace(/\/+$/, "");
const API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

const api = axios.create({ baseURL: API });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

function IconFluxLogo() {
  return (
    <div className="w-8 h-8 rounded-xl bg-[#d2f84b] flex items-center justify-center shrink-0 shadow-sm">
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" stroke="#16171a">
        <path d="M6 7V11C6 14.314 8.686 17 12 17C15.314 17 18 14.314 18 11V7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2" fill="#16171a" stroke="none" />
      </svg>
    </div>
  );
}

function IconDashboard() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconReports() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="w-4 h-4 text-[#8c9099]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="w-4 h-4 text-[#16171a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function IconEye({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconEyeOff({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder = "Enter password",
  id,
  name,
  required = true,
  minLength,
  autoComplete,
  className = "",
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        type={show ? "text" : "password"}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={cn(
          "w-full rounded-2xl bg-[#f9fafb] border border-[#e8eaee] px-4 py-3 pr-11 text-xs font-semibold text-[#111214] placeholder-[#8c9099] focus:outline-none focus:ring-2 focus:ring-[#d2f84b] focus:border-transparent transition",
          className
        )}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c9099] hover:text-[#111214] p-1.5 rounded-lg transition cursor-pointer"
        title={show ? "Hide password" : "Show password"}
      >
        {show ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── CONFIGURATION CONSTANTS ─────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  loaded_language: {
    label: "Loaded Language",
    desc: "Emotionally charged or absolute terms intended to bias the reader.",
    color: "bg-[#b6b0fc]",
    chip: "bg-[#f0effe] border border-[#d3ceff] text-[#4b3fbd]",
    underline: "underline decoration-[#b6b0fc] decoration-2 underline-offset-4",
  },
  unsupported_generalization: {
    label: "Generalization",
    desc: "Sweeping claims made without nuance, exceptions, or factual attribution.",
    color: "bg-[#16171a]",
    chip: "bg-[#f4f5f7] border border-[#e2e4e8] text-[#16171a]",
    underline: "underline decoration-[#16171a] decoration-2 underline-offset-4",
  },
  stereotyping: {
    label: "Stereotyping",
    desc: "Associating universal characteristics or behaviors with identity groups.",
    color: "bg-[#d2f84b]",
    chip: "bg-[#f7fde6] border border-[#dcf589] text-[#415309]",
    underline: "underline decoration-[#d2f84b] decoration-2 underline-offset-4",
  },
  one_sided_framing: {
    label: "One-Sided Framing",
    desc: "Selectively highlighting favorable facts while omitting counterpoints.",
    color: "bg-[#fca5a5]",
    chip: "bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]",
    underline: "underline decoration-[#fca5a5] decoration-2 underline-offset-4",
  },
};

const CONTEXTS = [
  { value: "general", label: "General Writing" },
  { value: "job_post", label: "Job Post" },
  { value: "academic", label: "Academic" },
  { value: "news", label: "News/Media" },
  { value: "social", label: "Social Media" },
];

const SAMPLE_PROMPTS = [
  "Women are not good at technical jobs.",
  "I absolutely loved this product — it exceeded all my expectations!",
  "The meeting is scheduled for tomorrow at 3 PM.",
  "Rich people are always more successful.",
  "Everyone knows that conservatives never care about the environment.",
  "Studies show that the majority of millennials are lazy and entitled.",
];

// ─── BASE REUSABLE COMPONENTS ────────────────────────────────────────────────

function BentoCard({ children, className = "" }) {
  return (
    <div className={cn("bg-white rounded-3xl p-6 shadow-sm border border-[#e8eaee] text-[#111214]", className)}>
      {children}
    </div>
  );
}

function Spinner({ size = "md" }) {
  const s = size === "sm" ? "w-4 h-4 border-2" : "w-8 h-8 border-3";
  return <span className={cn(s, "border-black/10 border-t-[#d2f84b] rounded-full animate-spin inline-block")} />;
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="px-4 py-3 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] text-xs font-semibold flex items-center gap-2">
      <span>⚠️</span>
      <span>{msg}</span>
    </div>
  );
}

function SuccessMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="px-4 py-3 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs font-semibold flex items-center gap-2">
      <span>✅</span>
      <span>{msg}</span>
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 cursor-pointer"
      type="button"
    >
      <div className={cn(
        "w-9 h-5 rounded-full relative transition-colors duration-200",
        value ? "bg-[#16171a]" : "bg-[#e2e4e8]"
      )}>
        <div className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
          value ? "left-4.5" : "left-0.5"
        )} />
      </div>
      {label && <span className="text-xs font-bold text-[#5f6672]">{label}</span>}
    </button>
  );
}

// ─── HIGHLIGHTED TEXT IN RESULTS ──────────────────────────────────────────────

function HighlightedText({ text, findings, onFindingClick, activeIdx }) {
  if (!findings || findings.length === 0) {
    return <p className="text-[#111214] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const sorted = [...findings].sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;

  for (let i = 0; i < sorted.length; i++) {
    const f = sorted[i];
    if (f.start < cursor) continue;
    if (f.start > cursor) {
      segments.push({ type: "plain", text: text.slice(cursor, f.start) });
    }
    const originalIdx = findings.indexOf(f);
    segments.push({ type: "finding", text: text.slice(f.start, f.end), finding: f, idx: originalIdx });
    cursor = f.end;
  }
  if (cursor < text.length) {
    segments.push({ type: "plain", text: text.slice(cursor) });
  }

  return (
    <p className="text-[#111214] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === "plain") return <span key={i}>{seg.text}</span>;
        const catCfg = CATEGORY_CONFIG[seg.finding.category] || {};
        const isActive = activeIdx === seg.idx;
        return (
          <button
            key={i}
            onClick={() => onFindingClick(seg.idx)}
            className={cn(
              "cursor-pointer rounded px-1 transition-all font-semibold",
              catCfg.underline,
              isActive ? "bg-[#d2f84b] text-[#16171a]" : "hover:bg-black/5"
            )}
            title={catCfg.label}
          >
            {seg.text}
          </button>
        );
      })}
    </p>
  );
}

function FeedbackButtons({ analysisId, findingIndex }) {
  const [sent, setSent] = useState(null);
  const [loading, setLoading] = useState(false);

  const send = async (type) => {
    if (sent || loading) return;
    setLoading(true);
    try {
      await api.post("/feedback/", { analysis_id: analysisId, finding_index: findingIndex, feedback_type: type });
      setSent(type);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  if (sent) return <span className="text-xs font-bold text-[#15803d]">Feedback recorded!</span>;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-bold text-[#8c9099] mr-1">Feedback:</span>
      {[{ type: "useful", label: "👍 Accurate" }, { type: "irrelevant", label: "👎 Irrelevant" }].map((btn) => (
        <button
          key={btn.type}
          onClick={() => send(btn.type)}
          disabled={loading}
          className="text-[11px] px-2.5 py-1 rounded-full bg-[#f4f5f7] border border-[#e2e4e8] text-[#111214] hover:bg-[#e8eaee] font-bold transition disabled:opacity-40 cursor-pointer"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ─── ANALYZE PAGE (CLEAN, NO FAKE DATA) ────────────────────────────────────────

function AnalyzePage({ user, setPage, setResultState }) {
  const [text, setText] = useState("");
  const [context, setContext] = useState("general");
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef();

  const analyzeText = async () => {
    setError("");
    if (!text.trim()) { setError("Enter some text to analyze."); return; }
    if (text.length > 5000) { setError("Text too long. Max 5,000 characters."); return; }
    setLoading(true);
    try {
      const res = await api.post("/analyze/", { text, context, save: saveToHistory });
      setResultState({ result: res.data, originalText: text });
      setPage("results");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(err.response?.data?.error || "Something went wrong. Try again.");
      }
    } finally { setLoading(false); }
  };

  const useSample = (s) => { setText(s); setError(""); textareaRef.current?.focus(); };
  const clear = () => { setText(""); setError(""); };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111214] tracking-tight">Perspective Workspace</h1>
          <p className="text-sm font-medium text-[#717682] mt-1">
            Real-time linguistic bias detection, loaded framing analysis, and neutral phrasing recommendations.
          </p>
        </div>
      </div>

      {/* Editor Bento Card */}
      <BentoCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#8c9099] mr-1">Context:</span>
            {CONTEXTS.map((c) => (
              <button
                key={c.value}
                onClick={() => setContext(c.value)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                  context === c.value
                    ? "bg-[#16171a] text-white shadow-xs"
                    : "bg-[#f4f5f7] text-[#5f6672] hover:bg-[#e8eaee]"
                )}
              >
                #{c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-[#8c9099]">{text.length} / 5,000</span>
            {user && <Toggle value={saveToHistory} onChange={setSaveToHistory} label="Save" />}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          className="w-full bg-[#f9fafb] border border-[#e8eaee] rounded-2xl p-4 text-[#111214] placeholder-[#8c9099] text-sm sm:text-base leading-relaxed resize-none focus:outline-none focus:border-[#16171a] font-sans transition-all"
          rows={6}
          placeholder="Paste or write any text here to inspect for loaded language, stereotyping, and framing slant…"
          value={text}
          onChange={(e) => { setText(e.target.value); setError(""); }}
        />

        {error && <div className="mt-3"><ErrorMsg msg={error} /></div>}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-2">
          {/* Excerpt prompts */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-[#8c9099] mr-1">Quick tests:</span>
            {SAMPLE_PROMPTS.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => useSample(s)}
                className="px-3 py-1 rounded-full bg-[#f4f5f7] hover:bg-[#e8eaee] text-[#5f6672] hover:text-[#111214] font-medium transition truncate max-w-[220px] cursor-pointer"
                title={s}
              >
                "{s}"
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {text.length > 0 && (
              <button
                onClick={clear}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-[#5f6672] hover:bg-[#f4f5f7] transition cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={analyzeText}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#16171a] hover:bg-black text-white text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {loading ? (
                <><Spinner size="sm" /> <span>Inspecting…</span></>
              ) : (
                <>
                  <span>Inspect Bias & Slant</span>
                  <span className="w-5 h-5 rounded-full bg-[#d2f84b] text-[#16171a] flex items-center justify-center text-xs font-black">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </BentoCard>

      {/* Modern Bento Feature Grid (Standard Project Color Code) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: 4-Axis Bias Matrix */}
        <BentoCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d2f84b]" />
                <h3 className="font-extrabold text-sm text-[#111214]">4-Axis Bias Matrix</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f4f5f7] text-[#5f6672]">
                Calibrated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#f9fafb] border border-[#e8eaee] flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#16171a]">Emotive</span>
                <p className="font-extrabold text-xs text-[#111214] mt-1">Loaded Language</p>
                <p className="text-[10px] text-[#5f6672] mt-0.5 leading-tight">Charged adjectives & sensationalism</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f9fafb] border border-[#e8eaee] flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#16171a]">Sweeping</span>
                <p className="font-extrabold text-xs text-[#111214] mt-1">Generalization</p>
                <p className="text-[10px] text-[#5f6672] mt-0.5 leading-tight">Claims without factual attribution</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f9fafb] border border-[#e8eaee] flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#16171a]">Demographic</span>
                <p className="font-extrabold text-xs text-[#111214] mt-1">Stereotyping</p>
                <p className="text-[10px] text-[#5f6672] mt-0.5 leading-tight">Attributing roles to social groups</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f9fafb] border border-[#e8eaee] flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#16171a]">Selective</span>
                <p className="font-extrabold text-xs text-[#111214] mt-1">One-Sided</p>
                <p className="text-[10px] text-[#5f6672] mt-0.5 leading-tight">Omitting counter-arguments</p>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Card 2: Tone & Sentiment Metrics */}
        <BentoCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b6b0fc]" />
                <h3 className="font-extrabold text-sm text-[#111214]">Tone & Readability</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f4f5f7] text-[#5f6672]">
                Multivariate
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Spectrum indicator */}
              <div className="p-3 rounded-2xl bg-[#f9fafb] border border-[#e8eaee]">
                <div className="flex justify-between items-center text-[11px] font-extrabold text-[#111214] mb-1.5">
                  <span>Sentiment Polarity</span>
                  <span className="text-[#8c9099] font-mono">−1.0 → +1.0</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#e8eaee] overflow-hidden">
                  <div className="h-full bg-[#d2f84b] rounded-full w-2/3" />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-[#8c9099] mt-1">
                  <span>Critical (−1.0)</span>
                  <span>Neutral (0.0)</span>
                  <span>Favorable (+1.0)</span>
                </div>
              </div>

              {/* Tone dimensions */}
              <div className="p-3 rounded-2xl bg-[#f9fafb] border border-[#e8eaee] space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#5f6672]">Formality Spectrum</span>
                  <span className="font-black text-[#111214]">Diction Rigor</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#5f6672]">Warmth Index</span>
                  <span className="font-black text-[#111214]">Empathic Tone</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#5f6672]">Flesch Accessibility</span>
                  <span className="font-black text-[#111214]">Reading Ease</span>
                </div>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Card 3: Advisory Engine (Standard White BentoCard) */}
        <BentoCard className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16171a]" />
                <h3 className="font-extrabold text-sm text-[#111214]">Advisory Engine</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f4f5f7] text-[#5f6672]">
                Privacy First
              </span>
            </div>

            <p className="text-xs text-[#5f6672] leading-relaxed font-medium mb-4">
              Scans sentences against weighted heuristic attribution patterns. Never issues legal verdicts — surfaces evidence for human context.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f9fafb] border border-[#e8eaee]">
                <span className="w-4 h-4 rounded-full bg-[#d2f84b] text-[#16171a] flex items-center justify-center text-[10px] font-black">✓</span>
                <span className="font-bold text-[#111214]">Character-level span citations</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f9fafb] border border-[#e8eaee]">
                <span className="w-4 h-4 rounded-full bg-[#16171a] text-white flex items-center justify-center text-[10px] font-black">🔒</span>
                <span className="font-bold text-[#111214]">Ephemeral in-memory processing option</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f0f2f5] flex items-center justify-between text-[11px] font-bold text-[#8c9099]">
            <span>Deterministic Scoring</span>
            <span className="text-[#16171a] font-mono font-bold">100% Private</span>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}

// ─── RESULTS PAGE ─────────────────────────────────────────────────────────────

function ResultsPage({ resultState, setPage }) {
  const { result, originalText } = resultState;
  const [activeDrawerIdx, setActiveDrawerIdx] = useState(null);
  const [copied, setCopied] = useState(false);

  const findings = result.findings || [];
  const footprint = result.footprint || {};
  const tone = result.tone || {};
  const readability = result.readability || {};

  const handleFindingClick = (idx) => {
    setActiveDrawerIdx(activeDrawerIdx === idx ? null : idx);
  };

  const copyRewrite = () => {
    if (!result.rewrite) return;
    navigator.clipboard.writeText(result.rewrite).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setPage("home")}
            className="text-xs font-black text-[#5f6672] hover:text-[#111214] flex items-center gap-1.5 transition mb-1 cursor-pointer"
          >
            ← Back to Perspective Workspace
          </button>
          <h1 className="text-3xl font-extrabold text-[#111214]">Analysis Findings</h1>
        </div>
        <button
          onClick={() => setPage("home")}
          className="px-5 py-2 rounded-full bg-[#16171a] text-white text-xs font-bold hover:bg-black transition cursor-pointer"
        >
          + New Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Annotated Text */}
        <BentoCard className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#f0f2f5]">
            <span className="text-xs font-black uppercase tracking-wider text-[#8c9099]">Original Text with Tokens</span>
            <span className="text-xs px-3 py-1 rounded-full bg-[#16171a] text-white font-bold">
              Footprint: {footprint.bias_index ?? 0} / 100
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e8eaee]">
            <HighlightedText
              text={originalText}
              findings={findings}
              onFindingClick={handleFindingClick}
              activeIdx={activeDrawerIdx}
            />
          </div>

          {activeDrawerIdx !== null && findings[activeDrawerIdx] && (
            <div className="p-4 rounded-2xl bg-[#f0effe] border border-[#d3ceff] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#4b3fbd]">
                  {CATEGORY_CONFIG[findings[activeDrawerIdx].category]?.label || findings[activeDrawerIdx].category}
                </span>
                <span className="text-xs font-bold text-[#4b3fbd]">{findings[activeDrawerIdx].confidence} confidence</span>
              </div>
              <p className="text-xs text-[#111214] font-medium leading-relaxed">
                {findings[activeDrawerIdx].explanation}
              </p>
              {findings[activeDrawerIdx].suggestion && (
                <div className="p-2.5 rounded-xl bg-white text-xs text-[#16171a] font-semibold border border-[#d3ceff]">
                  💡 Suggested phrasing: "{findings[activeDrawerIdx].suggestion}"
                </div>
              )}
              <FeedbackButtons analysisId={result.id} findingIndex={activeDrawerIdx} />
            </div>
          )}
        </BentoCard>

        {/* Right Column: All Metrics & Evidence (Unified View) */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Evidence / Findings */}
          <BentoCard className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f2f5]">
              <span className="text-xs font-black uppercase tracking-wider text-[#16171a]">Bias Evidence</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f4f5f7] text-[#5f6672]">
                {findings.length} Flagged
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {findings.length === 0 ? (
                <p className="text-xs text-[#8c9099] py-4 text-center font-bold">No bias tokens flagged — objective phrasing.</p>
              ) : (
                findings.map((f, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#f9fafb] border border-[#e8eaee] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#e2e4e8]">
                        {CATEGORY_CONFIG[f.category]?.label || f.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#16171a]">{f.weight || 5.0} / 10 weight</span>
                    </div>
                    <p className="text-xs text-[#111214] font-medium">"{f.surrounding_sentence || f.span}"</p>
                    <p className="text-[11px] text-[#5f6672]">{f.explanation}</p>
                  </div>
                ))
              )}
            </div>
          </BentoCard>

          {/* 2. Sentiment & Polarity */}
          <BentoCard className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f2f5]">
              <span className="text-xs font-black uppercase tracking-wider text-[#16171a]">Sentiment & Polarity</span>
              <span className={cn(
                "text-xs font-black uppercase px-2.5 py-0.5 rounded-full",
                result.sentiment === "Positive" ? "bg-[#d2f84b]/30 text-[#2e5200]" :
                result.sentiment === "Negative" ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-700"
              )}>
                {result.sentiment}
              </span>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs font-bold text-[#8c9099]">
                <span>Polarity Spectrum</span>
                <span className="font-mono text-[#111214]">{result.polarity?.toFixed(3)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#e2e4e8] overflow-hidden">
                <div
                  className="h-full bg-[#d2f84b] rounded-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, ((result.polarity + 1) / 2) * 100))}%` }}
                />
              </div>
            </div>
          </BentoCard>

          {/* 3. Tone & Readability Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BentoCard className="p-4 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#16171a]">Tone Analysis</span>
              <div className="space-y-2 text-xs font-bold pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#5f6672]">Formality</span>
                  <span className="font-mono text-[#111214]">{((tone.formality || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5f6672]">Warmth</span>
                  <span className="font-mono text-[#111214]">{((tone.warmth || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5f6672]">Urgency</span>
                  <span className="font-mono text-[#111214]">{((tone.urgency || 0) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </BentoCard>

            <BentoCard className="p-4 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#16171a]">Readability</span>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-[#f9fafb] border border-[#e8eaee]">
                  <span className="text-xl font-black text-[#111214]">{readability.word_count || 0}</span>
                  <p className="text-[10px] font-bold text-[#8c9099]">Words</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f9fafb] border border-[#e8eaee]">
                  <span className="text-xl font-black text-[#111214]">{readability.flesch_score?.toFixed(1) || "—"}</span>
                  <p className="text-[10px] font-bold text-[#8c9099]">Flesch</p>
                </div>
              </div>
            </BentoCard>
          </div>

          {/* 4. Suggested Rewrite */}
          {result.rewrite && (
            <BentoCard className="p-5 bg-[#f0effe] border border-[#d3ceff]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-[#4b3fbd]">Suggested Neutral Phrasing</span>
                <button onClick={copyRewrite} className="text-xs font-bold text-[#4b3fbd] flex items-center gap-1 cursor-pointer">
                  <IconCopy /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-[#111214] leading-relaxed font-medium italic">"{result.rewrite}"</p>
            </BentoCard>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────

function DashboardPage({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/dashboard/");
        setData(res.data);
      } catch (err) {
        setData({
          is_guest: true,
          total_analyses: 5,
          positive_count: 2,
          negative_count: 1,
          neutral_count: 2,
          avg_polarity: 0.1,
          streak: 1,
          daily_counts: [],
          category_totals: { loaded_language: 2, unsupported_generalization: 1, stereotyping: 1, one_sided_framing: 0 },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!data) return null;

  const dailyCounts = Array.isArray(data.daily_counts)
    ? data.daily_counts
    : Object.entries(data.daily_counts || {}).map(([date, count]) => ({ date, count }));
  const maxCount = Math.max(...(dailyCounts.map(d => Number(d.count) || 0)), 1);
  const catTotals = data.category_totals || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111214] tracking-tight">Telemetry Dashboard</h1>
          <p className="text-xs font-medium text-[#717682] mt-0.5">Aggregated perspective benchmarks and signal frequency</p>
        </div>
        {data.streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e8fab4] text-[#3e4f0a] text-xs font-black shadow-2xs">
            <span>🔥 {data.streak} Day Streak</span>
          </div>
        )}
      </div>

      {/* Guest Notice if unauthenticated */}
      {(!user || data.is_guest) && (
        <div className="p-4 rounded-2xl bg-[#f0effe] border border-[#d3ceff] text-xs font-bold text-[#4b3fbd] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>Guest session active — Viewing aggregate perspective telemetry. Sign in to sync your personal analyses.</span>
          </div>
        </div>
      )}

      {/* Key Metric Bento Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BentoCard className="p-5 text-center">
          <p className="text-3xl sm:text-4xl font-black text-[#111214]">{data.total_analyses || 0}</p>
          <p className="text-xs font-bold text-[#8c9099] mt-1">Total Analyses</p>
        </BentoCard>
        <BentoCard className="p-5 text-center">
          <p className="text-3xl sm:text-4xl font-black text-[#15803d]">{data.positive_count || 0}</p>
          <p className="text-xs font-bold text-[#8c9099] mt-1">Positive Tone</p>
        </BentoCard>
        <BentoCard className="p-5 text-center">
          <p className="text-3xl sm:text-4xl font-black text-[#b91c1c]">{data.negative_count || 0}</p>
          <p className="text-xs font-bold text-[#8c9099] mt-1">Negative Tone</p>
        </BentoCard>
        <BentoCard className="p-5 text-center">
          <p className="text-3xl sm:text-4xl font-black text-[#111214]">{data.neutral_count || 0}</p>
          <p className="text-xs font-bold text-[#8c9099] mt-1">Neutral Tone</p>
        </BentoCard>
      </div>

      {/* 30-Day Activity Bar Chart */}
      <BentoCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black uppercase text-[#8c9099]">30-Day Activity Timeline</h3>
            <p className="text-xs text-[#5f6672] font-medium">Daily scan volume tracked across corpora</p>
          </div>
          <span className="text-xs font-bold text-[#8c9099]">Peak: {maxCount} / day</span>
        </div>

        {dailyCounts.length === 0 ? (
          <p className="text-[#8c9099] text-xs text-center py-8 font-bold">No daily sessions recorded yet.</p>
        ) : (
          <div className="relative pt-2">
            <div className="flex items-end gap-1.5 h-36 overflow-hidden px-1">
              {dailyCounts.map((day, i) => {
                const h = maxCount === 0 ? 0 : (day.count / maxCount) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end cursor-pointer group relative h-full"
                    onMouseEnter={() => setTooltip({ idx: i, count: day.count, date: day.date })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {tooltip?.idx === i && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-[#16171a] text-white rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap pointer-events-none shadow-xl">
                        <span className="text-[#d2f84b]">{day.date}</span>: {day.count} {day.count === 1 ? "scan" : "scans"}
                      </div>
                    )}
                    <div
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-300",
                        day.count > 0
                          ? "bg-[#16171a] group-hover:bg-[#d2f84b] shadow-sm"
                          : "bg-[#e8eaee] group-hover:bg-[#cbd0d8]"
                      )}
                      style={{ height: `${Math.max(h, day.count > 0 ? 15 : 6)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs font-bold text-[#8c9099] mt-3 px-1 border-t border-[#f0f2f5] pt-2">
              <span>{dailyCounts[0]?.date}</span>
              <span>{dailyCounts[dailyCounts.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </BentoCard>

      {/* Category breakdown */}
      <BentoCard className="p-6">
        <h3 className="text-sm font-black uppercase text-[#8c9099] mb-4">Historical Category Frequency</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => {
            const count = catTotals[cat] || 0;
            return (
              <div key={cat} className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e8eaee] text-center">
                <span className="text-2xl font-black text-[#111214]">{count}</span>
                <p className="text-xs font-bold text-[#5f6672] mt-1">{cfg.label}</p>
                {count > 0 && (
                  <span className={cn("mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg.chip)}>
                    detected
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </BentoCard>
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────

function HistoryPage({ setPage, setResultState }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/history/");
        setItems(res.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const deleteItem = async (id) => {
    try {
      await api.delete(`/history/${id}/delete/`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { /* silent */ }
  };

  const filtered = items.filter(i => !search || i.text?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111214]">Analysis Archive</h1>
          <p className="text-xs font-medium text-[#717682] mt-0.5">Stored scans and sentiment logs in Supabase</p>
        </div>
        <input
          placeholder="Search history…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="py-2 px-4 rounded-full bg-white border border-[#e2e4e8] text-xs font-bold text-[#111214] w-64 shadow-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <BentoCard className="text-center py-12 text-[#8c9099] font-bold text-xs">
          No historical analyses found.
        </BentoCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <BentoCard key={item.id} className="p-4 hover:border-black/20 transition flex items-start justify-between gap-4">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => {
                  setResultState({ result: item, originalText: item.text });
                  setPage("results");
                }}
              >
                <p className="text-sm font-bold text-[#111214] line-clamp-2">{item.text}</p>
                <div className="flex items-center gap-3 mt-2 text-xs font-bold text-[#8c9099]">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f4f5f7] border text-[#111214]">{item.sentiment}</span>
                  <span>{fmtDateTime(item.created_at)}</span>
                </div>
              </div>
              <button onClick={() => deleteItem(item.id)} className="p-2 hover:bg-rose-50 rounded-full transition cursor-pointer">
                <IconTrash />
              </button>
            </BentoCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE PAGE (FUNCTIONAL USERNAME & PASSWORD CHANGE) ────────────────

function ProfilePage({ user, onProfileUpdate, onLogout, setPage }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Change Password state
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  const isGuest = !user;

  useEffect(() => {
    if (isGuest) {
      const guestName = localStorage.getItem("guest_username") || "Guest User";
      setProfile({
        username: guestName,
        email: "guest@unbiasify.local",
        total_analyses: 0,
      });
      setEditUsername(guestName);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await api.get("/profile/");
        setProfile(res.data);
        setEditUsername(res.data.username || user?.username || "");
      } catch {
        setProfile({
          username: user?.username || "Guest User",
          email: user?.email || "guest@unbiasify.local",
          total_analyses: 0,
        });
        setEditUsername(user?.username || "Guest User");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isGuest]);

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    const trimmed = editUsername.trim();
    if (!trimmed) {
      setError("Username cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      if (!isGuest) {
        const res = await api.patch("/profile/edit/", { username: trimmed });
        const updatedName = res.data.username || trimmed;
        setProfile((prev) => ({ ...prev, username: updatedName }));
        onProfileUpdate({ username: updatedName });
      } else {
        localStorage.setItem("guest_username", trimmed);
        setProfile((prev) => ({ ...prev, username: trimmed }));
        onProfileUpdate({ username: trimmed });
      }
      setMsg("Username updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update username.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdMsg("");

    if (!oldPwd.trim() || !newPwd.trim()) {
      setPwdError("Both current and new passwords are required.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdError("New password must be at least 8 characters long.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("New passwords do not match.");
      return;
    }

    setPwdSaving(true);
    try {
      const res = await api.post("/change-password/", {
        old_password: oldPwd.trim(),
        new_password: newPwd.trim(),
      });
      setPwdMsg(res.data.message || "Password changed successfully!");
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => {
        setIsChangingPwd(false);
        setPwdMsg("");
      }, 2500);
    } catch (err) {
      setPwdError(err.response?.data?.error || "Failed to change password. Verify your current password.");
    } finally {
      setPwdSaving(false);
    }
  };

  const displayName = profile?.username || (isGuest ? "Guest User" : user?.username || "User");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111214]">
            {isGuest ? "Guest Profile" : "Account Settings"}
          </h1>
          <p className="text-xs font-medium text-[#717682] mt-1">
            {isGuest
              ? "You are currently running in guest mode. Analyses are stored in this browser session only."
              : "Manage your Unbiasify identity, credentials, and profile details."}
          </p>
        </div>
        {isGuest && (
          <button
            onClick={() => setPage("login")}
            className="px-5 py-2 rounded-full bg-[#16171a] text-white text-xs font-bold hover:bg-black transition cursor-pointer"
          >
            Sign In to Sync
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          {/* User Overview Card */}
          <BentoCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#16171a] text-white flex items-center justify-center font-black text-2xl">
                  {isGuest ? "G" : displayName[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="text-xl font-black text-[#111214]">{displayName}</p>
                    <button
                      onClick={() => { setIsEditing(!isEditing); setError(""); setMsg(""); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#5f6672] hover:text-[#111214] bg-[#f4f5f7] hover:bg-[#e8eaee] transition flex items-center gap-1 cursor-pointer border border-[#e8eaee]"
                      title="Edit username"
                    >
                      <IconEdit />
                      <span>{isEditing ? "Close" : "Edit"}</span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-[#8c9099] mt-0.5">
                    {isGuest ? "Guest Session Active" : (profile?.email || user?.email || "No email")}
                  </p>
                </div>
              </div>

              {isGuest ? (
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#d2f84b]/30 text-[#2e5200]">
                  Guest User
                </span>
              ) : (
                <button
                  onClick={() => { setIsChangingPwd(!isChangingPwd); setPwdError(""); setPwdMsg(""); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#f4f5f7] hover:bg-[#e8eaee] text-[#16171a] border border-[#e8eaee] transition cursor-pointer"
                >
                  {isChangingPwd ? "Close Password Form" : "Change Password"}
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-[#f0f2f5] flex justify-between items-center text-xs">
              <span className="font-bold text-[#8c9099]">Total analyses logged:</span>
              <span className="font-black text-[#111214]">
                {isGuest ? "Session only (Sign in to save)" : (profile?.total_analyses || 0)}
              </span>
            </div>
          </BentoCard>

          {/* Edit Username Card */}
          {isEditing && (
            <BentoCard className="p-6 space-y-4 border border-[#16171a]/20 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#111214]">Change Username</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-[#8c9099] hover:text-[#111214] cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-[#5f6672] font-medium">
                Update how your name appears across Unbiasify workspace and analyses.
              </p>

              <form onSubmit={handleSaveUsername} className="space-y-3 pt-2">
                <ErrorMsg msg={error} />
                <SuccessMsg msg={msg} />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter username"
                    autoFocus
                    className="w-full py-2.5 px-4 rounded-xl bg-[#f9fafb] border border-[#e8eaee] text-sm font-bold text-[#111214] focus:outline-none focus:border-[#16171a]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full bg-[#16171a] hover:bg-black text-white text-xs font-extrabold transition shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    {saving ? "Saving…" : "Save Username"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-[#5f6672] hover:bg-[#f4f5f7] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </BentoCard>
          )}

          {/* Change Password Card (Only for Authenticated Users) */}
          {!isGuest && isChangingPwd && (
            <BentoCard className="p-6 space-y-4 border border-[#16171a]/20 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#111214]">Change Password</h3>
                <button
                  onClick={() => setIsChangingPwd(false)}
                  className="text-xs font-bold text-[#8c9099] hover:text-[#111214] cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-[#5f6672] font-medium">
                Ensure your account is protected with a secure password of at least 8 characters.
              </p>

              <form onSubmit={handleSavePassword} className="space-y-3.5 pt-2">
                <ErrorMsg msg={pwdError} />
                <SuccessMsg msg={pwdMsg} />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
                    Current Password
                  </label>
                  <PasswordInput
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
                    New Password (min 8 chars)
                  </label>
                  <PasswordInput
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Enter new secure password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
                    Confirm New Password
                  </label>
                  <PasswordInput
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={pwdSaving}
                    className="px-6 py-2.5 rounded-full bg-[#16171a] hover:bg-black text-white text-xs font-extrabold transition shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    {pwdSaving ? "Updating…" : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPwd(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-[#5f6672] hover:bg-[#f4f5f7] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </BentoCard>
          )}

          {/* Guest Sign-In Callout */}
          {isGuest ? (
            <BentoCard className="p-6 bg-[#f7fde6] border border-[#dcf589] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-[#111214]">Create an Account or Sign In</h4>
                <p className="text-xs text-[#5f6672] mt-0.5 font-medium">
                  Signed-in users get persistent bias history, aggregate analytics dashboards, and cloud sync.
                </p>
              </div>
              <button
                onClick={() => setPage("login")}
                className="px-5 py-2.5 rounded-full bg-[#16171a] text-white text-xs font-extrabold hover:bg-black transition whitespace-nowrap cursor-pointer"
              >
                Sign In / Register
              </button>
            </BentoCard>
          ) : (
            <div className="pt-4 flex justify-end">
              <button
                onClick={onLogout}
                className="px-5 py-2.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold transition cursor-pointer"
              >
                Sign Out of Account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── NATIVE AUTH PAGES ──────────────────────────────────────────────────

function LoginPage({ setPage, onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password.trim()) {
      setError("Please provide your username/email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/login/", {
        username: identifier.trim(),
        password: password.trim(),
      });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      onLogin({ username: res.data.username, email: res.data.email });
      setPage("home");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <BentoCard className="p-8">
        <div className="text-center mb-6">
          <div className="inline-flex mb-3">
            <IconFluxLogo />
          </div>
          <h2 className="text-2xl font-black text-[#111214] tracking-tight">Sign In to Unbiasify</h2>
          <p className="text-xs font-medium text-[#717682] mt-1">
            Access your saved bias analyses, aggregate metrics, and history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMsg msg={error} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. researcher@unbiasify.org"
              required
              autoFocus
              className="w-full rounded-2xl bg-[#f9fafb] border border-[#e8eaee] px-4 py-3 text-xs font-semibold text-[#111214] placeholder-[#8c9099] focus:outline-none focus:ring-2 focus:ring-[#d2f84b] focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setPage("forgot")}
                className="text-xs font-bold text-[#5f6672] hover:text-[#111214] transition cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#16171a] hover:bg-black text-white text-xs font-extrabold transition shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? <Spinner size="sm" /> : <span>Sign In</span>}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#f0f2f5] text-center space-y-2">
          <p className="text-xs font-medium text-[#717682]">
            Don't have an account?{" "}
            <button
              onClick={() => setPage("register")}
              className="font-extrabold text-[#111214] hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </p>
          <button
            onClick={() => setPage("home")}
            className="text-[11px] font-bold text-[#8c9099] hover:text-[#111214] transition cursor-pointer block mx-auto"
          >
            ← Continue as Guest
          </button>
        </div>
      </BentoCard>
    </div>
  );
}

function RegisterPage({ setPage, onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/register/", {
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      onLogin({ username: res.data.username, email: res.data.email });
      setPage("home");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Try a different username or email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <BentoCard className="p-8">
        <div className="text-center mb-6">
          <div className="inline-flex mb-3">
            <IconFluxLogo />
          </div>
          <h2 className="text-2xl font-black text-[#111214] tracking-tight">Create Account</h2>
          <p className="text-xs font-medium text-[#717682] mt-1">
            Join Unbiasify to store your bias findings and track neutrality trends.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMsg msg={error} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_rivera"
              required
              autoFocus
              className="w-full rounded-2xl bg-[#f9fafb] border border-[#e8eaee] px-4 py-3 text-xs font-semibold text-[#111214] placeholder-[#8c9099] focus:outline-none focus:ring-2 focus:ring-[#d2f84b] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              required
              className="w-full rounded-2xl bg-[#f9fafb] border border-[#e8eaee] px-4 py-3 text-xs font-semibold text-[#111214] placeholder-[#8c9099] focus:outline-none focus:ring-2 focus:ring-[#d2f84b] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
              Password (min 8 chars)
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create strong password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
              Confirm Password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#16171a] hover:bg-black text-white text-xs font-extrabold transition shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? <Spinner size="sm" /> : <span>Create Account</span>}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#f0f2f5] text-center space-y-2">
          <p className="text-xs font-medium text-[#717682]">
            Already have an account?{" "}
            <button
              onClick={() => setPage("login")}
              className="font-extrabold text-[#111214] hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </p>
          <button
            onClick={() => setPage("home")}
            className="text-[11px] font-bold text-[#8c9099] hover:text-[#111214] transition cursor-pointer block mx-auto"
          >
            ← Continue as Guest
          </button>
        </div>
      </BentoCard>
    </div>
  );
}

function ForgotPasswordPage({ setPage, onResetTokenReady }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setGeneratedToken("");

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/forgot-password/", { email: email.trim() });
      setSuccessMsg(res.data.message || "Password reset token generated.");
      if (res.data.reset_token) {
        setGeneratedToken(res.data.reset_token);
        if (onResetTokenReady) onResetTokenReady(res.data.reset_token);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to initiate password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <BentoCard className="p-8">
        <div className="text-center mb-6">
          <div className="inline-flex mb-3">
            <IconFluxLogo />
          </div>
          <h2 className="text-2xl font-black text-[#111214] tracking-tight">Forgot Password</h2>
          <p className="text-xs font-medium text-[#717682] mt-1">
            Enter your registered email to receive or generate a password reset token.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMsg msg={error} />
          <SuccessMsg msg={successMsg} />

          {generatedToken && (
            <div className="p-4 rounded-2xl bg-[#f7fde6] border border-[#dcf589] space-y-2.5">
              <p className="text-xs font-extrabold text-[#2e5200]">Your Reset Verification Token:</p>
              <div className="p-2.5 rounded-xl bg-white border border-[#e8eaee] font-mono text-xs text-[#16171a] break-all select-all">
                {generatedToken}
              </div>
              <button
                type="button"
                onClick={() => setPage("reset")}
                className="w-full py-2.5 rounded-xl bg-[#16171a] text-white text-xs font-extrabold hover:bg-black transition cursor-pointer"
              >
                Proceed to Reset Password →
              </button>
            </div>
          )}

          {!generatedToken && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
                  Account Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. researcher@unbiasify.org"
                  required
                  autoFocus
                  className="w-full rounded-2xl bg-[#f9fafb] border border-[#e8eaee] px-4 py-3 text-xs font-semibold text-[#111214] placeholder-[#8c9099] focus:outline-none focus:ring-2 focus:ring-[#d2f84b] focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#16171a] hover:bg-black text-white text-xs font-extrabold transition shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? <Spinner size="sm" /> : <span>Generate Reset Token</span>}
              </button>
            </>
          )}
        </form>

        <div className="mt-6 pt-5 border-t border-[#f0f2f5] text-center space-y-2">
          <p className="text-xs font-medium text-[#717682]">
            Already have a reset token?{" "}
            <button
              onClick={() => setPage("reset")}
              className="font-extrabold text-[#111214] hover:underline cursor-pointer"
            >
              Enter Token Here
            </button>
          </p>
          <button
            onClick={() => setPage("login")}
            className="text-[11px] font-bold text-[#8c9099] hover:text-[#111214] transition cursor-pointer block mx-auto"
          >
            ← Back to Sign In
          </button>
        </div>
      </BentoCard>
    </div>
  );
}

function ResetPasswordPage({ setPage, initialToken = "" }) {
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialToken) setToken(initialToken);
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/reset-password/", {
        token: token.trim(),
        new_password: newPassword.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired token. Please generate a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <BentoCard className="p-8">
        <div className="text-center mb-6">
          <div className="inline-flex mb-3">
            <IconFluxLogo />
          </div>
          <h2 className="text-2xl font-black text-[#111214] tracking-tight">Set New Password</h2>
          <p className="text-xs font-medium text-[#717682] mt-1">
            Enter your verification token and your new password.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-[#f7fde6] border border-[#dcf589] text-xs font-bold text-[#2e5200]">
              Password reset successful! You can now sign in with your new password.
            </div>
            <button
              onClick={() => setPage("login")}
              className="w-full py-3.5 rounded-2xl bg-[#16171a] hover:bg-black text-white text-xs font-extrabold transition shadow-sm cursor-pointer"
            >
              Sign In Now →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorMsg msg={error} />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
                Reset Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token"
                required
                className="w-full rounded-2xl bg-[#f9fafb] border border-[#e8eaee] px-4 py-3 text-xs font-mono font-semibold text-[#111214] placeholder-[#8c9099] focus:outline-none focus:ring-2 focus:ring-[#d2f84b] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
                New Password (min 8 chars)
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8c9099] mb-1.5">
                Confirm New Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#16171a] hover:bg-black text-white text-xs font-extrabold transition shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? <Spinner size="sm" /> : <span>Update Password</span>}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-[#f0f2f5] text-center">
          <button
            onClick={() => setPage("login")}
            className="text-[11px] font-bold text-[#8c9099] hover:text-[#111214] transition cursor-pointer"
          >
            ← Back to Sign In
          </button>
        </div>
      </BentoCard>
    </div>
  );
}

// ─── MAIN APP FRAME (FLUX CANVAS & WORKING NOTIFICATIONS) ──────────────────────

function AppScaffold({ user, onLogout, onLogin, onProfileUpdate }) {
  const [page, setPage] = useState("home");
  const [resultState, setResultState] = useState(null);
  const [resetToken, setResetToken] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Heuristic Engine Active", desc: "5-axis linguistic bias patterns calibrated.", time: "Just now", read: false },
    { id: 2, title: "Supabase Pipeline Live", desc: "Remote PostgreSQL database connection verified.", time: "5m ago", read: false },
    { id: 3, title: "Advisory Mode Ready", desc: "Evaluated against standard unbiased corpora.", time: "1h ago", read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navigate = useCallback((p) => {
    setPage(p);
    setShowNotifications(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Navigation items: only Analyze & Profile for guests; Dashboard & History for logged-in users
  const navItems = user
    ? [
        { id: "home", label: "Analyze", icon: <IconDashboard />, badge: null },
        { id: "dashboard", label: "Dashboard", icon: <IconReports />, badge: null },
        { id: "history", label: "History", icon: <IconHome />, badge: null },
        { id: "profile", label: "Profile", icon: <IconUsers />, badge: null },
      ]
    : [
        { id: "home", label: "Analyze", icon: <IconDashboard />, badge: null },
        { id: "profile", label: "Profile", icon: <IconUsers />, badge: null },
      ];

  return (
    <div className="min-h-screen bg-[#d7ebd0] p-2 sm:p-5 flex items-center justify-center font-sans antialiased text-[#111214]">
      {/* Outer Rounded Container matching the Flux Template */}
      <div className="w-full max-w-[1400px] bg-[#f4f5f7] rounded-[2.2rem] shadow-2xl border border-black/5 overflow-hidden flex flex-col md:flex-row min-h-[860px]">
        {/* Left Dark Sidebar (#16171a) */}
        <aside className="w-full md:w-64 bg-[#16171a] p-6 flex flex-col justify-between shrink-0 text-white">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 mb-8 cursor-pointer" onClick={() => navigate("home")}>
              <IconFluxLogo />
              <span className="font-black text-xl tracking-tight text-white">unbiasify</span>
            </div>

            {/* Nav Items */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const active = page === item.id || (page === "results" && item.id === "home");
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer",
                      active
                        ? "bg-white text-[#16171a] shadow-sm font-extrabold"
                        : "text-[#8e929b] hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Feature Card */}
          <div className="mt-8 rounded-3xl bg-[#d2f84b] p-5 text-[#16171a] shadow-sm flex flex-col justify-between">
            <div>
              <p className="font-black text-sm tracking-tight mb-1.5">Objective Writing</p>
              <p className="text-[11px] font-semibold text-[#16171a]/85 leading-snug">
                Detect loaded framing, covert stereotypes, and tone slant before you publish.
              </p>
            </div>
            <button
              onClick={() => navigate("home")}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#16171a] text-white text-xs font-extrabold hover:bg-black transition shadow-sm cursor-pointer"
            >
              Start New Review
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f4f5f7]">
          {/* Top Bar */}
          <header className="px-6 sm:px-8 py-5 flex items-center justify-between gap-4 border-b border-[#e8eaee]/60 relative">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="w-9 h-9 rounded-full bg-[#16171a] text-white flex items-center justify-center text-xs font-bold">
                  {user.username?.[0]?.toUpperCase() || "U"}
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#16171a] text-white flex items-center justify-center text-xs font-bold">
                  G
                </div>
              )}

              <div className="text-left">
                <p className="text-xs font-black text-[#111214] leading-tight">
                  {user?.username || "Guest Researcher"}
                </p>
                <p className="text-[11px] font-medium text-[#8c9099] leading-tight">
                  {user?.email || "Guest Session Active"}
                </p>
              </div>
            </div>

            {/* Search Pill, Notification Bell, & Auth Actions */}
            <div className="flex items-center gap-3 relative">
              {user && (
                <div className="hidden sm:flex items-center gap-2 bg-white rounded-full py-2 px-4 shadow-2xs border border-[#e8eaee] w-64">
                  <IconSearch />
                  <input
                    type="text"
                    placeholder="Search archive…"
                    onClick={() => navigate("history")}
                    className="bg-transparent text-xs text-[#111214] placeholder-[#8c9099] focus:outline-none w-full font-medium cursor-pointer"
                    readOnly
                  />
                </div>
              )}

              {/* Notification Button */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-full bg-white border border-[#e8eaee] flex items-center justify-center relative shadow-2xs cursor-pointer hover:bg-[#f4f5f7] transition"
                title="Notifications"
              >
                <IconBell />
                {unreadCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d2f84b] border-2 border-white absolute top-1.5 right-1.5" />
                )}
              </button>

              {/* Working Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-xl border border-[#e8eaee] p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f5]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#111214]">System Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#d2f84b] text-[#16171a] text-[10px] font-black">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
                        className="text-[10px] font-bold text-[#5f6672] hover:text-[#111214] cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#8c9099] text-center py-4 font-medium">No active notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-3 rounded-2xl border transition-colors flex items-start justify-between gap-2",
                            n.read ? "bg-[#f9fafb] border-[#e8eaee]" : "bg-[#f7fde6] border-[#dcf589]"
                          )}
                        >
                          <div>
                            <p className="text-xs font-bold text-[#111214]">{n.title}</p>
                            <p className="text-[11px] text-[#5f6672] mt-0.5 leading-snug">{n.desc}</p>
                            <span className="text-[10px] text-[#8c9099] mt-1 block">{n.time}</span>
                          </div>
                          <button
                            onClick={() => setNotifications(notifications.filter((x) => x.id !== n.id))}
                            className="text-[#8c9099] hover:text-rose-500 text-xs p-1 cursor-pointer"
                            title="Dismiss"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {user ? (
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#5f6672] hover:text-rose-600 bg-white border border-[#e8eaee] hover:border-rose-200 hover:bg-rose-50/50 transition cursor-pointer"
                >
                  Sign Out
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("login")}
                    className="px-4 py-2 rounded-full text-xs font-bold text-[#16171a] bg-white border border-[#e8eaee] hover:bg-black/5 transition cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("register")}
                    className="px-4 py-2 rounded-full text-xs font-bold text-[#16171a] bg-[#d2f84b] hover:bg-[#c4ec39] transition cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Dynamic Page View */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
            {page === "home" && (
              <AnalyzePage
                user={user}
                setPage={navigate}
                setResultState={setResultState}
              />
            )}
            {page === "results" && resultState && (
              <ResultsPage
                resultState={resultState}
                setPage={navigate}
              />
            )}
            {page === "dashboard" && (
              user ? <DashboardPage user={user} /> : <AnalyzePage user={user} setPage={navigate} setResultState={setResultState} />
            )}
            {page === "history" && (
              user ? <HistoryPage setPage={navigate} setResultState={setResultState} /> : <AnalyzePage user={user} setPage={navigate} setResultState={setResultState} />
            )}
            {page === "profile" && (
              <ProfilePage
                user={user}
                onProfileUpdate={onProfileUpdate}
                onLogout={onLogout}
                setPage={navigate}
              />
            )}
            {page === "login" && (
              <LoginPage setPage={navigate} onLogin={onLogin} />
            )}
            {page === "register" && (
              <RegisterPage setPage={navigate} onLogin={onLogin} />
            )}
            {page === "forgot" && (
              <ForgotPasswordPage
                setPage={navigate}
                onResetTokenReady={(tok) => setResetToken(tok)}
              />
            )}
            {page === "reset" && (
              <ResetPasswordPage
                setPage={navigate}
                initialToken={resetToken}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── ROOT APP COMPONENT ──────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const res = await api.get("/profile/");
        setUser({ username: res.data.username, email: res.data.email });
      } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const handleProfileUpdate = (u) => {
    if (u.username) {
      setUser((prev) => (prev ? { ...prev, username: u.username } : null));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  const handleLogin = (u) => {
    setUser(u);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#d7ebd0] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs font-bold text-[#16171a]">Starting Unbiasify Flux…</span>
      </div>
    );
  }

  return (
    <AppScaffold
      user={user}
      onLogout={handleLogout}
      onLogin={handleLogin}
      onProfileUpdate={handleProfileUpdate}
    />
  );
}
