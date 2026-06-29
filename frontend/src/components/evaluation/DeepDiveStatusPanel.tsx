"use client";

import { useState, useEffect } from "react";
import { deepDiveManager } from "@/lib/deep-dive-manager";
import type { SectionStatus } from "@/lib/deep-dive-manager";

interface SectionInfo {
  id: string;
  label: string;
  priority: "high" | "low";
}

const ALL_SECTIONS: SectionInfo[] = [
  { id: "market-intelligence", label: "Market Intelligence", priority: "high" },
  { id: "competitor-intelligence", label: "Competitor Analysis", priority: "high" },
  { id: "target-audience", label: "Target Audience", priority: "high" },
  { id: "monetization-strategy", label: "Monetization Strategy", priority: "high" },
  { id: "go-to-market-plan", label: "Go-To-Market Plan", priority: "low" },
  { id: "risk-register", label: "Risk Register", priority: "low" },
];

function StatusBadge({ status }: { status: SectionStatus }) {
  const styles: Record<SectionStatus, { bg: string; text: string; label: string }> = {
    idle: { bg: "bg-white/[0.03]", text: "text-white/30", label: "Generate" },
    queued: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Queued" },
    generating: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Generating..." },
    ready: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "✓ Cached" },
    error: { bg: "bg-red-500/10", text: "text-red-400", label: "Retry" },
  };
  const s = styles[status];
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export default function DeepDiveStatusPanel({
  onNavigate,
}: {
  onNavigate: (section: string) => void;
}) {
  const [statuses, setStatuses] = useState<Map<string, SectionStatus>>(new Map());

  useEffect(() => {
    const initial = new Map<string, SectionStatus>();
    for (const s of ALL_SECTIONS) {
      initial.set(s.id, deepDiveManager.getSectionStatus(s.id));
    }
    setStatuses(initial);

    const unsub = deepDiveManager.subscribe((section, status) => {
      setStatuses((prev) => {
        const next = new Map(prev);
        next.set(section, status);
        return next;
      });
    });

    return unsub;
  }, []);

  const highPriority = ALL_SECTIONS.filter((s) => s.priority === "high");
  const lowPriority = ALL_SECTIONS.filter((s) => s.priority === "low");

  return (
    <div className="px-3 py-2">
      <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-3 px-2">
        Deep Dives
      </div>
      <div className="space-y-0.5">
        {highPriority.map((s) => (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors text-left"
          >
            <span className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">{s.label}</span>
            <StatusBadge status={statuses.get(s.id) || "idle"} />
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.04]">
        <div className="text-[10px] text-zinc-600 uppercase tracking-[0.1em] font-medium mb-2 px-2">
          Additional
        </div>
        <div className="space-y-0.5">
          {lowPriority.map((s) => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors text-left"
            >
              <span className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{s.label}</span>
              <StatusBadge status={statuses.get(s.id) || "idle"} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
