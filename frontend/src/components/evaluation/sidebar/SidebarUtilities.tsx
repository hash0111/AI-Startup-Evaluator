"use client";

import { useState, useEffect } from "react";
import { deepDiveManager } from "@/lib/deep-dive-manager";
import type { SectionStatus } from "@/lib/deep-dive-manager";

interface SidebarUtilitiesProps {
  onDeepDiveNavigate: (section: string) => void;
}

const DEEP_DIVE_ITEMS = [
  { id: "market-intelligence", label: "Market Intelligence" },
  { id: "competitor-intelligence", label: "Competitor Analysis" },
  { id: "target-audience", label: "Target Audience" },
  { id: "monetization-strategy", label: "Monetization Strategy" },
  { id: "go-to-market-plan", label: "Go-To-Market Plan" },
  { id: "risk-register", label: "Risk Register" },
];

function StatusBadge({ status }: { status: SectionStatus }) {
  const styles: Record<SectionStatus, { bg: string; text: string; label: string }> = {
    idle: { bg: "bg-white/[0.04]", text: "text-white/30", label: "Generate" },
    queued: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Queued" },
    generating: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Generating..." },
    ready: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "✓ Cached" },
    error: { bg: "bg-red-500/10", text: "text-red-400", label: "Retry" },
  };
  const s = styles[status];
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text} min-w-[72px] text-center inline-block`}>
      {s.label}
    </span>
  );
}

export default function SidebarUtilities({ onDeepDiveNavigate }: SidebarUtilitiesProps) {
  const [statuses, setStatuses] = useState<Map<string, SectionStatus>>(new Map());

  useEffect(() => {
    const initial = new Map<string, SectionStatus>();
    for (const item of DEEP_DIVE_ITEMS) {
      initial.set(item.id, deepDiveManager.getSectionStatus(item.id));
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

  const cachedCount = [...statuses.values()].filter((s) => s === "ready").length;
  const generatingCount = [...statuses.values()].filter((s) => s === "generating" || s === "queued").length;

  return (
    <div className="border-t border-white/[0.06] bg-[#090B12] shrink-0">
      {/* Deep Dives */}
      <div className="px-3 pt-3 pb-2">
        <div className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] font-bold mb-2 px-2">
          Deep Dives
        </div>
        <div className="space-y-0.5">
          {DEEP_DIVE_ITEMS.map((item) => {
            const status = statuses.get(item.id) || "idle";
            return (
              <button
                key={item.id}
                onClick={() => onDeepDiveNavigate(item.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors text-left group"
              >
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors truncate mr-2">
                  {item.label}
                </span>
                <StatusBadge status={status} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Cache Status */}
      {(cachedCount > 0 || generatingCount > 0) && (
        <div className="px-5 pb-3 flex items-center gap-3 text-[11px]">
          {cachedCount > 0 && (
            <span className="text-emerald-500/60">
              <span className="text-emerald-400">✓</span> {cachedCount} cached
            </span>
          )}
          {generatingCount > 0 && (
            <span className="text-amber-500/60">
              <span className="text-amber-400">⟳</span> {generatingCount} generating
            </span>
          )}
        </div>
      )}
    </div>
  );
}
