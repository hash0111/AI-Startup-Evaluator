"use client";

import { useState, useEffect } from "react";

const NAV_SECTIONS = [
  { id: "hero", label: "Overview" },
  { id: "executive-summary", label: "Executive Summary" },
  { id: "insights", label: "Key Insights" },
  { id: "metrics", label: "Statistics" },
  { id: "charts", label: "Charts" },
  { id: "analysis", label: "Analysis" },
  { id: "risks", label: "Risks" },
  { id: "recommendations", label: "Recommendations" },
  { id: "sources", label: "Sources" },
];

function elementExists(id: string): boolean {
  if (typeof document === "undefined") return false;
  return !!document.getElementById(id);
}

export default function SectionNavigator() {
  const [active, setActive] = useState("hero");
  const [available, setAvailable] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const existing = NAV_SECTIONS.filter(s => elementExists(s.id)).map(s => s.id);
      setAvailable(existing);
    };
    check();
    const timer = setTimeout(check, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (available.length < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    for (const id of available) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [available]);

  useEffect(() => {
    if (available.length < 2) { setVisible(false); return; }
    const handleScroll = () => setVisible(window.scrollY > 400);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [available]);

  if (!visible || available.length < 2) return null;

  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
      <div className="space-y-1">
        {NAV_SECTIONS.filter(s => available.includes(s.id)).map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`block text-[11px] tracking-wide transition-all duration-300 text-left w-full py-1 ${
                isActive ? "text-white font-medium" : "text-white/20 hover:text-white/50"
              }`}
            >
              <span className="inline-block w-2 h-px mr-2 align-middle transition-all duration-300" style={{ backgroundColor: isActive ? "#3b82f6" : "rgba(255,255,255,0.15)", width: isActive ? 16 : 8 }} />
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
