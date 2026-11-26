"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  BookMarked,
  ExternalLink,
  Loader2,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { apiFetch, PaperItem } from "@/lib/api";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  papers?: PaperItem[];
  searchQueries?: { pubmed?: string; semantic?: string };
}

interface Props {
  hasSelectionBar?: boolean;
  onOpenInspector?: (paper: PaperItem) => void;
  onSaveZotero?: (paper: PaperItem) => void;
}

const STARTER_QUESTIONS = [
  "Is there any evidence that lipocalin-2 (LCN2) disaggregates or inhibits amyloid fibrils?",
  "Does ApoD inhibit Aβ42 primary or secondary nucleation?",
  "Cryo-EM structures of TGFBIp or corneal dystrophy amyloid fibrils",
];

function renderFormattedText(text: string, papers?: PaperItem[]) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={li} className="h-1.5" />;
    const isBullet = /^[-•*]\s+/.test(trimmed);
    const cleanLine = isBullet ? trimmed.replace(/^[-•*]\s+/, "") : line;
    const parts = cleanLine.split(/(\*\*[^*]+\*\*|\[\d+\])/g);
    const nodes = parts.map((part, pi) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pi} className="font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const mCite = part.match(/^\[(\d+)\]$/);
      if (mCite && papers) {
        const idx = parseInt(mCite[1], 10) - 1;
        const target = papers[idx];
        if (target?.url) {
          return (
            <a
              key={pi}
              href={target.url}
              target="_blank"
              rel="noreferrer"
              title={target.title}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-[10px] font-semibold bg-[#E8F0FE] dark:bg-[#0842A0]/60 text-[#1A73E8] dark:text-[#A8C7FA] hover:underline"
            >
              [{mCite[1]}]
            </a>
          );
        }
      }
      return <React.Fragment key={pi}>{part}</React.Fragment>;
    });

    if (isBullet) {
      return (
        <div key={li} className="flex items-start gap-2 pl-1">
          <span className="text-[#1A73E8] mt-1 text-[10px]">●</span>
          <span className="flex-1">{nodes}</span>
        </div>
      );
    }
    return <p key={li}>{nodes}</p>;
  });
}

