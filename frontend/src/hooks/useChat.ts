"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { chatWithReport } from "@/lib/api";

// ── Types ──

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  status: "sending" | "streaming" | "completed" | "aborted" | "failed";
}

export type StreamState = "idle" | "thinking" | "streaming";

export interface ChatAPI {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  editingId: string | null;
  streamingContent: string;
  streamState: StreamState;
  error: string | null;
  copiedId: string | null;
  isGenerating: boolean;
  send: () => void;
  sendQuestion: (text: string) => void;
  stop: () => void;
  retry: () => void;
  regenerate: (msgId: string) => void;
  continueGeneration: (msgId: string) => void;
  startEdit: (msgId: string) => void;
  cancelEdit: () => void;
  saveEdit: (newText: string) => void;
  deleteMsg: (msgId: string) => void;
  copyMessage: (msgId: string) => void;
}

// ── ID generator ──

let idCounter = 0;
function nextId(): string {
  return `m_${Date.now().toString(36)}_${++idCounter}`;
}

// ── Hook ──

export function useChat(report: unknown): ChatAPI {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef("");
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── Mutators (immutable) ──

  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    const full: Message = { ...msg, id: nextId(), timestamp: Date.now() };
    setMessages((prev) => [...prev, full]);
    return full;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  // ── Abort ──

  const interrupt = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const savePartialAsAborted = useCallback(() => {
    const partial = streamingContentRef.current;
    setStreamState("idle");
    streamingContentRef.current = "";
    setStreamingContent("");
    if (!partial) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.status === "streaming") {
        return [
          ...prev.slice(0, -1),
          { ...last, content: partial, status: "aborted" as const },
        ];
      }
      return [...prev, { id: nextId(), role: "assistant", content: partial, timestamp: Date.now(), status: "aborted" }];
    });
  }, []);

  // ── Stream core ──

  const startStream = useCallback(
    async (msgs: Message[], continueMsgId?: string) => {
      const controller = new AbortController();
      abortRef.current = controller;

      const existingContent = (() => {
        if (!continueMsgId) return "";
        const found = msgs.find((m) => m.id === continueMsgId);
        return found?.content || "";
      })();

      let fullContent = existingContent;

      if (continueMsgId) {
        updateMessage(continueMsgId, { status: "streaming" });
      }

      setStreamState("thinking");
      setStreamingContent(fullContent);
      streamingContentRef.current = fullContent;
      setError(null);

      try {
        const res = await chatWithReport(report, msgs, undefined, controller.signal);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let hasReceivedToken = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setError(parsed.error);
                setStreamState("idle");
                setStreamingContent("");
                streamingContentRef.current = "";
                if (continueMsgId) updateMessage(continueMsgId, { status: "failed" });
                return;
              }

              if (parsed.content === "[DONE]") {
                setStreamState("idle");
                streamingContentRef.current = "";
                setStreamingContent("");
                if (continueMsgId) {
                  updateMessage(continueMsgId, { content: fullContent, status: "completed" });
                } else {
                  addMessage({ role: "assistant", content: fullContent, status: "completed" });
                }
                return;
              }

              if (!hasReceivedToken) {
                hasReceivedToken = true;
                setStreamState("streaming");
              }

              fullContent += parsed.content;
              streamingContentRef.current = fullContent;
              setStreamingContent(fullContent);

              if (continueMsgId) {
                updateMessage(continueMsgId, { content: fullContent });
              }
            } catch { /* partial line */ }
          }
        }

        setStreamState("idle");
        streamingContentRef.current = "";
        setStreamingContent("");
        if (continueMsgId) {
          updateMessage(continueMsgId, { content: fullContent, status: "completed" });
        } else if (fullContent) {
          addMessage({ role: "assistant", content: fullContent, status: "completed" });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          if (continueMsgId) {
            updateMessage(continueMsgId, { status: "aborted" });
          }
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to send message");
        setStreamState("idle");
        setStreamingContent("");
        streamingContentRef.current = "";
        if (continueMsgId) updateMessage(continueMsgId, { status: "failed" });
      }
    },
    [report, addMessage, updateMessage]
  );

  // ── send ──

  const executeSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setInput("");
      setError(null);

      const currentMessages = messagesRef.current;

      if (streamState !== "idle") {
        const partial = streamingContentRef.current;
        interrupt();

        let base: Message[];
        if (partial) {
          const last = currentMessages[currentMessages.length - 1];
          if (last?.role === "assistant" && last.status === "streaming") {
            base = [
              ...currentMessages.slice(0, -1),
              { ...last, content: partial, status: "aborted" as const },
            ];
          } else {
            base = [
              ...currentMessages,
              { id: nextId(), role: "assistant" as const, content: partial, timestamp: Date.now(), status: "aborted" as const },
            ];
          }
        } else {
          base = currentMessages;
        }

        streamingContentRef.current = "";
        setStreamingContent("");
        setStreamState("idle");

        const updated = [...base, { id: nextId(), role: "user" as const, content: trimmed, timestamp: Date.now(), status: "completed" as const }];
        setMessages(updated);
        startStream(updated);
      } else if (editingId !== null) {
        const idx = currentMessages.findIndex((m) => m.id === editingId);
        if (idx === -1) return;
        const before = currentMessages.slice(0, idx);
        const updated = [...before, { id: nextId(), role: "user" as const, content: trimmed, timestamp: Date.now(), status: "completed" as const }];
        setEditingId(null);
        setMessages(updated);
        startStream(updated);
      } else {
        const updated = [
          ...currentMessages,
          { id: nextId(), role: "user" as const, content: trimmed, timestamp: Date.now(), status: "completed" as const },
        ];
        setMessages(updated);
        startStream(updated);
      }
    },
    [streamState, editingId, interrupt, startStream]
  );

  const send = useCallback(() => executeSend(input), [input, executeSend]);
  const sendQuestion = useCallback((text: string) => executeSend(text), [executeSend]);

  // ── stop ──

  const stop = useCallback(() => {
    if (streamState === "idle") return;
    interrupt();
    savePartialAsAborted();
  }, [streamState, interrupt, savePartialAsAborted]);

  // ── retry ──

  const retry = useCallback(() => {
    setError(null);
    const currentMessages = messagesRef.current;
    let lastUserIdx = -1;
    for (let i = currentMessages.length - 1; i >= 0; i--) {
      if (currentMessages[i].role === "user") { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;
    const truncated = currentMessages.slice(0, lastUserIdx + 1);
    setMessages(truncated);
    startStream(truncated);
  }, [startStream]);

  // ── regenerate ──

  const regenerate = useCallback(
    (msgId: string) => {
      if (streamState !== "idle") {
        interrupt();
        streamingContentRef.current = "";
        setStreamingContent("");
        setStreamState("idle");
      }
      const currentMessages = messagesRef.current;
      const idx = currentMessages.findIndex((m) => m.id === msgId);
      if (idx === -1) return;

      let lastUserIdx = -1;
      for (let i = idx - 1; i >= 0; i--) {
        if (currentMessages[i].role === "user") { lastUserIdx = i; break; }
      }
      if (lastUserIdx === -1) return;
      const truncated = currentMessages.slice(0, lastUserIdx + 1);
      setMessages(truncated);
      startStream(truncated);
    },
    [streamState, interrupt, startStream]
  );

  // ── continue generation ──

  const continueGeneration = useCallback(
    (msgId: string) => {
      const currentMessages = messagesRef.current;
      const msg = currentMessages.find((m) => m.id === msgId);
      if (!msg || msg.role !== "assistant") return;

      if (streamState !== "idle") {
        interrupt();
        streamingContentRef.current = "";
        setStreamingContent("");
        setStreamState("idle");
      }

      updateMessage(msgId, { status: "streaming", content: msg.content });
      setStreamingContent(msg.content);
      streamingContentRef.current = msg.content;
      startStream(currentMessages, msgId);
    },
    [streamState, interrupt, startStream, updateMessage]
  );

  // ── edit ──

  const startEdit = useCallback((msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (msg?.role === "user") {
      setInput(msg.content);
      setEditingId(msgId);
    }
  }, [messages]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setInput("");
  }, []);

  const saveEdit = useCallback(
    (newText: string) => {
      if (!editingId) return;
      executeSend(newText);
    },
    [editingId, executeSend]
  );

  // ── delete ──

  const deleteMsg = useCallback((msgId: string) => {
    if (streamState !== "idle") {
      interrupt();
      streamingContentRef.current = "";
      setStreamingContent("");
      setStreamState("idle");
    }
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === msgId);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, [streamState, interrupt]);

  // ── copy ──

  const copyMessage = useCallback(async (msgId: string) => {
    const msg = messagesRef.current.find((m) => m.id === msgId);
    if (!msg) return;
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId((prev) => (prev === msgId ? null : prev)), 2000);
    } catch { /* clipboard unavailable */ }
  }, []);

  const isGenerating = streamState !== "idle";

  return {
    messages,
    input,
    setInput,
    editingId,
    streamingContent,
    streamState,
    error,
    copiedId,
    isGenerating,
    send,
    sendQuestion,
    stop,
    retry,
    regenerate,
    continueGeneration,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteMsg,
    copyMessage,
  };
}
