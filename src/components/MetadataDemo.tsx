import { useState } from "react";

interface MetadataField {
  icon: string;
  label: string;
  value: string | null;
  sensitive?: boolean;
}

const SAMPLE_DATA: MetadataField[] = [
  { icon: "📷", label: "Camera Make",       value: "Apple",                        sensitive: false },
  { icon: "📷", label: "Camera Model",      value: "iPhone 14 Pro",                sensitive: false },
  { icon: "🖥",  label: "Software",          value: "17.4.1",                       sensitive: false },
  { icon: "📅", label: "Date / Time",       value: "2024:03:15 14:22:11",          sensitive: false },
  { icon: "🌐", label: "Latitude",          value: "51.501364° N",                 sensitive: true  },
  { icon: "🌐", label: "Longitude",         value: "0.141890° W",                  sensitive: true  },
  { icon: "🗺",  label: "Altitude",          value: "11.3 m",                       sensitive: true  },
  { icon: "📍", label: "Google Maps URL",   value: "https://www.google.com/maps/search/?api=1&query=51.501364,-0.141890", sensitive: true },
];

const NO_GPS_DATA: MetadataField[] = [
  { icon: "📷", label: "Camera Make",    value: "Canon",       sensitive: false },
  { icon: "📷", label: "Camera Model",  value: "EOS R5",      sensitive: false },
  { icon: "🖥",  label: "Software",      value: "Lightroom 7", sensitive: false },
  { icon: "📅", label: "Date / Time",   value: "2024:01:08 09:41:00", sensitive: false },
  { icon: "🌐", label: "Latitude",      value: null,          sensitive: true  },
  { icon: "🌐", label: "Longitude",     value: null,          sensitive: true  },
  { icon: "🗺",  label: "Altitude",      value: null,          sensitive: true  },
  { icon: "📍", label: "Google Maps URL", value: null,        sensitive: true  },
];

function MetadataRow({ field, visible }: { field: MetadataField; visible: boolean }) {
  const delay = Math.random() * 300;

  return (
    <div
      className={`flex items-start gap-0 border-b border-zinc-800/60 last:border-0 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 py-3 px-4 min-w-[11rem] border-r border-zinc-800/60">
        <span className="text-base">{field.icon}</span>
        <span className="font-mono text-xs text-zinc-400">{field.label}</span>
      </div>
      <div className="flex-1 py-3 px-4">
        {field.value ? (
          field.label === "Google Maps URL" ? (
            <a
              href={field.value}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-red-400 underline decoration-red-400/40 hover:text-red-300 break-all"
            >
              {field.value}
            </a>
          ) : (
            <span className={`font-mono text-xs font-semibold ${
              field.sensitive ? "text-red-300" : "text-green-300"
            }`}>
              {field.value}
            </span>
          )
        ) : (
          <span className="font-mono text-xs text-zinc-600 italic">— not available</span>
        )}
      </div>
    </div>
  );
}

export function MetadataDemo() {
  const [dataset, setDataset] = useState<"gps" | "no-gps">("gps");
  const [visible, setVisible] = useState(true);

  const data = dataset === "gps" ? SAMPLE_DATA : NO_GPS_DATA;
  const hasGPS = dataset === "gps";

  const switchDataset = (next: "gps" | "no-gps") => {
    setVisible(false);
    setTimeout(() => {
      setDataset(next);
      setVisible(true);
    }, 300);
  };

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
          <span className="text-xs text-zinc-500 font-mono">image metadata analysis</span>
        </div>

        {/* Sample selector */}
        <div className="flex gap-2">
          <button
            onClick={() => switchDataset("gps")}
            className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all ${
              dataset === "gps"
                ? "bg-red-500/10 border border-red-500/30 text-red-400"
                : "bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            }`}
          >
            📍 photo_with_gps.jpg
          </button>
          <button
            onClick={() => switchDataset("no-gps")}
            className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all ${
              dataset === "no-gps"
                ? "bg-zinc-700/40 border border-zinc-600/40 text-zinc-300"
                : "bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            }`}
          >
            🖼 photo_no_gps.jpg
          </button>
        </div>
      </div>

      {/* Command line */}
      <div className="bg-zinc-950 border-b border-zinc-800/60 px-5 py-2.5 font-mono text-xs">
        <span className="text-green-600">❯ </span>
        <span className="text-green-400">footprint </span>
        <span className="text-zinc-400">--image </span>
        <span className="text-amber-300">
          {dataset === "gps" ? "photo_with_gps.jpg" : "photo_no_gps.jpg"}
        </span>
      </div>

      {/* Table title */}
      <div className="px-5 py-3 border-b border-zinc-800/60">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-cyan-400 font-bold">Image Metadata Report</span>
          <span className="font-mono text-xs text-zinc-600">
            {dataset === "gps" ? "photo_with_gps.jpg" : "photo_no_gps.jpg"}
          </span>
        </div>
      </div>

      {/* Table header */}
      <div className="flex bg-zinc-900/50 border-b border-zinc-800">
        <div className="py-2 px-4 min-w-[11rem] border-r border-zinc-800/60">
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Field</span>
        </div>
        <div className="flex-1 py-2 px-4">
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Value</span>
        </div>
      </div>

      {/* Rows */}
      <div>
        {data.map((field, i) => (
          <MetadataRow key={i} field={field} visible={visible} />
        ))}
      </div>

      {/* Footer */}
      <div className={`px-5 py-3 border-t border-zinc-800 font-mono text-xs ${
        hasGPS ? "bg-red-500/5 text-red-400" : "bg-zinc-900/50 text-zinc-600"
      }`}>
        {hasGPS
          ? "⚠  GPS data found — this image can be precisely geolocated"
          : "✓  No GPS coordinates found in this image"}
      </div>
    </div>
  );
}
