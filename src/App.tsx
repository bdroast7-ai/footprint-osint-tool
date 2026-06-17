import { useState, useEffect, useRef } from "react";
import { Terminal } from "./components/Terminal";
import { CodeViewer } from "./components/CodeViewer";
import { UsernameDemo } from "./components/UsernameDemo";
import { MetadataDemo } from "./components/MetadataDemo";
import { ArchitectureMap } from "./components/ArchitectureMap";

// ── Animated matrix-rain canvas ───────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = Math.floor(canvas.width / 16);
    const drops: number[] = Array(cols).fill(1);
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ";

    const draw = () => {
      ctx.fillStyle = "rgba(9,9,11,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#16a34a";
      ctx.font = "13px 'JetBrains Mono', monospace";

      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.95 ? "#4ade80" : "#166534";
        ctx.fillText(ch, i * 16, drops[i] * 16);
        if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 55);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
    />
  );
}

// ── ASCII Banner ───────────────────────────────────────────────────────────
const BANNER_LINES = [
  " ███████╗ ██████╗  ██████╗ ████████╗██████╗ ██████╗ ██╗███╗   ██╗████████╗",
  " ██╔════╝██╔═══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝",
  " █████╗  ██║   ██║██║   ██║   ██║   ██████╔╝██████╔╝██║██╔██╗ ██║   ██║   ",
  " ██╔══╝  ██║   ██║██║   ██║   ██║   ██╔═══╝ ██╔══██╗██║██║╚██╗██║   ██║   ",
  " ██║     ╚██████╔╝╚██████╔╝   ██║   ██║     ██║  ██║██║██║ ╚████║   ██║   ",
  " ╚═╝      ╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝  ",
];

// ── Tab config ─────────────────────────────────────────────────────────────
type Tab = "overview" | "username" | "metadata" | "code" | "architecture";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",     label: "Overview",     icon: "⚡" },
  { id: "username",     label: "Username Recon", icon: "🔍" },
  { id: "metadata",     label: "Image Metadata", icon: "🖼" },
  { id: "code",         label: "Source Code",  icon: "📄" },
  { id: "architecture", label: "Architecture", icon: "🧩" },
];

