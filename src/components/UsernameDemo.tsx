import { useState, useEffect, useRef } from "react";
import { PLATFORMS } from "../data/fileContents";

type PlatformStatus = "pending" | "scanning" | "found" | "not-found";

interface PlatformResult {
  name: string;
  category: string;
  url: string;
  status: PlatformStatus;
}

const CATEGORY_COLORS: Record<string, string> = {
  Dev: "text-sky-400",
  Social: "text-pink-400",
  Creative: "text-amber-400",
  Entertainment: "text-purple-400",
  Professional: "text-cyan-400",
};

// Simulated results (in a real tool these come from async HTTP)
const SIMULATED_FOUND = new Set([
  "GitHub", "Reddit", "Dev.to", "Medium", "Letterboxd",
  "Chess.com", "Codepen", "Dribbble", "Keybase", "SoundCloud",
]);

export function UsernameDemo() {
  const [username, setUsername] = useState("johndoe");
  const [inputValue, setInputValue] = useState("johndoe");
  const [results, setResults] = useState<PlatformResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const startScan = (uname: string) => {
    clearAll();
    setDone(false);
    setProgress(0);
    setIsScanning(true);

    const initial: PlatformResult[] = PLATFORMS.map((p) => ({
      name: p.name,
      category: p.category,
      url: p.url.replace("{}", uname),
      status: "pending",
    }));
    setResults(initial);

    // Stagger scan animations
    const total = PLATFORMS.length;
    PLATFORMS.forEach((platform, i) => {
      // Start scanning
      const scanDelay = 80 + i * 95 + Math.random() * 40;
      const t1 = setTimeout(() => {
        setResults((prev) =>
          prev.map((r) => r.name === platform.name ? { ...r, status: "scanning" } : r)
        );
      }, scanDelay);

      // Resolve result
      const resolveDelay = scanDelay + 200 + Math.random() * 300;
      const t2 = setTimeout(() => {
        const found = SIMULATED_FOUND.has(platform.name);
        setResults((prev) =>
          prev.map((r) => r.name === platform.name ? { ...r, status: found ? "found" : "not-found" } : r)
        );
        setProgress(Math.round(((i + 1) / total) * 100));
        if (i === total - 1) {
          setIsScanning(false);
          setDone(true);
        }
      }, resolveDelay);

      timeoutsRef.current.push(t1, t2);
    });
  };

  useEffect(() => {
    const t = setTimeout(() => startScan("johndoe"), 800);
    timeoutsRef.current.push(t);
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = () => {
    const uname = inputValue.trim().replace(/^@/, "") || "johndoe";
    setUsername(uname);
    startScan(uname);
  };

  const found = results.filter((r) => r.status === "found").length;
  const notFound = results.filter((r) => r.status === "not-found").length;
  const scanning = results.filter((r) => r.status === "scanning").length;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/60">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-zinc-500 font-mono">username reconnaissance</span>
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 focus-within:border-green-500/50 transition-colors">
            <span className="text-green-600 font-mono text-sm">$</span>
            <span className="text-zinc-500 font-mono text-sm">footprint --username</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isScanning && handleScan()}
              placeholder="target_user"
              className="flex-1 bg-transparent text-green-300 font-mono text-sm outline-none placeholder-zinc-700"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className={`px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
              isScanning
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-400 text-zinc-950 cursor-pointer shadow-lg shadow-green-500/20"
            }`}
          >
            {isScanning ? "scanning…" : "▶ scan"}
          </button>
        </div>

        {/* Progress bar */}
        {(isScanning || done) && (
          <div className="mt-3">
            <div className="flex justify-between text-xs font-mono text-zinc-500 mb-1">
              <span>
                {isScanning
                  ? `scanning "${username}" · ${scanning > 0 ? `${scanning} active` : ""}`
                  : `scan complete · "${username}"`}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results grid */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: "440px" }}>
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-600 font-mono text-sm">
            Enter a username and click scan
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {results.map((r) => (
              <div
                key={r.name}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-300 ${
                  r.status === "found"
                    ? "bg-green-400/5 border-green-500/20"
                    : r.status === "not-found"
                    ? "bg-zinc-900/40 border-zinc-800/60"
                    : r.status === "scanning"
                    ? "bg-cyan-400/5 border-cyan-500/20 animate-pulse"
                    : "bg-zinc-900/20 border-zinc-800/40"
                }`}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {r.status === "found" && (
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
                  )}
                  {r.status === "not-found" && (
                    <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  )}
                  {r.status === "scanning" && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                  {r.status === "pending" && (
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  )}
                </div>

                {/* Platform info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-semibold truncate ${
                      r.status === "found" ? "text-green-300"
                      : r.status === "scanning" ? "text-cyan-300"
                      : "text-zinc-500"
                    }`}>
                      {r.name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono ${CATEGORY_COLORS[r.category] ?? "text-zinc-600"} opacity-70`}>
                    {r.category}
                  </span>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  {r.status === "found" && (
                    <span className="text-[10px] font-mono font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                      FOUND
                    </span>
                  )}
                  {r.status === "not-found" && (
                    <span className="text-[10px] font-mono text-zinc-700 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                      NONE
                    </span>
                  )}
                  {r.status === "scanning" && (
                    <span className="text-[10px] font-mono text-cyan-400 animate-pulse">
                      ···
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {done && (
        <div className="border-t border-zinc-800 bg-zinc-900/50 px-5 py-3 flex items-center gap-4 font-mono text-xs">
          <span className="text-green-400 font-bold">{found} found</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500">{notFound} not found</span>
          <span className="text-zinc-600">·</span>
          <span className="text-cyan-400">{results.length} platforms</span>
          <div className="ml-auto text-zinc-600">scan complete ✓</div>
        </div>
      )}
    </div>
  );
}
