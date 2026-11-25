"use client";

import React, { useEffect, useState } from "react";
import {
  BookMarked,
  ExternalLink,
  FileSpreadsheet,
  Headphones,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { apiFetch, PaperItem, UserBundle } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  papers: PaperItem[];
  user: UserBundle | null;
  onClose: () => void;
  onRemovePaper: (key: string) => void;
  onClearAll: () => void;
  onAddPapers: (items: PaperItem[]) => void;
  onOpenInspector: (paper: PaperItem) => void;
  onCompareMatrix: () => void;
  onOpenAudio: () => void;
  onRequireAuth: () => void;
}

const STARTER_PROMPTS = [
  "Compare buffer pH, salt, and temperature conditions across these papers.",
  "Summarize all quantitative Kd, IC50, and cryo-EM/X-ray resolution metrics.",
  "Which mutants or constructs performed best, and what are the main caveats?",
];

export default function NotebookChatModal({
  open,
  papers,
  user,
  onClose,
  onRemovePaper,
  onClearAll,
  onAddPapers,
  onOpenInspector,
  onCompareMatrix,
  onOpenAudio,
  onRequireAuth,
}: Props) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);

  // Zotero Import state
  const [zotDest, setZotDest] = useState("personal");
  const [importingZot, setImportingZot] = useState(false);
  const [zotNotice, setZotNotice] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleAsk = async (qOverride?: string) => {
    const q = (qOverride ?? question).trim();
    if (!q || asking || papers.length === 0) return;
    if (!qOverride) setQuestion("");
    const nextHistory = [...messages, { role: "user" as const, content: q }];
    setMessages(nextHistory);
    setAsking(true);
    try {
      const res = await apiFetch("/api/methods/ask-papers", {
        method: "POST",
        body: JSON.stringify({
          papers: papers.slice(0, 12),
          question: q,
          history: messages.slice(-6),
        }),
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer || "No answer returned." },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message || "Could not query papers."}` },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleImportZotero = async () => {
    if (!user) return onRequireAuth();
    setImportingZot(true);
    setZotNotice("");
    try {
      const res = await apiFetch(
        `/api/zotero/library-items?destination=${encodeURIComponent(zotDest)}&limit=10`
      );
      const imported: PaperItem[] = res.items || [];
      if (imported.length === 0) {
        setZotNotice("No top-level items found in that Zotero library.");
      } else {
        onAddPapers(imported);
        setZotNotice(`Added ${imported.length} items from ${res.library}.`);
      }
    } catch (err: any) {
      setZotNotice(err.message || "Zotero import failed.");
    } finally {
      setImportingZot(false);
    }
  };

  // Render assistant text with clickable [1], [2] citation pills
  const renderWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const m = part.match(/^\[(\d+)\]$/);
      if (m) {
        const num = Number(m[1]);
        const targetPaper = papers[num - 1];
        if (targetPaper) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setHighlightedIdx(num);
                onOpenInspector(targetPaper);
              }}
              title={targetPaper.title}
              className="mx-0.5 px-1.5 py-0.5 rounded-md bg-[#E8F0FE] dark:bg-[#0842A0]/60 text-[#1967D2] dark:text-[#A8C7FA] font-mono text-[11px] font-semibold hover:bg-[#D2E3FC] transition inline-flex items-center"
            >
              [{num}]
            </button>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] rounded-3xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden"
      >
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-[#E3E8EF] dark:border-[#333537] flex items-center justify-between gap-3 bg-[#F8FAFD] dark:bg-[#18191A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8F0FE] dark:bg-[#0842A0]/50 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base text-[#1F1F1F] dark:text-[#E3E3E3]">
                Notebook Sources &amp; Grounded AI Chat ({papers.length})
              </h2>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Persistent workspace across searches, Feed &amp; Zotero — answers cite exact sources [1], [2].
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Notebook"
            className="p-2 rounded-full hover:bg-[#E3E8EF] dark:hover:bg-[#333537] text-[#5F6368] dark:text-[#9AA0A6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Pane Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">
          {/* Left Pane: Persistent Notebook Sources + Zotero Import */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#E3E8EF] dark:border-[#333537] flex flex-col min-h-0 bg-[#F8FAFD]/60 dark:bg-[#18191A]/60">
            <div className="p-4 border-b border-[#E3E8EF] dark:border-[#333537] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                  Sources ({papers.length}/12 active)
                </span>
                {papers.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="text-xs text-[#D93025] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Import from Zotero */}
              <div className="flex items-center gap-1.5">
                <select
                  value={zotDest}
                  onChange={(e) => setZotDest(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                >
                  <option value="personal">Personal Zotero</option>
                  <option value="Recently added (Lab)">Lab: Recently added</option>
                  <option value="Evolution (6064631)">Lab: Evolution</option>
                  <option value="Chemistry (6059722)">Lab: Chemistry</option>
                </select>
                <button
                  type="button"
                  onClick={handleImportZotero}
                  disabled={importingZot}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#E8F0FE] dark:bg-[#0842A0]/50 text-[#1967D2] dark:text-[#A8C7FA] hover:opacity-90 inline-flex items-center gap-1 shrink-0"
                >
                  {importingZot ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BookMarked className="w-3.5 h-3.5" />
                  )}
                  Import Zotero
                </button>
              </div>
              {zotNotice && (
                <div className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">{zotNotice}</div>
              )}

              {papers.length >= 2 && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onCompareMatrix}
                    className="flex-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] hover:bg-[#E8F0FE] inline-flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#188038]" /> Compare Matrix
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAudio}
                    className="flex-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] hover:bg-[#E8F0FE] inline-flex items-center justify-center gap-1.5"
                  >
                    <Headphones className="w-3.5 h-3.5 text-[#1A73E8]" /> Audio Overview
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {papers.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5F6368]">
                  Tick checkboxes on Search results, pin from Feed, or click Import Zotero above to build your Notebook.
                </div>
              ) : (
                papers.map((p, i) => {
                  const key = p.url || p.title || String(i);
                  const isHi = highlightedIdx === i + 1;
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-2xl border transition space-y-1 ${
                        isHi
                          ? "bg-[#E8F0FE]/70 dark:bg-[#0842A0]/30 border-[#1A73E8]"
                          : "bg-white dark:bg-[#1E1F20] border-[#E3E8EF] dark:border-[#333537]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenInspector(p)}
                          className="text-left text-xs font-semibold hover:text-[#1A73E8] line-clamp-2"
                        >
                          <span className="font-mono text-[#1A73E8] mr-1.5">[{i + 1}]</span>
                          {p.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemovePaper(key)}
                          aria-label="Remove source"
                          className="text-[#747775] hover:text-[#D93025] shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
                        <span className="truncate">
                          {p.source} {p.year || p.date ? `· ${p.year || p.date}` : ""}
                        </span>
                        {p.url && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-[#1A73E8] shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Grounded AI Chat */}
          <div className="lg:col-span-7 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-6">
                  <div className="w-12 h-12 rounded-full bg-[#E8F0FE] dark:bg-[#0842A0]/40 text-[#1A73E8] flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="font-display font-semibold text-sm">
                      Ask anything across your {papers.length} Notebook sources
                    </h3>
                    <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                      Every answer is strictly grounded in your pinned abstracts/papers with clickable [1], [2] citations.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {STARTER_PROMPTS.map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        disabled={papers.length === 0}
                        onClick={() => handleAsk(sp)}
                        className="px-3.5 py-2 rounded-2xl text-xs bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] dark:hover:bg-[#333537] text-left transition disabled:opacity-50"
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-[#1A73E8] text-white"
                          : "bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] text-[#1F1F1F] dark:text-[#E3E3E3]"
                      }`}
                    >
                      {m.role === "assistant" ? renderWithCitations(m.content) : m.content}
                    </div>
                  </div>
                ))
              )}

              {asking && (
                <div className="flex items-center gap-2 text-xs text-[#5F6368]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
                  Synthesizing grounded answer with citations...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="p-4 border-t border-[#E3E8EF] dark:border-[#333537] flex items-center gap-2 bg-[#F8FAFD] dark:bg-[#18191A]"
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  papers.length === 0
                    ? "Select at least 1 paper first..."
                    : "Ask about Kd, buffers, mutations, or protocol differences..."
                }
                disabled={papers.length === 0 || asking}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
              />
              <button
                type="submit"
                disabled={papers.length === 0 || asking || !question.trim()}
                aria-label="Ask selected papers"
                className="px-4 py-2.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Ask
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
