"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";

export default function FloatingAICopilot({
  report,
  activeSection,
}: {
  report: unknown;
  activeSection?: string;
}) {
  const chat = useChat(report);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape" && isOpen) {
        if (chat.editingId !== null) { chat.cancelEdit(); return; }
        setIsOpen(false);
      }
    },
    [isOpen, chat]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.streamingContent]);

  const isStreaming = chat.streamState === "streaming" || chat.streamState === "thinking";

  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (!text && !isStreaming) return;
    if (isStreaming) {
      chat.stop();
    } else {
      chat.sendQuestion(text!);
      inputRef.current!.value = "";
      inputRef.current!.style.height = "auto";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Ask AI
          <span className="text-[10px] text-white/50 hidden sm:inline">⌘J</span>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 z-[60] sm:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
              className="fixed top-0 right-0 z-[70] h-full w-[400px] max-w-[90vw] bg-[#0B0D12]/95 backdrop-blur-2xl border-l border-white/[0.06] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-white">AI Research Assistant</span>
                  {activeSection && (
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full capitalize truncate">
                      {activeSection.replace(/-/g, " ")}
                    </span>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white/60 transition-colors p-1 shrink-0 ml-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {chat.messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="text-3xl mb-3">🔍</div>
                    <p className="text-sm text-white/60 mb-2">Ask me anything about this research</p>
                    <p className="text-xs text-white/30">I have full context of the deep dive report</p>
                  </div>
                )}
                {chat.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600/80 text-white"
                        : "bg-white/[0.04] text-white/80 border border-white/[0.06]"
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.status === "aborted" && msg.role === "assistant" && (
                        <div className="text-[11px] text-amber-400/60 mt-1 italic">(Response interrupted)</div>
                      )}
                      {msg.status === "failed" && (
                        <div className="text-[11px] text-red-400/60 mt-1 italic">Failed to generate</div>
                      )}
                    </div>
                  </div>
                ))}
                {chat.streamState === "thinking" && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 text-sm">
                      <span className="text-white/40 italic">Thinking...</span>
                    </div>
                  </div>
                )}
                {chat.streamState === "streaming" && chat.streamingContent && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 text-sm text-white/80 whitespace-pre-wrap">
                      {chat.streamingContent}
                      <span className="animate-pulse">▊</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/[0.06] p-4 shrink-0">
                <div className="flex items-end gap-2 bg-white/[0.03] rounded-xl border border-white/[0.06] px-3 py-2">
                  <textarea
                    ref={inputRef}
                    onChange={autoResize}
                    onKeyDown={handleKeyPress}
                    placeholder={isStreaming ? "Interrupt and ask..." : "Ask a question..."}
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none outline-none max-h-[120px] py-1"
                    disabled={chat.editingId !== null}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!isStreaming && !((inputRef.current?.value.length ?? 0) > 0)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {isStreaming ? (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
