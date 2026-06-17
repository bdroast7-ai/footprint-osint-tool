interface ModuleCard {
  icon: string;
  title: string;
  file: string;
  description: string;
  tags: string[];
  color: string;
  borderColor: string;
  tagColor: string;
}

const MODULES: ModuleCard[] = [
  {
    icon: "⚡",
    title: "cli.py",
    file: "Entrypoint & Terminal UI",
    description:
      "argparse-powered CLI orchestrator. Renders Rich panels, live progress bars, and colour-coded tables. Calls all OSINT modules and formats their results.",
    tags: ["rich", "argparse", "asyncio"],
    color: "from-green-500/10 to-transparent",
    borderColor: "border-green-500/30",
    tagColor: "bg-green-500/10 text-green-400",
  },
  {
    icon: "🔍",
    title: "username.py",
    file: "modules/username.py",
    description:
      "Async username cross-referencer. Fires concurrent HTTP GET requests via httpx.AsyncClient across 28+ platforms. Handles false-positives, timeouts, and redirect detection.",
    tags: ["asyncio", "httpx", "dataclass"],
    color: "from-cyan-500/10 to-transparent",
    borderColor: "border-cyan-500/30",
    tagColor: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: "🖼",
    title: "metadata.py",
    file: "modules/metadata.py",
    description:
      "EXIF metadata extractor using Pillow. Parses JPEG/PNG EXIF tags, converts raw GPS DMS tuples to decimal degrees, and builds a Google Maps deep-link URL.",
    tags: ["Pillow", "PIL", "GPS"],
    color: "from-amber-500/10 to-transparent",
    borderColor: "border-amber-500/30",
    tagColor: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: "🛠",
    title: "helpers.py",
    file: "utils/helpers.py",
    description:
      "Shared constants and the platform URL registry. Add a new OSINT target in a single line — no changes to the scanner required.",
    tags: ["constants", "config", "registry"],
    color: "from-violet-500/10 to-transparent",
    borderColor: "border-violet-500/30",
    tagColor: "bg-violet-500/10 text-violet-400",
  },
];

interface FeatureBadge {
  icon: string;
  label: string;
  sublabel: string;
}

const FEATURES: FeatureBadge[] = [
  { icon: "⚡", label: "Async I/O",       sublabel: "asyncio + httpx"    },
  { icon: "🎨", label: "Rich Terminal",   sublabel: "panels & tables"    },
  { icon: "🧩", label: "Modular",         sublabel: "plug-in new modules" },
  { icon: "🔒", label: "Type-Safe",       sublabel: "Python 3.10+ hints"  },
  { icon: "🌐", label: "28+ Platforms",   sublabel: "username recon"     },
  { icon: "📍", label: "GPS Extraction",  sublabel: "decimal degrees"    },
];

export function ArchitectureMap() {
  return (
    <div className="space-y-8">
      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES.map((mod) => (
          <div
            key={mod.title}
            className={`relative rounded-xl border ${mod.borderColor} bg-gradient-to-br ${mod.color} p-5 overflow-hidden group hover:scale-[1.01] transition-transform duration-200`}
          >
            {/* Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                 style={{ background: "radial-gradient(ellipse at top left, rgba(74,222,128,0.04) 0%, transparent 70%)" }} />

            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">{mod.icon}</span>
              <div>
                <div className="font-mono text-sm font-bold text-white">{mod.title}</div>
                <div className="font-mono text-xs text-zinc-500">{mod.file}</div>
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed mb-3">
              {mod.description}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {mod.tags.map((tag) => (
                <span key={tag} className={`font-mono text-[11px] px-2 py-0.5 rounded ${mod.tagColor}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Feature badges */}
      <div>
        <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3">
          Key Capabilities
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-700 transition-colors"
            >
              <span className="text-xl">{f.icon}</span>
              <div>
                <div className="font-mono text-xs font-bold text-white">{f.label}</div>
                <div className="font-mono text-[11px] text-zinc-600">{f.sublabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dependency flow */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-4">
          Dependency Flow
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          {[
            { label: "cli.py", color: "text-green-400 border-green-500/40 bg-green-500/5" },
            { label: "→", color: "text-zinc-600" },
            { label: "username.py", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/5" },
            { label: "+", color: "text-zinc-600" },
            { label: "metadata.py", color: "text-amber-400 border-amber-500/40 bg-amber-500/5" },
            { label: "→", color: "text-zinc-600" },
            { label: "helpers.py", color: "text-violet-400 border-violet-500/40 bg-violet-500/5" },
          ].map((item, i) =>
            item.label === "→" || item.label === "+" ? (
              <span key={i} className={`${item.color} font-bold`}>{item.label}</span>
            ) : (
              <span key={i} className={`border px-2.5 py-1 rounded-lg text-xs ${item.color}`}>
                {item.label}
              </span>
            )
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          {[
            { lib: "httpx",  desc: "Async HTTP client" },
            { lib: "rich",   desc: "Terminal UI framework" },
            { lib: "Pillow", desc: "Image & EXIF processing" },
          ].map((dep) => (
            <div key={dep.lib} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span className="font-mono text-xs text-zinc-400">
                <span className="text-white">{dep.lib}</span>
                <span className="text-zinc-600"> — {dep.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
