"use client";

const REPO_URL = "https://github.com/anomalyco/Ai_Startup_Evaluator";

export default function SidebarHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-4 shrink-0">
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span className="text-xs font-semibold tracking-tight">Evaluator</span>
      </a>
      <button onClick={onToggle} className="text-zinc-600 hover:text-zinc-400 transition-colors p-1" title="Close sidebar">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}
