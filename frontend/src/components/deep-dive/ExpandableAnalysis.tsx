"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisBlock } from "./types";

export default function ExpandableAnalysis({ blocks }: { blocks?: AnalysisBlock[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium mb-6">Detailed Analysis</div>
      <div className="space-y-3">
        {blocks.map((block, i) => {
          const open = expanded === i;
          const preview = block.content.split(".").slice(0, 2).join(".") + ".";
          return (
            <div key={i} className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.015]">
              <button
                onClick={() => setExpanded(open ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white mb-1">{block.heading}</div>
                  {!open && <div className="text-xs text-white/40 truncate max-w-xl">{preview}</div>}
                </div>
                <motion.svg
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4 text-white/30 shrink-0 ml-3"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-white/[0.04] pt-4">
                      <p className="text-sm text-white/75 leading-[1.75] mb-4">{block.content}</p>
                      {block.evidence && block.evidence.length > 0 && (
                        <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
                          <div className="text-[11px] text-white/30 uppercase tracking-[0.1em] mb-2">Supporting Evidence</div>
                          <ul className="space-y-1.5">
                            {block.evidence.map((ev, j) => (
                              <li key={j} className="flex gap-2 text-xs text-white/60">
                                <span className="text-blue-400 shrink-0 mt-0.5">▸</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
