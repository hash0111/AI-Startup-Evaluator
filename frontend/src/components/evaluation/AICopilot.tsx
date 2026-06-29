"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import type { Message } from "@/hooks/useChat";

// ── Markdown (same) ──

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer.map((row) =>
      row.split("|").filter((c) => c.trim()).map((c) => c.trim())
    );
    if (rows.length < 2) { tableBuffer = []; return; }
    const headers = rows[0];
    const dataRows = rows.slice(2);
    nodes.push(
      <div key={`t-${nodes.length}`} className="overflow-x-auto my-2">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="text-left text-zinc-400 font-medium px-2 py-1.5 border-b border-white/[0.06]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="text-zinc-300 px-2 py-1.5 border-b border-white/[0.04]">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inCodeBlock) {
      if (line.trim().startsWith("```")) {
        inCodeBlock = false;
        nodes.push(
          <pre key={`c-${nodes.length}`} className="bg-[#0a0a0f] rounded-lg p-3 my-2 overflow-x-auto text-[13px] text-zinc-300 font-mono leading-relaxed">
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        continue;
      }
      codeBuffer.push(line);
      continue;
    }
    if (line.trim().startsWith("```")) {
      inCodeBlock = true;
      continue;
    }
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      tableBuffer.push(line);
      continue;
    }
    if (inTable) { flushTable(); inTable = false; }
    if (line.trim() === "") { nodes.push(<div key={`g-${nodes.length}`} className="h-2" />); continue; }

    const processed = processInline(line);

    if (line.trim().startsWith("### ")) {
      nodes.push(<h3 key={`h3-${nodes.length}`} className="text-sm font-semibold text-zinc-200 mt-3 mb-1">{processed}</h3>);
    } else if (line.trim().startsWith("## ")) {
      nodes.push(<h2 key={`h2-${nodes.length}`} className="text-base font-semibold text-zinc-200 mt-4 mb-1">{processed}</h2>);
    } else if (line.trim().startsWith("# ")) {
      nodes.push(<h1 key={`h1-${nodes.length}`} className="text-lg font-semibold text-zinc-200 mt-4 mb-1">{processed}</h1>);
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = line.trim().slice(2);
      nodes.push(
        <div key={`li-${nodes.length}`} className="flex items-start gap-2 text-[13px] text-zinc-300 leading-relaxed ml-1">
          <span className="text-zinc-500 mt-[5px] shrink-0">{'\u2022'}</span>
          <span>{processInline(content)}</span>
        </div>
      );
    } else if (/^\d+[.)]\s/.test(line.trim())) {
      const content = line.trim().replace(/^\d+[.)]\s/, "");
      nodes.push(
        <div key={`ol-${nodes.length}`} className="flex items-start gap-2 text-[13px] text-zinc-300 leading-relaxed ml-1">
          <span className="text-zinc-500 mt-[5px] shrink-0 font-medium text-[11px] min-w-[16px]">
            {line.trim().match(/^\d+/)?.[0]}
          </span>
          <span>{processInline(content)}</span>
        </div>
      );
    } else {
      nodes.push(<p key={`p-${nodes.length}`} className="text-[13px] text-zinc-300 leading-[1.6]">{processed}</p>);
    }
  }
  if (inCodeBlock) {
    nodes.push(
      <pre key={`c-${nodes.length}`} className="bg-[#0a0a0f] rounded-lg p-3 my-2 overflow-x-auto text-[13px] text-zinc-300 font-mono leading-relaxed">
        <code>{codeBuffer.join("\n")}</code>
      </pre>
    );
  }
  if (inTable) flushTable();
  return nodes;
}

function processInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) {
      parts.push(<strong key={`b-${match.index}`} className="text-zinc-200 font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<code key={`c-${match.index}`} className="bg-[#0a0a0f] text-blue-300 px-1 py-0.5 rounded text-[12px] font-mono">{match[3]}</code>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : [text];
}

// ── Constants ──

const SUGGESTED_QUESTIONS = [
  "Why did I receive this score?",
  "Biggest investment risk",
  "Improve my valuation",
  "Explain SWOT",
  "Compare competitors",
  "Target audience",
  "Revenue model",
  "Investment thesis",
];

const WELCOME_MESSAGE = `I\u2019ve analyzed your startup report.

Ask me anything about:

\u2022 Market assumptions
\u2022 Competition
\u2022 GTM strategy
\u2022 Risks
\u2022 Valuation
\u2022 Recommendations`;

const SECTION_LABELS: Record<string, string> = {
  "executive-overview": "Executive Overview",
  "executive-recommendations": "Recommendations",
  "market-intelligence": "Market Intelligence",
  "target-audience": "Target Audience",
  "monetization-strategy": "Monetization",
  "go-to-market-plan": "GTM Plan",
  "customer-acquisition": "Acquisition",
  "tool-stack": "Tool Stack",
  "risk-register": "Risk Register",
  "competitor-intelligence": "Competition Analysis",
  "improvement-strategy": "Improvements",
  "strategic-challenges": "Strategic Challenges",
  "mvp-roadmap": "MVP Roadmap",
  "sources": "Sources",
};

// ── Icons ──

function PencilIcon() { return (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
); }
function RefreshIcon() { return (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 3v5h-5" />
  </svg>
); }
function CopyIcon() { return (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
); }
function CheckIcon() { return (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
); }
function TrashIcon() { return (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
); }
function SendIcon() { return (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
); }
function StopIcon() { return (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
); }

// ── Sub-components ──

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <span className="text-[13px] text-zinc-500">Thinking</span>
      <span className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}

interface ActionBtnProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}

