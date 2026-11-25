"use client";

import React from "react";
import {
  AlertTriangle,
  BookmarkCheck,
  BookmarkPlus,
  Box,
  Check,
  ExternalLink,
  FileText,
  Flame,
  GitFork,
  GraduationCap,
  Repeat2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { PaperItem } from "@/lib/api";
import HelpTip from "@/components/HelpTip";

interface Props {
  paper: PaperItem;
  selected: boolean;
  saved?: boolean;
  onToggleSelect: () => void;
  onSaveZotero: () => void;
  onRepostFeed?: () => void;
  onOpenInspector: (tab: "overview" | "graph" | "structure") => void;
}

function cleanLatexText(str?: string): string {
  if (!str) return "";
  return str
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\kappa/g, "κ")
    .replace(/\$([^$]{1,12})\$/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function getTagStyle(tag: string): string {
  const low = tag.toLowerCase();
  if (low.startsWith("art-"))
    return "bg-[#E8F0FE] text-[#1967D2] dark:bg-[#0842A0]/45 dark:text-[#A8C7FA]";
  if (low.startsWith("ata-"))
    return "bg-[#E6F4EA] text-[#137333] dark:bg-[#0D5226]/45 dark:text-[#81C995]";
  if (low.startsWith("ame-"))
    return "bg-[#F3E8FD] text-[#7C3AED] dark:bg-[#4A148C]/45 dark:text-[#D7AEFB]";
  if (low.startsWith("ai score"))
    return "bg-[#FEF7E0] text-[#B06000] dark:bg-[#4E3800]/50 dark:text-[#FDD663]";
  return "bg-[#F0F4F9] text-[#444746] dark:bg-[#282A2C] dark:text-[#C4C7C5]";
}

export default function PaperCard({
  paper,
  selected,
  saved,
  onToggleSelect,
  onSaveZotero,
  onRepostFeed,
  onOpenInspector,
}: Props) {
  const score = Math.max(1, Math.min(3, Number(paper.score3 || 2)));

  return (
    <article
      className={`group rounded-3xl bg-white dark:bg-[#1E1F20] border transition-all duration-150 p-5 sm:p-6 ${
        selected
          ? "border-[#1A73E8] ring-2 ring-[#1A73E8]/15 shadow-omnibox-focus"
          : "border-[#E3E8EF] dark:border-[#333537] shadow-card hover:border-[#AECBFA] dark:hover:border-[#5F6368]"
      }`}
    >
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Selection Checkbox */}
          <button
            type="button"
            onClick={onToggleSelect}
            title="Select card for AI Comparison Matrix or Batch Zotero save"
            aria-label="Select paper for comparison or batch action"
            className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
              selected
                ? "bg-[#1A73E8] border-[#1A73E8] text-white"
                : "border-[#C4C7C5] dark:border-[#5F6368] hover:border-[#1A73E8]"
            }`}
          >
            {selected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </button>

          {/* Score Pill + ? Tooltip */}
          <span
            className={`px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1.5 ${
              score === 3
                ? "bg-[#E8F0FE] text-[#1967D2] dark:bg-[#0842A0]/55 dark:text-[#A8C7FA]"
                : score === 2
                ? "bg-[#F0F4F9] text-[#1F1F1F] dark:bg-[#282A2C] dark:text-[#E3E3E3]"
                : "bg-[#F8FAFD] text-[#5F6368] dark:bg-[#222426] dark:text-[#9AA0A6]"
            }`}
          >
            <span className="text-[#F9AB00]">{"★".repeat(score)}</span>
            <span>{score === 3 ? "Breakthrough 3/3" : score === 2 ? "Context 2/3" : "Radar 1/3"}</span>
            <HelpTip
              align="left"
              title="BenchQuest 3-Point Relevance Score"
              description="Evaluates direct fit to lab research, methodology rigor, journal prestige, and senior author visibility:"
              bullets={[
                "★★★ 3/3 (Breakthrough): Direct target/method match, novel 3D structure or VIP lab.",
                "★★ 2/3 (Context): Strong methodological or adjacent chaperone/target overlap.",
                "★ 1/3 (Radar): Peripheral background context.",
              ]}
            />
          </span>

          {/* Domain / Source */}
          {paper.source && (
            <span className="text-[#5F6368] dark:text-[#9AA0A6] font-medium">
              {paper.source}
            </span>
          )}
          {(paper.year || paper.date) && (
            <span className="text-[#747775] dark:text-[#8E918F]">
              · {String(paper.year || paper.date).slice(0, 10)}
            </span>
          )}
          {paper.citation_count !== undefined && paper.citation_count > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]">
              Cited by {paper.citation_count}
            </span>
          )}

          {/* VIP Lab Alert */}
          {paper.vip_labs && paper.vip_labs.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#FCE8E6] text-[#D93025] font-semibold inline-flex items-center gap-1">
              <Flame className="w-3 h-3" /> VIP: {paper.vip_labs.join(", ")}
            </span>
          )}

          {/* Preprint Revision */}
          {paper.revision && (
            <span className="px-2 py-0.5 rounded-full bg-[#FEF7E0] text-[#B06000] font-mono font-medium">
              Updated {paper.revision}
            </span>
          )}

          {/* Retraction Warning */}
          {paper.has_retraction && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#D93025] text-white font-semibold inline-flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> RETRACTED
            </span>
          )}
        </div>
      </div>

      {/* Title & Authors */}
      <div className="mt-2.5">
        <h3 className="font-display font-semibold text-base sm:text-[17px] leading-snug text-[#1F1F1F] dark:text-[#E3E3E3]">
          {paper.url ? (
            <a
              href={paper.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1A73E8] dark:hover:text-[#A8C7FA] transition-colors"
            >
              {cleanLatexText(paper.title)}
            </a>
          ) : (
            cleanLatexText(paper.title)
          )}
        </h3>
        {paper.authors && (
          <p className="text-xs sm:text-[13px] text-[#188038] dark:text-[#81C995] mt-1 truncate">
            {paper.authors}
          </p>
        )}
      </div>

      {/* Core Finding */}
      {(paper.summary || paper.abstract || paper.snippet) && (
        <p className="mt-2.5 text-sm text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
          {cleanLatexText(paper.summary || paper.abstract || paper.snippet)}
        </p>
      )}

      {/* Methodological Caveat Strip */}
      {paper.caveat && (
        <div className="mt-3 px-3.5 py-2 rounded-2xl bg-[#FEF7E0]/80 dark:bg-[#3B2E08]/40 border border-[#FDE293]/80 dark:border-[#7A5B00]/60 text-xs text-[#8F4E00] dark:text-[#FDD663] flex items-start justify-between gap-2">
          <span className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#F9AB00]" />
            <span>
              <strong className="font-semibold">Bench Caveat:</strong> {paper.caveat}
            </span>
          </span>
          <HelpTip
            align="right"
            title="Methodological Caveat Check"
            description="Highlights potential experimental nuances to check before replicating at the bench (e.g. non-physiological pH/salt, unreviewed preprint status, resolution >3.2 Å, or missing monomer controls)."
          />
        </div>
      )}

      {/* Controlled Vocabulary Tags */}
      {paper.tags && paper.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {paper.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ${getTagStyle(
                tag
              )}`}
            >
              {tag}
            </span>
          ))}
          <HelpTip
            align="left"
            title="Harmonized Lab Zotero Tags"
            description="Tags are automatically standardized to your shared Zotero library format:"
            bullets={[
              "aRT- : Research Topic (e.g. aRT-Amyloids)",
              "aTa- : Target / Molecule (e.g. aTa-L-PGDS, aTa-ApoD)",
              "aMe- : Experimental / ML Method (e.g. aMe-Cryo-EM, aMe-NMR)",
              "aTy- : Publication Type (e.g. aTy-Preprint, aTy-Protocol)",
            ]}
          />
        </div>
      )}

      {/* Action Pills Bar */}
      <div className="mt-4 pt-3 border-t border-[#F0F4F9] dark:border-[#2C2E30] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onSaveZotero}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
              saved
                ? "bg-[#E6F4EA] text-[#137333] dark:bg-[#0D5226]/50 dark:text-[#81C995]"
                : "bg-[#E8F0FE] hover:bg-[#D3E3FD] text-[#1967D2] dark:bg-[#0842A0]/50 dark:text-[#A8C7FA]"
            }`}
          >
            {saved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" /> In Zotero
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5" /> Save to Zotero
              </>
            )}
            <HelpTip
              align="left"
              title="1-Click Zotero Cloud Export"
              description="Checks DOI + Title for duplicates, harmonizes tags, attaches an AI Assessment child note, Open Access PDF, and NTU OpenAthens link to your selected Personal or Lab Group Zotero library."
            />
          </button>

          <button
            onClick={() => onOpenInspector("graph")}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E3E8EF] dark:hover:bg-[#333537] text-[#444746] dark:text-[#C4C7C5] inline-flex items-center gap-1.5 transition"
          >
            <GitFork className="w-3.5 h-3.5 text-[#7C3AED]" /> Citation Graph
            <HelpTip
              title="Connected-Papers Citation Network"
              description="Opens an interactive visual map of foundational references (left) and newer citing papers (right) so you can snowball related literature."
            />
          </button>

          {(paper.structure_id || paper.domain === "plasmids") && (
            <button
              onClick={() => onOpenInspector("structure")}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E3E8EF] dark:hover:bg-[#333537] text-[#444746] dark:text-[#C4C7C5] inline-flex items-center gap-1.5 transition"
            >
              <Box className="w-3.5 h-3.5 text-[#1A73E8]" /> 3D View{" "}
              {paper.structure_id ? `(${paper.structure_id})` : ""}
            </button>
          )}

          <button
            onClick={() => onOpenInspector("overview")}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E3E8EF] dark:hover:bg-[#333537] text-[#444746] dark:text-[#C4C7C5] inline-flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" /> Details
          </button>

          {onRepostFeed && (
            <button
              type="button"
              onClick={onRepostFeed}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E6F4EA] hover:text-[#137333] text-[#444746] dark:text-[#C4C7C5] inline-flex items-center gap-1.5 transition"
              title="Share / Repost to Lab Feed"
            >
              <Repeat2 className="w-3.5 h-3.5" /> Repost
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {paper.pdf_url && (
            <a
              href={paper.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333] dark:bg-[#0D5226]/40 dark:text-[#81C995] hover:opacity-90 inline-flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> OA PDF
            </a>
          )}
          {paper.ntu_openathens_url && (
            <a
              href={paper.ntu_openathens_url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F8FAFD] dark:bg-[#222426] border border-[#E3E8EF] dark:border-[#333537] hover:bg-[#F0F4F9] inline-flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#1A73E8]" /> NTU Access
              <HelpTip
                align="right"
                title="NTU OpenAthens Institutional Proxy"
                description="Opens paywalled publisher articles directly via official NTU Singapore library authentication (replaces legacy RemoteXs)."
              />
            </a>
          )}
          {paper.pubpeer_url && (
            <a
              href={paper.pubpeer_url}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-full text-xs text-[#5F6368] hover:text-[#1F1F1F] dark:text-[#9AA0A6] inline-flex items-center gap-1"
            >
              PubPeer <ExternalLink className="w-3 h-3" />
              <HelpTip
                align="right"
                title="PubPeer & Retraction Audit"
                description="Checks post-publication peer review comments, Western blot/Cryo-EM image concerns, and Europe PMC retraction notices."
              />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
