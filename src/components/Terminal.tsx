import { useEffect, useRef, useState } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "success" | "error" | "info" | "dim" | "banner";
  delay?: number;
}

interface TerminalProps {
  lines: TerminalLine[];
  className?: string;
  autoPlay?: boolean;
  typingSpeed?: number;
}

export function Terminal({ lines, className = "", autoPlay = true, typingSpeed = 18 }: TerminalProps) {
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const playLines = () => {
    clearTimeouts();
    setVisibleLines([]);
    setDone(false);
    setIsPlaying(true);

    let cumDelay = 0;
    lines.forEach((line, i) => {
      const lineDelay = line.delay ?? (line.type === "command" ? 400 : typingSpeed * 2);
      cumDelay += lineDelay;
      const t = setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
        if (i === lines.length - 1) {
          setIsPlaying(false);
          setDone(true);
        }
      }, cumDelay);
      timeoutsRef.current.push(t);
    });
  };

  useEffect(() => {
    if (autoPlay) {
      const t = setTimeout(playLines, 600);
      timeoutsRef.current.push(t);
    }
    return clearTimeouts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const getLineStyle = (type: TerminalLine["type"]) => {
    switch (type) {
      case "command": return "text-green-400 font-bold";
      case "success": return "text-green-300";
      case "error":   return "text-red-400";
      case "info":    return "text-cyan-400";
      case "dim":     return "text-zinc-500";
      case "banner":  return "text-green-400 font-bold text-xs leading-tight";
      default:        return "text-zinc-300";
    }
  };

  return (
    <div className={`bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl shadow-black/60 ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="flex-1 text-center text-xs text-zinc-500 font-mono">footprint — terminal</span>
        <button
          onClick={isPlaying ? undefined : playLines}
          className={`text-xs font-mono px-2 py-0.5 rounded transition-all ${
            isPlaying
              ? "text-zinc-600 cursor-not-allowed"
              : "text-green-400 hover:text-green-300 hover:bg-green-400/10 cursor-pointer"
          }`}
        >
          {isPlaying ? "running…" : done ? "↺ replay" : "▶ run"}
        </button>
      </div>

      {/* Terminal body */}
      <div
        ref={containerRef}
        className="p-5 font-mono text-sm overflow-y-auto"
        style={{ minHeight: "320px", maxHeight: "480px" }}
      >
        {visibleLines.map((line, i) => (
          <div key={i} className={`leading-relaxed ${getLineStyle(line.type)}`}>
            {line.type === "command" ? (
              <span>
                <span className="text-green-600">❯ </span>
                {line.text}
              </span>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: line.text }} />
            )}
          </div>
        ))}
        {isPlaying && (
          <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}