function ActionBtn({ onClick, title, icon }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-all duration-150"
    >
      {icon}
    </button>
  );
}

// ── Main Component ──

interface AICopilotProps {
  report: unknown;
  activeSection?: string;
}

export default function AICopilot({ report, activeSection }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editText, setEditText] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);

  const chat = useChat(report);

  const {
    messages, input, setInput, editingId,
    streamingContent, streamState, error, copiedId, isGenerating,
    send, sendQuestion, stop, retry, regenerate, continueGeneration,
    startEdit: chatStartEdit, cancelEdit, saveEdit, deleteMsg, copyMessage,
  } = chat;

  const activeSectionLabel = activeSection ? SECTION_LABELS[activeSection] : null;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId === null) setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, editingId]);

  useEffect(() => {
    if (isOpen && !isMobile && editingId === null) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen, isMobile, editingId]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent]);

  const handleStartEdit = useCallback((msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (msg?.role === "user") {
      setEditText(msg.content);
      chatStartEdit(msgId);
      setTimeout(() => editRef.current?.focus(), 50);
    }
  }, [messages, chatStartEdit]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(editText); }
    },
    [cancelEdit, saveEdit, editText]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    },
    [send]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    setInput(e.target.value);
  };

  const handleEditTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    setEditText(e.target.value);
  };

  const close = useCallback(() => setIsOpen(false), []);

  const buttonLabel = activeSectionLabel
    ? `Ask about ${activeSectionLabel}`
    : "Ask AI about this report";

  const hasConversationStarted = messages.length > 0 || isGenerating;

  // ── Render message ──

  function MessageBubble({ msg }: { msg: Message }) {
    const isCopied = copiedId === msg.id;
    const [showActions, setShowActions] = useState(false);
    const isUser = msg.role === "user";
    const isAssistant = msg.role === "assistant";
    const isInEdit = isUser && editingId === msg.id;
    const canShowActions = isUser ? editingId !== msg.id : msg.status === "completed";

    useEffect(() => {
      if (!showActions) return;
      const handler = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "c") {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) copyMessage(msg.id);
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [showActions, msg.id]);

    const userActions = (
      <div className="flex flex-col gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <ActionBtn onClick={() => handleStartEdit(msg.id)} title="Edit" icon={<PencilIcon />} />
        <ActionBtn onClick={() => deleteMsg(msg.id)} title="Delete" icon={<TrashIcon />} />
      </div>
    );

    const assistantActions = (
      <div className="flex flex-col gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <ActionBtn onClick={() => copyMessage(msg.id)} title={isCopied ? "Copied" : "Copy"} icon={isCopied ? <CheckIcon /> : <CopyIcon />} />
        <ActionBtn onClick={() => regenerate(msg.id)} title="Regenerate" icon={<RefreshIcon />} />
        <ActionBtn onClick={() => deleteMsg(msg.id)} title="Delete" icon={<TrashIcon />} />
      </div>
    );

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-1.5 group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Left: assistant actions */}
        {isAssistant && canShowActions && assistantActions}

        {/* Spacer before user messages */}
        {isUser && <div className="flex-1" />}

        {/* Message content */}
        {isInEdit ? (
          <div className="max-w-[80%]">
            <textarea
              ref={editRef}
              value={editText}
              onChange={handleEditTextChange}
              onKeyDown={handleEditKeyDown}
              rows={1}
              className="w-full bg-[rgba(255,255,255,0.06)] text-zinc-200 text-[13px] rounded-[18px] px-3.5 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40 overflow-y-hidden"
              style={{ minHeight: "38px", maxHeight: "120px" }}
            />
            <div className="flex justify-end gap-2 mt-1.5">
              <button onClick={cancelEdit} className="text-[11px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors">
                Cancel
              </button>
              <button onClick={() => saveEdit(editText)} disabled={!editText.trim()} className="text-[11px] text-blue-400 hover:text-blue-300 disabled:text-zinc-600 px-2 py-1 rounded transition-colors">
                Save
              </button>
            </div>
          </div>
        ) : isUser ? (
          <div className="max-w-[80%] bg-[rgba(255,255,255,0.06)] rounded-[18px] px-3.5 py-2.5 text-[13px] text-zinc-200 leading-snug">
            {msg.content}
          </div>
        ) : (
          <div className="max-w-[92%] text-[13px] text-zinc-300 leading-[1.6]">
            {renderMarkdown(msg.content)}
            {msg.status === "aborted" && msg.content && (
              <p className="text-[11px] text-zinc-600 italic mt-1">(Response interrupted)</p>
            )}
            {msg.status === "aborted" && (
              <motion.button
                onClick={() => continueGeneration(msg.id)}
                whileHover={{ x: 2 }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg px-3 py-1.5 mt-2 transition-colors"
              >
                Continue generating {'\u2192'}
              </motion.button>
            )}
            {msg.status === "failed" && (
              <motion.button onClick={retry} whileHover={{ x: 2 }} className="text-[11px] text-amber-400/70 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg px-3 py-1.5 mt-2 transition-colors">
                Retry
              </motion.button>
            )}
          </div>
        )}

        {/* Right: user actions */}
        {isUser && canShowActions && userActions}
      </motion.div>
    );
  }

  // ── Sheet content ──

  const sheetContent = (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-200 tracking-tight">
            AI Due Diligence Copilot
          </h3>
          {activeSectionLabel && (
            <p className="text-[11px] text-zinc-600 mt-0.5 flex items-center gap-1 leading-snug">
              <span className="text-green-500/70 text-[10px]">{'\u2713'}</span>
              Reading: {activeSectionLabel}
            </p>
          )}
        </div>
        <button
          onClick={close}
          className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors shrink-0 text-zinc-500 hover:text-zinc-300"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Separator ── */}
      <div className="shrink-0 mx-4 h-px bg-white/[0.04]" />

      {/* ── Conversation ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-4">
        {!hasConversationStarted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <div className="text-[13px] text-zinc-300 leading-[1.6] whitespace-pre-line">
              {WELCOME_MESSAGE}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <motion.button
                  key={q}
                  onClick={() => sendQuestion(q)}
                  whileHover={{ y: -1 }}
                  className="text-[11px] text-zinc-500 bg-[rgba(255,255,255,0.03)] hover:text-zinc-300 hover:bg-[rgba(255,255,255,0.06)] border border-white/[0.06] rounded-full px-3 py-1.5 transition-colors duration-200 leading-snug"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>

        {streamingContent && !messages.some((m) => m.status === "streaming") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="max-w-[92%] text-[13px] text-zinc-300 leading-[1.6]">
              {renderMarkdown(streamingContent)}
            </div>
          </motion.div>
        )}

        {streamState === "thinking" && !streamingContent && <TypingIndicator />}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 py-2">
            <p className="text-[12px] text-red-400 text-center">{error}</p>
            <button
              onClick={retry}
              className="text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 px-4 pb-3 pt-2">
        <div className="flex items-end bg-[rgba(255,255,255,0.04)] rounded-[14px] border border-white/[0.08] focus-within:border-blue-500/30 focus-within:shadow-[0_0_24px_rgba(59,130,246,0.04)] transition-all duration-300">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? "Interrupt and ask..." : "Ask about your report..."}
            rows={1}
            className="flex-1 bg-transparent text-[13px] text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none px-3.5 py-3 leading-relaxed overflow-y-hidden"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          {isGenerating ? (
            <motion.button
              onClick={stop}
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-7 h-7 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center shrink-0 transition-colors mr-2 mb-2.5"
              title="Stop generating"
            >
              <span className="text-white"><StopIcon /></span>
            </motion.button>
          ) : (
            <motion.button
              onClick={send}
              disabled={!input.trim()}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-white/[0.06] flex items-center justify-center shrink-0 transition-colors disabled:cursor-not-allowed mr-2 mb-2.5"
            >
              <span className="text-white disabled:text-zinc-600"><SendIcon /></span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3 rounded-full border border-white/[0.08] bg-[rgba(16,16,18,0.85)] backdrop-blur-[20px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm text-zinc-300 hover:text-white"
          >
            <span className="text-base">{'\u2728'}</span>
            <span className="font-medium whitespace-nowrap">{buttonLabel}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={close}
              />
            )}

            <motion.div
              className={`z-50 flex flex-col ${
                isMobile
                  ? "fixed inset-0 bg-[rgba(10,10,12,0.98)]"
                  : "fixed bottom-6 right-6 w-[90vw] max-w-[680px] h-[480px] max-h-[85vh] rounded-2xl border border-white/[0.08] bg-[rgba(16,16,18,0.92)] backdrop-blur-[24px] shadow-2xl"
              }`}
              initial={{ opacity: 0, y: isMobile ? "100%" : 20, scale: isMobile ? 1 : 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? "100%" : 10, scale: isMobile ? 1 : 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.8 }}
            >
              {sheetContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
