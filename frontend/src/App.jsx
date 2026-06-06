import React, { useState, useEffect, useRef, useCallback } from "react";
import { generateVideo, listVideos, deleteVideo, getConfig, updateConfig, videoUrl } from "./api";

// ─── Icons (inline SVG to keep zero deps) ────────────────────────────────────
const Icon = {
  Wand: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="m15 4-1 1" /><path d="m4 15-1 1" /><path d="m8 8-1-1" />
      <path d="M17.5 2.5l4 4-11 11-4-4 11-11z" /><path d="m22 22-9.5-9.5" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Film: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
};

// ─── Aspect ratio configs ─────────────────────────────────────────────────────
const ASPECT_RATIOS = [
  { value: "16:9",  label: "16:9",  desc: "Landscape",  cssClass: "ratio-16-9"  },
  { value: "9:16",  label: "9:16",  desc: "Portrait",   cssClass: "ratio-9-16"  },
  { value: "1:1",   label: "1:1",   desc: "Square",     cssClass: "ratio-1-1"   },
];

const RESOLUTIONS = ["1080p", "4K", "8K"];
const PROVIDERS   = [
  { value: "mock",                   label: "Demo Mode (no GPU)",          color: "text-snap-amber" },
  { value: "stable_video_diffusion", label: "Stable Video Diffusion",      color: "text-snap-cyan"  },
  { value: "hunyuan",                label: "HunyuanVideo (80 GB VRAM)",   color: "text-snap-accent-bright" },
];

const PROMPT_EXAMPLES = [
  "A lone astronaut walking across a crimson Mars landscape, cinematic slow motion, dust swirling",
  "Cherry blossom petals falling in slow motion against a golden sunset, 4K macro",
  "Neon-lit cyberpunk city street in rain, reflections on wet pavement, camera drift upward",
  "A majestic eagle soaring over snow-capped mountain peaks, ultra-sharp telephoto",
  "Waves crashing on a rocky shore at dusk, time-lapse golden hour, wide angle",
];

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" className="animate-spin">
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4"
        strokeDasharray="100" strokeDashoffset="60" strokeLinecap="round" />
    </svg>
  );
}

