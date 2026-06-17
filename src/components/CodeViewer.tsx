import { useState } from "react";
import { FILE_CONTENTS, FILE_TREE, FileNode } from "../data/fileContents";

// ── Minimal syntax highlighter (no external deps) ──────────────────────────
function highlightPython(code: string): string {
  const keywords = [
    "from", "import", "def", "async", "await", "return", "class", "if", "else",
    "elif", "for", "while", "try", "except", "finally", "with", "as", "in",
    "not", "and", "or", "is", "None", "True", "False", "raise", "yield",
    "pass", "break", "continue", "lambda", "global", "nonlocal", "del",
    "assert", "__future__", "Optional", "list", "dict", "str", "int", "float",
    "bool", "tuple", "set", "type", "dataclass", "field", "frozen", "slots",
  ];

  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Triple-quoted docstrings
    .replace(/("""[\s\S]*?""")/g, '<span class="text-zinc-500 italic">$1</span>')
    // Single-line comments
    .replace(/(#[^\n]*)/g, '<span class="text-zinc-500 italic">$1</span>')
    // Strings
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="text-amber-300">$1</span>')
    // f-strings prefix
    .replace(/\bf(["'])/g, '<span class="text-orange-400">f</span><span class="text-amber-300">$1</span>')
    // Decorators
    .replace(/(@\w+)/g, '<span class="text-pink-400">$1</span>')
    // Keywords
    .replace(
      new RegExp(`\\b(${keywords.join("|")})\\b`, "g"),
      '<span class="text-violet-400 font-semibold">$1</span>'
    )
    // Built-in functions
    .replace(/\b(print|len|str|int|float|list|dict|set|tuple|range|enumerate|zip|map|filter|sorted|any|all|next|iter|hasattr|getattr|setattr|isinstance|issubclass|callable|type|super|object|staticmethod|classmethod|property)\b/g,
      '<span class="text-sky-400">$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-300">$1</span>')
    // Function definitions
    .replace(/\bdef\s+(\w+)/g, 'def <span class="text-yellow-300 font-bold">$1</span>')
    // Class definitions
    .replace(/\bclass\s+(\w+)/g, 'class <span class="text-green-300 font-bold">$1</span>');
}

function highlightMarkdown(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^(#{1,6})\s(.+)$/gm, '<span class="text-yellow-300 font-bold">$1 $2</span>')
    .replace(/\*\*(.+?)\*\*/g, '<span class="text-white font-bold">**$1**</span>')
    .replace(/`([^`]+)`/g, '<span class="text-green-300 bg-zinc-800 px-0.5 rounded">`$1`</span>')
    .replace(/^```[\s\S]*?```$/gm, (m) => `<span class="text-zinc-400">${m}</span>`)
    .replace(/^\s*[-*]\s/gm, '<span class="text-cyan-400">• </span>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<span class="text-cyan-400">[$1]</span><span class="text-zinc-500">($2)</span>');
}

function highlight(code: string, lang?: string): string {
  if (lang === "python") return highlightPython(code);
  if (lang === "markdown") return highlightMarkdown(code);
  return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── File Tree Node ─────────────────────────────────────────────────────────
function TreeNode({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  selected: string | null;
  onSelect: (path: string, lang?: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const indent = depth * 14;

  if (node.type === "dir") {
    return (
      <div>
        <button
          className="w-full flex items-center gap-1 py-1 px-2 rounded text-left hover:bg-zinc-800/50 transition-colors"
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="text-zinc-500 text-xs">{open ? "▾" : "▸"}</span>
          <span className="text-zinc-400 text-sm font-mono">{node.name}</span>
        </button>
        {open && node.children?.map((child, i) => (
          <TreeNode key={i} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  const isSelected = node.path === selected;
  const ext = node.name.split(".").pop();
  const icon =
    ext === "py" ? "🐍" :
    ext === "md" ? "📄" :
    ext === "txt" ? "📋" : "📁";

  return (
    <button
      className={`w-full flex items-center gap-2 py-1.5 px-2 rounded text-left transition-all text-sm font-mono ${
        isSelected
          ? "bg-green-400/10 text-green-300 border-l-2 border-green-400"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border-l-2 border-transparent"
      }`}
      style={{ paddingLeft: `${indent + 8}px` }}
      onClick={() => node.path && onSelect(node.path, node.language)}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{node.name}</span>
    </button>
  );
}

// ── Main CodeViewer ────────────────────────────────────────────────────────
export function CodeViewer() {
  const [selectedPath, setSelectedPath] = useState<string>("footprint/cli.py");
  const [selectedLang, setSelectedLang] = useState<string>("python");
  const [copied, setCopied] = useState(false);

  const content = FILE_CONTENTS[selectedPath] ?? "// Select a file to view its contents";
  const lines = content.split("\n");

  const handleSelect = (path: string, lang?: string) => {
    setSelectedPath(path);
    setSelectedLang(lang ?? "text");
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/60 flex"
         style={{ minHeight: "520px", maxHeight: "680px" }}>
      {/* Sidebar */}
      <div className="w-52 border-r border-zinc-800 bg-zinc-900/60 overflow-y-auto flex-shrink-0 py-2">
        <div className="px-3 py-2 mb-1">
          <span className="text-xs text-zinc-600 uppercase tracking-widest font-mono">Explorer</span>
        </div>
        {FILE_TREE.map((node, i) => (
          <TreeNode key={i} node={node} depth={0} selected={selectedPath} onSelect={handleSelect} />
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-3 py-1 rounded-t border-t border-x border-zinc-700">
              {selectedPath.split("/").pop()}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={`text-xs font-mono px-3 py-1 rounded transition-all ${
              copied
                ? "text-green-400 bg-green-400/10"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {copied ? "✓ copied!" : "⧉ copy"}
          </button>
        </div>

        {/* Code area */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse font-mono text-sm">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-zinc-800/30 group">
                  <td className="select-none text-right pr-4 pl-4 text-zinc-700 group-hover:text-zinc-600 w-10 text-xs align-top pt-[1px] sticky left-0 bg-zinc-950 border-r border-zinc-900">
                    {i + 1}
                  </td>
                  <td className="pl-4 pr-4 whitespace-pre text-zinc-300 leading-relaxed align-top pt-[1px]">
                    <span dangerouslySetInnerHTML={{ __html: highlight(line, selectedLang) || "&nbsp;" }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 px-4 py-1.5 bg-zinc-900/80 border-t border-zinc-800 text-xs font-mono text-zinc-600 flex-shrink-0">
          <span className="text-green-600">●</span>
          <span>{selectedPath}</span>
          <span className="ml-auto">{lines.length} lines</span>
          <span className="capitalize">{selectedLang}</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
