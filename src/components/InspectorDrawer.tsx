"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  BookmarkPlus,
  Box,
  ExternalLink,
  FileText,
  GitFork,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { PaperItem } from "@/lib/api";
import CitationGraphView from "./CitationGraphView";
import StructureViewer3D from "./StructureViewer3D";

interface Props {
  paper: PaperItem | null;
  initialTab?: "overview" | "graph" | "structure";
  onClose: () => void;
  onSaveZotero: (paper: PaperItem) => void;
}

export default function InspectorDrawer({
  paper,
  initialTab = "overview",
  onClose,
  onSaveZotero,
}: Props) {
  const [tab, setTab] = useState<"overview" | "graph" | "structure">(initialTab);

  React.useEffect(() => {
    setTab(initialTab);
  }, [paper, initialTab]);

  React.useEffect(() => {
    if (!paper) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paper, onClose]);

  if (!paper) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-[#1E1F20] h-full shadow-2xl border-l border-[#E3E8EF] dark:border-[#333537] flex flex-col"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#E3E8EF] dark:border-[#333537] flex items-start justify-between gap-4 bg-[#F8FAFD] dark:bg-[#18191A]">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 rounded-full font-semibold bg-[#E8F0FE] text-[#1967D2] dark:bg-[#0842A0]/50 dark:text-[#A8C7FA]">
                {"★".repeat(Math.max(1, paper.score3 || 2))} Score {paper.score3 || 2}/3
              </span>
              {paper.source && (
                <span className="text-[#5F6368] dark:text-[#9AA0A6] truncate">
                  {paper.source}
                </span>
              )}
              {paper.citation_count !== undefined && paper.citation_count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]">
                  Cited by {paper.citation_count}
                </span>
              )}
            </div>
            <h3 className="font-display font-semibold text-base text-[#1F1F1F] dark:text-[#E3E3E3] leading-snug">
              {paper.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#E3E8EF] dark:hover:bg-[#333537] text-[#5F6368]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 py-2.5 border-b border-[#E3E8EF] dark:border-[#333537] flex items-center gap-2 bg-white dark:bg-[#1E1F20]">
          <button
            onClick={() => setTab("overview")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
              tab === "overview"
                ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD]"
                : "text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Deep Insights & Integrity
          </button>
          <button
            onClick={() => setTab("graph")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
              tab === "graph"
                ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD]"
                : "text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
            }`}
          >
            <GitFork className="w-3.5 h-3.5" /> Citation Network
          </button>
          <button
            onClick={() => setTab("structure")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
              tab === "structure"
                ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD]"
                : "text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
            }`}
          >
            <Box className="w-3.5 h-3.5" /> 3D Structure {paper.structure_id ? `(${paper.structure_id})` : ""}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {tab === "overview" && (
            <>
              {paper.has_retraction ? (
                <div className="p-4 rounded-2xl bg-[#FCE8E6] text-[#C5221F] flex items-start gap-3 text-sm font-medium">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <div>RETRACTED PUBLICATION ALERT</div>
                    <p className="text-xs font-normal mt-0.5">
                      Publisher / Europe PMC records flag a retraction notice on this DOI. Do not rely on these controls without checking PubPeer.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2.5 rounded-2xl bg-[#E6F4EA]/70 dark:bg-[#0D5226]/25 text-[#137333] dark:text-[#81C995] flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4" /> Integrity Verified (No Retraction Notices in Europe PMC)
                  </span>
                  {paper.pubpeer_url && (
                    <a
                      href={paper.pubpeer_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium inline-flex items-center gap-1"
                    >
                      PubPeer Audit <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {paper.authors && (
                <div className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                  <strong className="text-[#1F1F1F] dark:text-[#E3E3E3]">Authors:</strong> {paper.authors}
                </div>
              )}

              {paper.summary && (
                <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] space-y-1.5">
                  <div className="text-xs font-semibold text-[#1A73E8] dark:text-[#A8C7FA]">
                    Core Quantitative Finding
                  </div>
                  <p className="text-sm leading-relaxed">{paper.summary}</p>
                </div>
              )}

              {paper.relevance && (
                <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#222426] border border-[#E3E8EF] dark:border-[#333537] space-y-1">
                  <div className="text-xs font-semibold text-[#188038] dark:text-[#81C995]">
                    Bench Translation & Relevance
                  </div>
                  <p className="text-sm leading-relaxed">{paper.relevance}</p>
                </div>
              )}

              {paper.caveat && (
                <div className="p-4 rounded-2xl bg-[#FEF7E0] dark:bg-[#3B2E08]/50 border border-[#FDE293] dark:border-[#7A5B00] text-[#B06000] dark:text-[#FDD663] space-y-1">
                  <div className="text-xs font-semibold inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Methodological Caveat / Control Nuance
                  </div>
                  <p className="text-sm leading-relaxed">{paper.caveat}</p>
                </div>
              )}

              {(paper.abstract || paper.snippet) && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                    Source Abstract / Excerpt
                  </div>
                  <p className="text-xs sm:text-sm text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                    {paper.abstract || paper.snippet}
                  </p>
                </div>
              )}

              {paper.tags && paper.tags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                    Harmonized Zotero Controlled Vocabulary
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#F0F4F9] dark:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Access Links */}
              <div className="pt-3 border-t border-[#E3E8EF] dark:border-[#333537] flex flex-wrap gap-2">
                <button
                  onClick={() => onSaveZotero(paper)}
                  className="px-4 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5"
                >
                  <BookmarkPlus className="w-4 h-4" /> Save to Zotero
                </button>
                {paper.pdf_url && (
                  <a
                    href={paper.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333] hover:opacity-90 inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" /> {paper.pdf_label || "Open Access PDF"}
                  </a>
                )}
                {paper.ntu_openathens_url && (
                  <a
                    href={paper.ntu_openathens_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E3E8EF] inline-flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-4 h-4 text-[#1A73E8]" /> NTU OpenAthens
                  </a>
                )}
                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E3E8EF] inline-flex items-center gap-1.5"
                  >
                    Publisher Page <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </>
          )}

          {tab === "graph" && (
            <CitationGraphView
              identifier={paper.doi || paper.url || ""}
              title={paper.title}
              onSavePaper={onSaveZotero}
            />
          )}

          {tab === "structure" && (
            <StructureViewer3D initialId={paper.structure_id || "6XYO"} compact />
          )}
        </div>
      </div>
    </div>
  );
}
