export default function ExecutiveSummaryCard({ summary, takeaways, conclusion }: { summary?: string; takeaways?: string[]; conclusion?: string }) {
  if (!summary) return null;

  return (
    <section className="mb-20">
      <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Executive Summary</div>
      <div className="bg-gradient-to-br from-blue-500/[0.04] via-transparent to-purple-500/[0.04] border border-white/[0.06] rounded-2xl p-8 sm:p-10">
        <p className="text-base sm:text-lg text-white/85 leading-[1.75] mb-6 max-w-3xl">{summary}</p>
        {takeaways && takeaways.length > 0 && (
          <div className="border-t border-white/[0.06] pt-6 mt-6">
            <div className="text-xs text-white/30 uppercase tracking-[0.12em] font-medium mb-4">Key Takeaways</div>
            <ul className="space-y-2">
              {takeaways.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/70">
                  <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