// ─── Loading animation ────────────────────────────────────────────────────────
function GeneratingAnimation() {
  const steps = ["Parsing prompt…", "Building scene graph…", "Rendering frames…", "Adding watermark…"];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      {/* Animated rings */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-snap-accent/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-snap-accent/50 animate-spin-slow" />
        <div className="absolute inset-4 rounded-full border-2 border-snap-accent animate-spin" style={{animationDirection:"reverse", animationDuration:"1.2s"}} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon.Film />
        </div>
      </div>

      {/* Step label */}
      <div className="text-center">
        <p className="font-display text-lg font-semibold text-snap-text">{steps[step]}</p>
        <p className="text-snap-muted text-sm mt-1">This may take a few minutes on first run</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === step ? "bg-snap-accent scale-125 shadow-accent-sm" : "bg-snap-dim"}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Video card in history ────────────────────────────────────────────────────
function VideoHistoryCard({ record, onSelect, onDelete, isActive }) {
  const [hovered, setHovered] = useState(false);
  const ratio = ASPECT_RATIOS.find(r => r.value === record.aspect_ratio);

  return (
    <div
      className={`relative rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden group
        ${isActive ? "border-snap-accent shadow-accent-sm" : "border-snap-border hover:border-snap-accent/40"}
        bg-snap-card`}
      onClick={() => onSelect(record)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail area */}
      <div className="relative bg-snap-surface flex items-center justify-center overflow-hidden" style={{paddingBottom: "56.25%"}}>
        <video
          src={videoUrl(record.filename)}
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
          muted playsInline loop
          ref={el => { if (el) { hovered ? el.play().catch(()=>{}) : el.pause(); }}}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-snap-accent/80 flex items-center justify-center backdrop-blur-sm">
            <Icon.Play />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/60 text-snap-cyan backdrop-blur-sm">
            {record.resolution}
          </span>
          <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/60 text-snap-muted backdrop-blur-sm">
            {ratio?.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-snap-text line-clamp-2 leading-relaxed">{record.prompt}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-snap-muted flex items-center gap-1">
            <Icon.Clock />
            {new Date(record.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
          </span>
          <button
            className="p-1.5 rounded-lg text-snap-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
            onClick={e => { e.stopPropagation(); onDelete(record.id); }}
            title="Delete"
          >
            <Icon.Trash />
          </button>
        </div>
      </div>

      {isActive && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-snap-accent flex items-center justify-center text-white"><Icon.Check /></div>}
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────
function SettingsPanel({ onClose }) {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getConfig().then(setCfg).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-snap-card border border-snap-border rounded-2xl p-6 shadow-card animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl">Studio Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-snap-border transition-colors text-snap-muted hover:text-snap-text">
            <Icon.X />
          </button>
        </div>

        {!cfg ? (
          <div className="flex items-center justify-center py-8 text-snap-muted">
            <Spinner /><span className="ml-2">Loading config…</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-snap-muted mb-2">AI Provider</label>
              <div className="space-y-2">
                {PROVIDERS.map(p => (
                  <label key={p.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${cfg.provider === p.value ? "border-snap-accent bg-snap-accent/10" : "border-snap-border hover:border-snap-accent/40"}`}>
                    <input type="radio" name="provider" value={p.value}
                      checked={cfg.provider === p.value}
                      onChange={() => setCfg(c => ({...c, provider: p.value}))}
                      className="text-snap-accent" />
                    <span className={`text-sm font-medium ${p.color}`}>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* HF Token */}
            <div>
              <label className="block text-sm font-medium text-snap-muted mb-2">
                HuggingFace Token <span className="text-snap-dim">(for gated models)</span>
              </label>
              <input
                type="password"
                value={cfg.huggingface_token || ""}
                onChange={e => setCfg(c => ({...c, huggingface_token: e.target.value}))}
                placeholder="hf_xxxxxxxxxxxx"
                className="w-full bg-snap-surface border border-snap-border rounded-xl px-4 py-2.5 text-sm text-snap-text font-mono
                  focus:outline-none focus:border-snap-accent/60 transition-colors"
              />
            </div>

            {/* Max saved */}
            <div>
              <label className="block text-sm font-medium text-snap-muted mb-2">
                Auto-save last <span className="text-snap-accent font-bold">{cfg.max_saved_videos}</span> videos
              </label>
              <input type="range" min="1" max="10" value={cfg.max_saved_videos}
                onChange={e => setCfg(c => ({...c, max_saved_videos: +e.target.value}))}
                className="w-full accent-snap-accent" />
            </div>

            {/* Mock delay */}
            {cfg.provider === "mock" && (
              <div>
                <label className="block text-sm font-medium text-snap-muted mb-2">
                  Demo delay: <span className="text-snap-accent font-bold">{cfg.mock_delay_seconds}s</span>
                </label>
                <input type="range" min="1" max="10" value={cfg.mock_delay_seconds}
                  onChange={e => setCfg(c => ({...c, mock_delay_seconds: +e.target.value}))}
                  className="w-full accent-snap-accent" />
              </div>
            )}

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl font-display font-semibold text-white transition-all
                bg-snap-accent hover:bg-snap-accent-bright disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Spinner size={18} /> Saving…</> : saved ? <><Icon.Check /> Saved!</> : "Save Settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [prompt, setPrompt]           = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution]   = useState("1080p");
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState(null);
  const [history, setHistory]         = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [charCount, setCharCount]     = useState(0);
  const textareaRef = useRef(null);
  const videoRef    = useRef(null);

  const MAX_CHARS = 2000;

  // Load history on mount
  useEffect(() => {
    listVideos()
      .then(vids => {
        const sorted = [...vids].reverse();
        setHistory(sorted);
        if (sorted.length) setActiveVideo(sorted[0]);
      })
      .catch(() => {});
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  }, [prompt]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);

    try {
      const record = await generateVideo({ prompt: prompt.trim(), aspect_ratio: aspectRatio, resolution });
      setHistory(prev => [record, ...prev]);
      setActiveVideo(record);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVideo(id);
      setHistory(prev => {
        const next = prev.filter(r => r.id !== id);
        if (activeVideo?.id === id) setActiveVideo(next[0] || null);
        return next;
      });
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const handleExampleClick = (ex) => {
    setPrompt(ex);
    setCharCount(ex.length);
    textareaRef.current?.focus();
  };

  const activeRatio = ASPECT_RATIOS.find(r => r.value === aspectRatio);

  return (
    <div className="noise min-h-screen bg-snap-bg text-snap-text font-body">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full
          bg-snap-accent/10 blur-[120px] animate-orb" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full
          bg-snap-cyan/8 blur-[100px] animate-orb" style={{animationDelay: "-4s"}} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-snap-border/50 bg-snap-surface/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-snap-accent/20 border border-snap-accent/40 flex items-center justify-center shadow-accent-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-snap-accent-bright">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">Snap Video Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-snap-muted font-mono px-2 py-1 rounded-md bg-snap-card border border-snap-border">
              localhost:5000
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl text-snap-muted hover:text-snap-text hover:bg-snap-card border border-transparent hover:border-snap-border transition-all"
            >
              <Icon.Settings />
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-6">

        {/* LEFT: Generator panel */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">

          {/* Prompt card */}
          <div className="bg-snap-card border border-snap-border rounded-2xl p-5 shadow-card">
            <label className="block font-display font-semibold text-sm uppercase tracking-widest text-snap-muted mb-3">
              Describe your video
            </label>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => { setPrompt(e.target.value); setCharCount(e.target.value.length); }}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
                placeholder="A majestic dragon soaring above misty mountain peaks at golden hour, cinematic aerial shot…"
                maxLength={MAX_CHARS}
                rows={3}
                className="glow-focus w-full bg-snap-surface border border-snap-border rounded-xl px-4 py-3.5
                  text-snap-text placeholder-snap-dim resize-none text-sm leading-relaxed
                  focus:border-snap-accent/60 transition-all duration-200 font-body"
              />
              <span className={`absolute bottom-3 right-3 text-xs font-mono transition-colors
                ${charCount > MAX_CHARS * 0.9 ? "text-snap-amber" : "text-snap-dim"}`}>
                {charCount}/{MAX_CHARS}
              </span>
            </div>

            {/* Example prompts */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-snap-dim self-center">Try:</span>
              {PROMPT_EXAMPLES.slice(0, 3).map((ex, i) => (
                <button key={i}
                  onClick={() => handleExampleClick(ex)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-snap-surface border border-snap-border
                    text-snap-muted hover:text-snap-accent hover:border-snap-accent/40 transition-all truncate max-w-[180px]">
                  {ex.slice(0, 32)}…
                </button>
              ))}
            </div>
          </div>

          {/* Controls row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aspect ratio */}
            <div className="bg-snap-card border border-snap-border rounded-2xl p-4 shadow-card">
              <label className="block font-display font-semibold text-xs uppercase tracking-widest text-snap-muted mb-3">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map(ar => (
                  <button key={ar.value} onClick={() => setAspectRatio(ar.value)}
                    className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all duration-200
                      ${aspectRatio === ar.value
                        ? "border-snap-accent bg-snap-accent/10 text-snap-accent shadow-accent-sm"
                        : "border-snap-border text-snap-muted hover:border-snap-accent/40 hover:text-snap-text"}`}>
                    {/* Mini ratio preview */}
                    <div className="flex items-center justify-center w-8 h-8">
                      {ar.value === "16:9" && <div className="w-8 h-4.5 border-2 border-current rounded" style={{height:"18px"}} />}
                      {ar.value === "9:16" && <div className="w-4.5 h-8 border-2 border-current rounded" style={{width:"18px"}} />}
                      {ar.value === "1:1"  && <div className="w-6 h-6 border-2 border-current rounded" />}
                    </div>
                    <span className="font-mono text-xs font-semibold">{ar.label}</span>
                    <span className="text-xs opacity-70">{ar.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div className="bg-snap-card border border-snap-border rounded-2xl p-4 shadow-card">
              <label className="block font-display font-semibold text-xs uppercase tracking-widest text-snap-muted mb-3">
                Resolution
              </label>
              <div className="space-y-2">
                {RESOLUTIONS.map(r => {
                  const meta = {
                    "1080p": { color: "text-snap-text",         note: "1920×1080 — fast" },
                    "4K":    { color: "text-snap-cyan",         note: "3840×2160 — ~4× longer" },
                    "8K":    { color: "text-snap-accent-bright",note: "7680×4320 — GPU heavy" },
                  }[r];
                  return (
                    <button key={r} onClick={() => setResolution(r)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all
                        ${resolution === r
                          ? "border-snap-accent bg-snap-accent/10"
                          : "border-snap-border hover:border-snap-accent/30"}`}>
                      <span className={`font-display font-bold text-sm ${meta.color}`}>{r}</span>
                      <span className="text-xs text-snap-dim">{meta.note}</span>
                      {resolution === r && <span className="text-snap-accent"><Icon.Check /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className={`relative w-full py-4 rounded-2xl font-display font-bold text-base tracking-wide transition-all duration-300
              flex items-center justify-center gap-3 overflow-hidden
              ${generating || !prompt.trim()
                ? "bg-snap-surface border border-snap-border text-snap-dim cursor-not-allowed"
                : "bg-snap-accent hover:bg-snap-accent-bright text-white shadow-accent hover:shadow-accent hover:scale-[1.01] active:scale-[0.99]"}`}
          >
            {!generating && !prompt.trim() && <><Icon.Wand /><span>Enter a prompt to generate</span></>}
            {!generating && prompt.trim() && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-snap-accent via-snap-accent-bright to-snap-accent bg-[length:200%] animate-shimmer opacity-20" />
                <Icon.Wand />
                <span>Generate Video</span>
                <span className="text-snap-accent-bright/60 text-xs font-mono">Ctrl+↵</span>
              </>
            )}
            {generating && <><Spinner size={20} /><span>Generating…</span></>}
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* RIGHT: Preview + History */}
        <div className="lg:w-[440px] xl:w-[480px] flex flex-col gap-5">

          {/* Video Preview */}
          <div className="bg-snap-card border border-snap-border rounded-2xl overflow-hidden shadow-card">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="font-display font-semibold text-sm uppercase tracking-widest text-snap-muted">Preview</span>
              {activeVideo && (
                <div className="flex gap-2">
                  <a
                    href={videoUrl(activeVideo.filename)}
                    download={`snap-video-${activeVideo.id}.mp4`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-snap-surface border border-snap-border
                      text-snap-muted hover:text-snap-text hover:border-snap-accent/40 transition-all text-xs"
                  >
                    <Icon.Download /> Download
                  </a>
                </div>
              )}
            </div>

            <div className="px-4 pb-4">
              <div className={`relative bg-snap-surface rounded-xl overflow-hidden w-full ${activeRatio?.cssClass || "ratio-16-9"}`}>
                {generating && <GeneratingAnimation />}

                {!generating && activeVideo && (
                  <video
                    ref={videoRef}
                    key={activeVideo.id}
                    src={videoUrl(activeVideo.filename)}
                    controls
                    autoPlay
                    loop
                    className="absolute inset-0 w-full h-full object-contain animate-fade-in"
                  />
                )}

                {!generating && !activeVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-snap-dim">
                    <div className="opacity-30 animate-float">
                      <Icon.Film />
                    </div>
                    <p className="text-sm text-center px-8 leading-relaxed">
                      Your generated video will appear here.<br />
                      <span className="text-snap-accent/60">Enter a prompt and hit Generate.</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Video metadata */}
              {activeVideo && !generating && (
                <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                  {[
                    { label: activeVideo.resolution, color: "text-snap-cyan" },
                    { label: activeVideo.aspect_ratio, color: "text-snap-muted" },
                    { label: activeVideo.provider.replace(/_/g, " "), color: "text-snap-accent-bright" },
                  ].map((b, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded-md bg-snap-surface border border-snap-border text-xs font-mono ${b.color}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="bg-snap-card border border-snap-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-semibold text-sm uppercase tracking-widest text-snap-muted">
                Recent Videos
              </span>
              <span className="text-xs text-snap-dim font-mono">{history.length}/5 saved</span>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-snap-dim text-sm">No videos yet</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {history.map(rec => (
                  <VideoHistoryCard
                    key={rec.id}
                    record={rec}
                    isActive={activeVideo?.id === rec.id}
                    onSelect={v => { setActiveVideo(v); setAspectRatio(v.aspect_ratio); setResolution(v.resolution); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-snap-border/40 mt-4 py-5 text-center">
        <p className="text-xs text-snap-dim font-mono">
          Snap Video Studio · Runs locally on <span className="text-snap-accent">localhost:5000</span> · Free & open-source
        </p>
      </footer>

      {/* Settings modal */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
