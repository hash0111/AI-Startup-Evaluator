export default function SourceCard({ sources }: { sources?: string[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Sources</div>
      <div className="space-y-2">
        {sources.map((url, i) => {
          let domain = "";
          try { domain = new URL(url).hostname.replace("www.", ""); } catch { domain = url; }
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
              <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center shrink-0 text-[10px] text-white/40 font-mono">
                {domain[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/60 truncate">{domain}</div>
                <div className="text-[11px] text-white/30 truncate">{url}</div>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 shrink-0 font-medium px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                Open
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
