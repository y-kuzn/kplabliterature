"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Sparkles,
  X,
  AlertTriangle,
  FlaskConical,
} from "lucide-react";
import { ComparisonMatrixResult } from "@/lib/api";

interface Props {
  matrix: ComparisonMatrixResult | null;
  onClose: () => void;
}

export default function CompareMatrixModal({ matrix, onClose }: Props) {
  const [copiedMd, setCopiedMd] = useState(false);

  if (!matrix) return null;

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(matrix.markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 1800);
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
        className="bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E3E8EF] dark:border-[#333537] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFD] dark:bg-[#18191A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F0FE] dark:bg-[#0842A0]/50 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base sm:text-lg text-[#1F1F1F] dark:text-[#E3E3E3]">
                AI Comparative Literature Matrix ({matrix.rows.length} Studies)
              </h2>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Side-by-side biophysical parameters, constructs, buffers, and experimental caveats
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadBlob(matrix.csv, "benchquest_comparison.csv", "text/csv;charset=utf-8;")}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] hover:bg-[#F0F4F9] inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#188038]" /> Export CSV
            </button>
            <button
              onClick={copyMarkdown}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] hover:bg-[#F0F4F9] inline-flex items-center gap-1.5"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-[#188038]" /> : <Copy className="w-3.5 h-3.5 text-[#1A73E8]" />}
              {copiedMd ? "Copied Markdown" : "Copy Markdown"}
            </button>
            <button
              onClick={() => downloadBlob(matrix.bibtex, "benchquest_refs.bib", "text/plain;charset=utf-8;")}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1967D2] hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> .bib
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison matrix"
              className="p-2 rounded-full hover:bg-[#E3E8EF] dark:hover:bg-[#333537] text-[#5F6368] dark:text-[#9AA0A6]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Executive Synthesis Banner */}
          {(matrix.consensus_synthesis || matrix.recommended_bench_action) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matrix.consensus_synthesis && (
                <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A73E8] dark:text-[#A8C7FA]">
                    <Sparkles className="w-4 h-4" /> Cross-Study Synthesis & Divergence
                  </div>
                  <p className="text-xs sm:text-sm text-[#1F1F1F] dark:text-[#E3E3E3] leading-relaxed">
                    {matrix.consensus_synthesis}
                  </p>
                </div>
              )}
              {matrix.recommended_bench_action && (
                <div className="p-4 rounded-2xl bg-[#E6F4EA]/70 dark:bg-[#0D5226]/25 border border-[#CEEAD6] dark:border-[#188038]/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#137333] dark:text-[#81C995]">
                    <FlaskConical className="w-4 h-4" /> Recommended Next Bench Action
                  </div>
                  <p className="text-xs sm:text-sm text-[#1F1F1F] dark:text-[#E3E3E3] leading-relaxed">
                    {matrix.recommended_bench_action}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#E3E8EF] dark:border-[#333537]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFD] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] border-b border-[#E3E8EF] dark:border-[#333537]">
                  <th className="py-3 px-4 font-semibold min-w-[160px]">Study</th>
                  <th className="py-3 px-4 font-semibold min-w-[160px]">Target / Construct</th>
                  <th className="py-3 px-4 font-semibold min-w-[140px]">Methods</th>
                  <th className="py-3 px-4 font-semibold min-w-[130px]">Metrics (Å / Kd)</th>
                  <th className="py-3 px-4 font-semibold min-w-[150px]">Conditions / Buffer</th>
                  <th className="py-3 px-4 font-semibold min-w-[240px]">Core Mechanistic Finding</th>
                  <th className="py-3 px-4 font-semibold min-w-[210px]">Methodological Caveat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8EF] dark:divide-[#333537]">
                {matrix.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-[#F8FAFD]/80 dark:hover:bg-[#282A2C]/50 align-top">
                    <td className="py-3.5 px-4 font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1A73E8] dark:text-[#A8C7FA] hover:underline inline-flex items-center gap-1"
                        >
                          {r.paper_label} <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        r.paper_label
                      )}
                      <div className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] line-clamp-2 mt-0.5 font-normal">
                        {r.title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{r.target_construct}</td>
                    <td className="py-3.5 px-4 text-[#444746] dark:text-[#C4C7C5]">{r.methods}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#1967D2] dark:text-[#A8C7FA]">
                      {r.quantitative_metrics}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#444746] dark:text-[#C4C7C5]">{r.conditions}</td>
                    <td className="py-3.5 px-4 leading-relaxed">{r.core_finding}</td>
                    <td className="py-3.5 px-4 text-xs text-[#B06000] dark:text-[#FDD663]">
                      <span className="inline-flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{r.caveat}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