export default function CatResearchAssistant({
  hasSelectionBar = false,
  onOpenInspector,
  onSaveZotero,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const avatarSrc = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/cat-assistant.jpg`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sendQuestion = async (rawQ?: string) => {
    const q = (rawQ ?? input).trim();
    if (!q || loading) return;
    setInput("");

    const nextHistory = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await apiFetch("/api/methods/ask-literature", {
        method: "POST",
        body: JSON.stringify({
          question: q,
          history: nextHistory.slice(-4),
        }),
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer || "No answer returned.",
          papers: res.papers || [],
          searchQueries: res.search_queries || {},
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Search error: ${err?.message || "Could not reach literature engine."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Circular Badass Cat Avatar Launcher */}
      {!open && (
        <div
          className={`fixed right-5 z-40 flex items-center gap-2.5 transition-all duration-300 ${
            hasSelectionBar ? "bottom-20" : "bottom-5"
          }`}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open Lab Cat Research Assistant"
            className="group relative flex items-center gap-2.5 pl-3.5 pr-1.5 py-1.5 rounded-full bg-[#0F172A]/90 dark:bg-[#1E1F20]/95 backdrop-blur-md text-white shadow-[0_10px_35px_rgba(26,115,232,0.42)] border border-[#38BDF8]/35 hover:border-[#38BDF8]/80 hover:scale-[1.03] transition-all"
          >
            <span className="hidden sm:inline text-xs font-medium tracking-tight text-[#E2E8F0] group-hover:text-white">
              Ask Lab Cat
            </span>
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#38BDF8]/80 shadow-inner shrink-0">
              <img
                src={avatarSrc}
                alt="BenchQuest Lab Cat"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#22D3EE] ring-2 ring-[#0F172A] animate-pulse"
              title="Live Literature Search Ready"
            />
          </button>
        </div>
      )}

      {/* Floating Evidence Search Chat Drawer */}
      {open && (
        <div
          className={`fixed right-4 sm:right-5 z-50 w-[min(94vw,470px)] h-[min(82vh,650px)] rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#DCE3EE] dark:border-[#333537] shadow-[0_24px_70px_rgba(15,23,42,0.32)] flex flex-col overflow-hidden ${
            hasSelectionBar ? "bottom-20" : "bottom-5"
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#0B1120] via-[#102447] to-[#0F172A] text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#38BDF8]/80 shrink-0 shadow-md">
                <img
                  src={avatarSrc}
                  alt="BenchQuest Lab Cat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-semibold text-sm truncate">
                    Lab Cat · Evidence Scout
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                </div>
                <p className="text-[11px] text-[#94A3B8] truncate">
                  Live search across PubMed, OpenAlex & bioRxiv
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  title="Clear chat"
                  className="p-1.5 rounded-full hover:bg-white/10 text-[#CBD5E1] hover:text-white transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close (Esc)"
                className="p-1.5 rounded-full hover:bg-white/10 text-[#CBD5E1] hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFD] dark:bg-[#131314]"
          >
            {messages.length === 0 && (
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] text-xs text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                  Ask any hypothesis or mechanistic question. I will search PubMed, OpenAlex & bioRxiv live and answer strictly from retrieved abstracts with citations <span className="font-semibold text-[#1A73E8]">[1][2]</span>.
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6368] px-1">
                    Try asking
                  </div>
                  {STARTER_QUESTIONS.map((sq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendQuestion(sq)}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E1F20] hover:bg-[#E8F0FE]/60 dark:hover:bg-[#0842A0]/25 border border-[#E3E8EF] dark:border-[#333537] text-xs text-[#1F1F1F] dark:text-[#E3E3E3] transition flex items-start gap-2"
                    >
                      <Search className="w-3.5 h-3.5 text-[#1A73E8] mt-0.5 shrink-0" />
                      <span>{sq}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed space-y-1.5 ${
                    m.role === "user"
                      ? "bg-[#1A73E8] text-white rounded-br-md"
                      : "bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] text-[#1F1F1F] dark:text-[#E3E3E3] rounded-bl-md shadow-sm"
                  }`}
                >
                  {m.role === "user" ? m.content : renderFormattedText(m.content, m.papers)}
                </div>

                {m.role === "assistant" && m.searchQueries?.pubmed && (
                  <div className="mt-1.5 px-2 text-[10px] text-[#5F6368] dark:text-[#9AA0A6] truncate max-w-[92%]">
                    Query: <code className="font-mono">{m.searchQueries.pubmed}</code>
                  </div>
                )}

                {m.role === "assistant" && m.papers && m.papers.length > 0 && (
                  <div className="mt-2 w-full space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5F6368] px-1">
                      Retrieved Papers ({m.papers.length})
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {m.papers.map((p, pi) => (
                        <div
                          key={pi}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] line-clamp-2">
                              <span className="text-[#1A73E8] font-semibold mr-1">[{pi + 1}]</span>
                              {p.title}
                            </div>
                            <div className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] truncate mt-0.5">
                              {p.year || p.date || "n.d."} · {p.source}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {p.url && (
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Open paper"
                                className="p-1.5 rounded-lg hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-[#5F6368]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {onOpenInspector && (
                              <button
                                type="button"
                                onClick={() => onOpenInspector(p)}
                                className="px-2 py-1 rounded-lg bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] text-[10px] font-medium text-[#1A73E8]"
                              >
                                Inspect
                              </button>
                            )}
                            {onSaveZotero && (
                              <button
                                type="button"
                                onClick={() => onSaveZotero(p)}
                                title="Save to Zotero"
                                className="p-1.5 rounded-lg hover:bg-[#E8F0FE] text-[#1A73E8]"
                              >
                                <BookMarked className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] text-xs text-[#5F6368]">
                <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
                <span>Lab Cat is searching PubMed, OpenAlex & bioRxiv...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendQuestion();
            }}
            className="p-3 bg-white dark:bg-[#1E1F20] border-t border-[#E3E8EF] dark:border-[#333537] flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any protein, fibril, mechanism..."
              className="flex-1 px-3.5 py-2 rounded-full text-xs sm:text-sm bg-[#F0F4F9] dark:bg-[#282A2C] border border-transparent focus:border-[#1A73E8] outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