// ── Terminal demo lines ────────────────────────────────────────────────────
const TERMINAL_DEMO = [
  { text: "footprint --username johndoe", type: "command" as const, delay: 300 },
  { text: "", type: "output" as const, delay: 80 },
  { text: '<span style="color:#4ade80;font-weight:bold">╔══════════════════════════════════════════════════════════╗</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#4ade80;font-weight:bold">║           F O O T P R I N T  v1.0.0                    ║</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#4ade80;font-weight:bold">╚══════════════════════════════════════════════════════════╝</span>', type: "output" as const, delay: 30 },
  { text: "", type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">──────── Username Intelligence Scan ────────</span>', type: "output" as const, delay: 50 },
  { text: '<span style="color:#a1a1aa">  Target: </span><span style="color:#fff;font-weight:bold">johndoe</span>', type: "output" as const, delay: 80 },
  { text: "", type: "output" as const, delay: 60 },
  { text: '<span style="color:#4ade80">⠋</span> Scanning johndoe across <span style="color:#22d3ee">28</span> platforms …   <span style="color:#a1a1aa">[ 3/28]  11%  0.3s</span>', type: "output" as const, delay: 200 },
  { text: '<span style="color:#4ade80">⠙</span> Scanning johndoe — last: <span style="color:#22d3ee">GitHub</span>         <span style="color:#a1a1aa">[10/28]  36%  0.8s</span>', type: "output" as const, delay: 350 },
  { text: '<span style="color:#4ade80">⠸</span> Scanning johndoe — last: <span style="color:#22d3ee">Instagram</span>      <span style="color:#a1a1aa">[19/28]  68%  1.2s</span>', type: "output" as const, delay: 350 },
  { text: '<span style="color:#4ade80">⣿</span> Scan complete                          <span style="color:#a1a1aa">[28/28] 100%  1.7s</span>', type: "output" as const, delay: 300 },
  { text: "", type: "output" as const, delay: 80 },
  { text: '<span style="color:#22d3ee">╭──────────────────┬─────────────┬────────────────────────────────╮</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#22d3ee">│</span> <span style="color:#d946ef;font-weight:bold"> Platform         </span><span style="color:#22d3ee">│</span><span style="color:#d946ef;font-weight:bold">   Status    </span><span style="color:#22d3ee">│</span><span style="color:#d946ef;font-weight:bold"> Profile URL                    </span><span style="color:#22d3ee">│</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#22d3ee">├──────────────────┼─────────────┼────────────────────────────────┤</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold"> GitHub           </span><span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold">● FOUND     </span> <span style="color:#22d3ee">│</span> <span style="color:#4ade80;text-decoration:underline">https://github.com/johndoe</span>     <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold"> Reddit           </span><span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold">● FOUND     </span> <span style="color:#22d3ee">│</span> <span style="color:#4ade80;text-decoration:underline">https://reddit.com/user/johndoe</span> <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> <span style="color:#71717a"> Instagram        </span><span style="color:#22d3ee">│</span> <span style="color:#71717a">○ NOT FOUND </span> <span style="color:#22d3ee">│</span> <span style="color:#71717a;text-decoration:line-through">https://instagram.com/johndoe</span>  <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold"> Dev.to           </span><span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold">● FOUND     </span> <span style="color:#22d3ee">│</span> <span style="color:#4ade80;text-decoration:underline">https://dev.to/johndoe</span>         <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> <span style="color:#71717a"> X / Twitter      </span><span style="color:#22d3ee">│</span> <span style="color:#71717a">○ NOT FOUND </span> <span style="color:#22d3ee">│</span> <span style="color:#71717a;text-decoration:line-through">https://x.com/johndoe</span>          <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold"> Letterboxd       </span><span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold">● FOUND     </span> <span style="color:#22d3ee">│</span> <span style="color:#4ade80;text-decoration:underline">https://letterboxd.com/johndoe</span> <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">╰──────────────────┴─────────────┴────────────────────────────────╯</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#4ade80;font-weight:bold">  10 found</span><span style="color:#71717a"> · 18 not found · 28 platforms scanned</span>', type: "output" as const, delay: 80 },
  { text: "", type: "output" as const, delay: 40 },
  { text: '<span style="color:#4ade80;font-weight:bold">──────── Footprint scan complete ────────</span>', type: "output" as const, delay: 50 },
];

const METADATA_TERMINAL = [
  { text: "footprint --image vacation_photo.jpg", type: "command" as const, delay: 300 },
  { text: "", type: "output" as const, delay: 80 },
  { text: '<span style="color:#22d3ee">──────── Image Metadata Analysis ────────</span>', type: "output" as const, delay: 50 },
  { text: '<span style="color:#a1a1aa">  File: </span><span style="color:#fff;font-weight:bold">vacation_photo.jpg</span>', type: "output" as const, delay: 80 },
  { text: "", type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">╭──────────────────────────┬─────────────────────────────────────────╮</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#22d3ee">│</span> <span style="color:#d946ef;font-weight:bold"> Field                    </span><span style="color:#22d3ee">│</span> <span style="color:#d946ef;font-weight:bold"> Value                                   </span><span style="color:#22d3ee">│</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#22d3ee">├──────────────────────────┼─────────────────────────────────────────┤</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#22d3ee">│</span> 📷  Camera Make           <span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold">Apple</span>                                   <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> 📷  Camera Model          <span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold">iPhone 14 Pro</span>                           <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> 🖥   Software              <span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold">17.4.1</span>                                  <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> 📅  Date / Time           <span style="color:#22d3ee">│</span> <span style="color:#4ade80;font-weight:bold">2024:03:15 14:22:11</span>                     <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> 🌐  Latitude              <span style="color:#22d3ee">│</span> <span style="color:#f87171;font-weight:bold">51.501364° N</span>                            <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> 🌐  Longitude             <span style="color:#22d3ee">│</span> <span style="color:#f87171;font-weight:bold">0.141890° W</span>                             <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> 🗺   Altitude              <span style="color:#22d3ee">│</span> <span style="color:#f87171;font-weight:bold">11.3 m</span>                                  <span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">│</span> 📍  <span style="color:#f87171;font-weight:bold">Google Maps URL</span>     <span style="color:#22d3ee">│</span> <span style="color:#f87171;font-weight:bold;text-decoration:underline">https://maps.google.com/?q=51.501,−0.14</span><span style="color:#22d3ee">│</span>', type: "output" as const, delay: 60 },
  { text: '<span style="color:#22d3ee">╰──────────────────────────┴─────────────────────────────────────────╯</span>', type: "output" as const, delay: 30 },
  { text: '<span style="color:#f87171;font-weight:bold">  ⚠  GPS data can precisely identify photo location.</span>', type: "output" as const, delay: 80 },
];

// ── Stat ticker ────────────────────────────────────────────────────────────
function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors`}>
      <div className={`font-mono text-3xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBannerVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-zinc-800/60">
        <MatrixRain />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/60 to-zinc-950 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 text-center">
          {/* ASCII Banner */}
          <div
            className={`transition-all duration-1000 ${bannerVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            <pre
              className="text-green-400 text-[7px] sm:text-[9px] md:text-[11px] leading-tight font-mono overflow-x-auto mb-6 select-none"
              aria-label="Footprint"
            >
              {BANNER_LINES.join("\n")}
            </pre>
          </div>

          <div
            className={`transition-all duration-700 delay-500 ${bannerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <p className="text-zinc-400 text-lg mb-2 max-w-2xl mx-auto leading-relaxed">
              Lightweight, high-performance{" "}
              <span className="text-green-400 font-semibold">OSINT & automation</span>{" "}
              command-line tool built with modern async Python.
            </p>
            <p className="text-zinc-600 text-sm font-mono mb-8">
              Python 3.10+ · asyncio · httpx · Rich · Pillow · MIT License
            </p>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {[
                { label: "Python 3.10+", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                { label: "async/await",  color: "bg-green-500/10 text-green-400 border-green-500/20" },
                { label: "28+ Platforms", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
                { label: "Rich TUI",     color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
                { label: "MIT License",  color: "bg-zinc-700/60 text-zinc-300 border-zinc-600/30" },
                { label: "GPS Extraction", color: "bg-red-500/10 text-red-400 border-red-500/20" },
              ].map((b) => (
                <span key={b.label} className={`border font-mono text-xs px-3 py-1 rounded-full ${b.color}`}>
                  {b.label}
                </span>
              ))}
            </div>

            {/* Quick install */}
            <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3 font-mono text-sm">
              <span className="text-zinc-600">$</span>
              <span className="text-green-300">pip install -r requirements.txt</span>
              <span className="text-zinc-700">&amp;&amp;</span>
              <span className="text-amber-300">footprint --username</span>
              <span className="text-zinc-400">target</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard value="28+"   label="Platforms"        color="text-green-400" />
          <StatCard value="100%"  label="Async I/O"        color="text-cyan-400"  />
          <StatCard value="3"     label="Core Modules"     color="text-violet-400" />
          <StatCard value="0"     label="External DB Deps" color="text-amber-400" />
        </div>
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex overflow-x-auto gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border border-transparent"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Panels ─────────────────────────────────────────────── */}
        <div className="pb-20">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="font-mono text-sm text-zinc-500 uppercase tracking-widest">
                    Username Scan — Live Demo
                  </h2>
                  <Terminal lines={TERMINAL_DEMO} typingSpeed={12} />
                </div>
                <div className="space-y-4">
                  <h2 className="font-mono text-sm text-zinc-500 uppercase tracking-widest">
                    Metadata Extraction — Live Demo
                  </h2>
                  <Terminal lines={METADATA_TERMINAL} typingSpeed={14} autoPlay={false} />
                </div>
              </div>

              {/* Feature grid */}
              <div>
                <h2 className="font-mono text-sm text-zinc-500 uppercase tracking-widest mb-5">What Footprint Does</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: "🔍",
                      title: "Username Cross-Reference",
                      desc: "Concurrently fires async HTTP requests across 28+ platforms — GitHub, Reddit, Instagram, Steam, Letterboxd, Chess.com, and more. Results in seconds.",
                      color: "border-cyan-500/20 hover:border-cyan-500/40",
                    },
                    {
                      icon: "🖼",
                      title: "EXIF Metadata Extraction",
                      desc: "Parse JPEG/PNG EXIF data with Pillow. Surfaces camera make/model, software, timestamps, and GPS coordinates. Auto-generates a Google Maps link if GPS is present.",
                      color: "border-amber-500/20 hover:border-amber-500/40",
                    },
                    {
                      icon: "🎨",
                      title: "Hacker-Grade Terminal UI",
                      desc: "Rich-powered live progress spinners, colour-coded result tables, and ASCII art banners. Found accounts in bold green, missing in muted grey.",
                      color: "border-violet-500/20 hover:border-violet-500/40",
                    },
                  ].map((f) => (
                    <div key={f.title} className={`bg-zinc-900 border ${f.color} rounded-xl p-5 transition-colors`}>
                      <div className="text-3xl mb-3">{f.icon}</div>
                      <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick start */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="font-mono text-sm text-zinc-500 uppercase tracking-widest mb-4">Quick Start</h2>
                <div className="space-y-3">
                  {[
                    { step: "1", cmd: "git clone https://github.com/yourname/footprint.git && cd footprint", comment: "# Clone the repo" },
                    { step: "2", cmd: "pip install -r requirements.txt", comment: "# Install dependencies" },
                    { step: "3", cmd: "pip install -e .", comment: "# Install CLI entry point" },
                    { step: "4", cmd: "footprint --username johndoe", comment: "# Start scanning!" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3 font-mono text-sm">
                      <span className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 text-xs flex-shrink-0">
                        {item.step}
                      </span>
                      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 flex items-center gap-3 overflow-x-auto">
                        <span className="text-green-600">$</span>
                        <span className="text-zinc-200 whitespace-nowrap">{item.cmd}</span>
                        <span className="text-zinc-600 whitespace-nowrap ml-auto">{item.comment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERNAME RECON */}
          {activeTab === "username" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Username Reconnaissance</h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                  Interactive simulation of the async username scanner. Enter any username and watch the
                  scanner fire concurrent requests across all 28 registered platforms in real time.
                </p>
              </div>
              <UsernameDemo />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-mono text-sm text-green-400 font-bold mb-3">Edge Case Handling</h3>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    {[
                      ["HTTP 200 + 'not found' body", "Body-text signal detection per platform"],
                      ["HTTP 404 / 410",              "Immediate NOT FOUND classification"],
                      ["Redirect to homepage",        "Final URL comparison against known patterns"],
                      ["Timeout / ConnectionError",   "Graceful fallback with error message"],
                      ["Rate throttling (5xx)",       "Logged as error, does not crash scanner"],
                    ].map(([problem, solution]) => (
                      <li key={problem} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">▸</span>
                        <span>
                          <span className="text-white font-mono text-xs">{problem}</span>
                          <span className="text-zinc-600"> → </span>
                          <span>{solution}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <h3 className="font-mono text-sm text-cyan-400 font-bold mb-3">Technical Spec</h3>
                  <div className="space-y-2">
                    {[
                      { key: "HTTP Client",      val: "httpx.AsyncClient (HTTP/2)" },
                      { key: "Concurrency",      val: "asyncio.gather — all at once" },
                      { key: "Max Connections",  val: "25 simultaneous" },
                      { key: "Timeout",          val: "10s per request" },
                      { key: "User-Agent",       val: "Chrome 124 spoofed" },
                      { key: "Result Type",      val: "Frozen dataclass (immutable)" },
                    ].map(({ key, val }) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-zinc-500 text-xs min-w-[130px]">{key}</span>
                        <span className="text-zinc-300">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* METADATA */}
          {activeTab === "metadata" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Image Metadata Extractor</h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                  Toggle between a photo with embedded GPS data and one without. See how Footprint
                  extracts and presents EXIF metadata, and how GPS coordinates are converted to a
                  Google Maps link.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <MetadataDemo />
                <div className="space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <h3 className="font-mono text-sm text-amber-400 font-bold mb-3">GPS Conversion Algorithm</h3>
                    <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                      EXIF GPS data is stored as degrees/minutes/seconds tuples. Footprint converts them to decimal degrees:
                    </p>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm">
                      <div className="text-zinc-500 mb-2"># DMS → Decimal Degrees</div>
                      <div className="text-amber-300">decimal = degrees</div>
                      <div className="text-amber-300 pl-4">+ (minutes / 60)</div>
                      <div className="text-amber-300 pl-4">+ (seconds / 3600)</div>
                      <div className="text-zinc-500 mt-2"># Negate for S / W hemispheres</div>
                      <div className="text-green-300">if ref in ("S", "W"):</div>
                      <div className="text-green-300 pl-4">decimal = -decimal</div>
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <h3 className="font-mono text-sm text-amber-400 font-bold mb-3">Extracted Fields</h3>
                    <div className="space-y-2">
                      {[
                        { field: "Make",             tag: "EXIF:Make",              sensitive: false },
                        { field: "Model",            tag: "EXIF:Model",             sensitive: false },
                        { field: "Software",         tag: "EXIF:Software",          sensitive: false },
                        { field: "DateTimeOriginal", tag: "EXIF:DateTimeOriginal",  sensitive: false },
                        { field: "GPSLatitude",      tag: "GPS IFD:GPSLatitude",    sensitive: true  },
                        { field: "GPSLongitude",     tag: "GPS IFD:GPSLongitude",   sensitive: true  },
                        { field: "GPSLatitudeRef",   tag: "GPS IFD:GPSLatitudeRef", sensitive: true  },
                        { field: "GPSAltitude",      tag: "GPS IFD:GPSAltitude",    sensitive: true  },
                      ].map(({ field, tag, sensitive }) => (
                        <div key={field} className="flex items-center justify-between text-sm">
                          <span className={`font-mono text-xs ${sensitive ? "text-red-400" : "text-zinc-300"}`}>
                            {field}
                          </span>
                          <span className="text-zinc-600 font-mono text-xs">{tag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SOURCE CODE */}
          {activeTab === "code" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Source Code Explorer</h2>
                <p className="text-zinc-400 text-sm">
                  Browse the complete, production-ready Python source. Click any file in the sidebar.
                </p>
              </div>
              <CodeViewer />
            </div>
          )}

          {/* ARCHITECTURE */}
          {activeTab === "architecture" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Architecture</h2>
                <p className="text-zinc-400 text-sm max-w-2xl">
                  Footprint is designed for extensibility. Each OSINT module is fully independent — add new
                  capabilities by dropping a new file into <code className="text-green-400 font-mono">footprint/modules/</code>.
                </p>
              </div>
              <ArchitectureMap />

              {/* Roadmap */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-mono text-sm text-zinc-500 uppercase tracking-widest mb-4">Roadmap</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: "🔎", item: "DNS Enumeration", desc: "Async subdomain discovery", planned: true },
                    { icon: "📧", item: "Email OSINT",     desc: "Breach DB + MX analysis",   planned: true },
                    { icon: "🌍", item: "WHOIS Lookup",    desc: "Domain registration history", planned: true },
                    { icon: "📸", item: "Reverse Image Search", desc: "Perceptual hash matching", planned: true },
                    { icon: "📁", item: "JSON / CSV Export", desc: "Structured result output",  planned: true },
                    { icon: "🧅", item: "Tor / SOCKS5 Proxy", desc: "Anonymised scanning",     planned: false },
                  ].map(({ icon, item, desc, planned }) => (
                    <div key={item} className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${
                      planned ? "border-zinc-700 bg-zinc-800/40" : "border-zinc-800 bg-zinc-900/40"
                    }`}>
                      <span className="text-xl">{icon}</span>
                      <div>
                        <div className="font-mono text-sm text-white">{item}</div>
                        <div className="font-mono text-xs text-zinc-500">{desc}</div>
                      </div>
                      <span className={`ml-auto font-mono text-[10px] px-2 py-0.5 rounded ${
                        planned
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                      }`}>
                        {planned ? "planned" : "backlog"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 bg-zinc-900/30 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-sm text-zinc-600">
            <span className="text-green-400 font-bold">Footprint</span>
            <span> v1.0.0 · MIT License · Python 3.10+</span>
          </div>
          <div className="flex gap-4 font-mono text-xs text-zinc-600">
            <span>httpx · rich · Pillow</span>
            <span className="text-zinc-700">·</span>
            <span className="text-green-600">asyncio · type-hinted</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
