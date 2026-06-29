"use client";

interface Section {
  label: string;
  id: string;
}

interface SidebarNavigationProps {
  sections: Section[];
  activeSection: string;
  onScrollTo: (id: string) => void;
  onDeepDive: (id: string) => void;
}

const DEEP_DIVE_SECTIONS = new Set([
  "market-intelligence", "target-audience", "monetization-strategy",
  "go-to-market-plan", "risk-register", "competitor-intelligence",
]);

export default function SidebarNavigation({
  sections,
  activeSection,
  onScrollTo,
  onDeepDive,
}: SidebarNavigationProps) {
  return (
    <nav className="flex-1 overflow-y-auto min-h-0 px-2 py-1 space-y-0.5">
      {sections.map((s) => {
        const hasDeepDive = DEEP_DIVE_SECTIONS.has(s.id);
        return (
          <div key={s.id} className="flex items-center gap-0.5 group">
            <button
              onClick={() => onScrollTo(s.id)}
              className={`flex-1 text-left px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSection === s.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
              }`}
            >
              {s.label}
            </button>
            {hasDeepDive && (
              <button
                onClick={() => onDeepDive(s.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500/60 hover:text-blue-400 transition-all px-1 py-1.5 shrink-0"
                title="Open Deep Dive"
              >
                →
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
