"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  BookmarkPlus,
  ExternalLink,
  FileText,
  FlaskConical,
  GraduationCap,
  Loader2,
  Plus,
  Radar,
  Scale,
  X,
} from "lucide-react";
import { apiFetch, PaperItem, UserBundle } from "@/lib/api";

interface Props {
  user: UserBundle | null;
  onUserUpdated: (u: UserBundle) => void;
  onSaveZotero: (p: PaperItem) => void;
}

const DEFAULT_PI_PRESETS = ["Nakatsuji M", "Inui T", "Eisenberg D", "Radford SE", "Kelly JW"];

export default function PiRadarPanel({ user, onUserUpdated, onSaveZotero }: Props) {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_PI_PRESETS);
  const [newPi, setNewPi] = useState("");
  const [activePi, setActivePi] = useState("Nakatsuji M");
  const [loading, setLoading] = useState(false);
  const [radar, setRadar] = useState<any | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = user?.preferences?.tracked_pis?.trim();
    if (raw) {
      const parsed = raw
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        setWatchlist(parsed);
        if (!parsed.includes(activePi)) {
          fetchRadar(parsed[0]);
        }
      }
    }
  }, [user?.preferences?.tracked_pis]);

  const fetchRadar = async (authorName: string) => {
    const q = authorName.trim();
    if (!q) return;
    setActivePi(q);
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/methods/pi-radar?author=${encodeURIComponent(q)}`);
      setRadar(res);
    } catch (err: any) {
      setError(err.message || "Failed to load PI Radar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar(activePi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistWatchlist = async (next: string[]) => {
    setWatchlist(next);
    if (!user) return;
    try {
      const res = await apiFetch("/api/preferences", {
        method: "PUT",
        body: JSON.stringify({ tracked_pis: next.join(", ") }),
      });
      if (res.user) onUserUpdated(res.user);
    } catch {
      // ignore offline
    }
  };

  const handleAddPi = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPi.trim();
    if (!trimmed) return;
    const next = watchlist.includes(trimmed) ? watchlist : [...watchlist, trimmed];
    setNewPi("");
    await persistWatchlist(next);
    fetchRadar(trimmed);
  };

  const handleRemovePi = async (name: string) => {
    const next = watchlist.filter((x) => x !== name);
    await persistWatchlist(next);
  };

  const timeline: Array<{ year: number; works_count: number; cited_by_count: number }> =
    radar?.timeline || [];
  const maxWorks = Math.max(1, ...timeline.map((t) => t.works_count || 0));

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#FCE8E6] text-[#C5221F] flex items-center justify-center">
            <Radar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base">
              PI &amp; Competitor Radar (Author / Lab Tracker)
            </h3>
            <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
              Subscribe to PIs or labs — inspect publication activity by year, latest papers, preprints &amp; patent disclosures.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddPi} className="flex items-center gap-2">
          <input
            value={newPi}
            onChange={(e) => setNewPi(e.target.value)}
            placeholder="Add PI or lab (e.g. Inui T)..."
            className="px-3.5 py-1.5 text-xs rounded-full bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Track
          </button>
        </form>
      </div>

      {/* Watchlist Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {watchlist.map((pi) => {
          const isActive = activePi === pi;
          return (
            <div
              key={pi}
              className={`inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-medium border transition ${
                isActive
                  ? "bg-[#E8F0FE] text-[#1967D2] border-[#1A73E8]"
                  : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] border-transparent hover:border-[#DADCE0]"
              }`}
            >
              <button type="button" onClick={() => fetchRadar(pi)}>
                {pi}
              </button>
              <button
                type="button"
                onClick={() => handleRemovePi(pi)}
                className="opacity-60 hover:opacity-100"
                title="Remove from watchlist"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-xs text-[#5F6368]">
          <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
          Scanning OpenAlex &amp; patent feeds for {activePi}...
        </div>
      ) : error ? (
        <div className="p-3 rounded-2xl bg-[#FCE8E6] dark:bg-[#3B1816] text-[#C5221F] dark:text-[#F28B82] text-xs">{error}</div>
      ) : radar ? (
        <div className="space-y-5">
          {/* Profile Summary + Publication Activity Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] space-y-2">
              <div className="font-display font-semibold text-sm">{radar.profile?.display_name}</div>
              {radar.profile?.institution && (
                <div className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                  {radar.profile.institution}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-[#1E1F20]">
                  <div className="text-sm font-semibold text-[#1A73E8]">
                    {radar.profile?.works_count ?? 0}
                  </div>
                  <div className="text-[10px] text-[#5F6368]">Works</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#1E1F20]">
                  <div className="text-sm font-semibold text-[#188038]">
                    {radar.profile?.h_index ?? 0}
                  </div>
                  <div className="text-[10px] text-[#5F6368]">h-index</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#1E1F20]">
                  <div className="text-sm font-semibold text-[#B06000]">
                    {radar.profile?.cited_by_count ?? 0}
                  </div>
                  <div className="text-[10px] text-[#5F6368]">Citations</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#1A73E8]" />
                  Publication Activity by Year
                </span>
                <span className="text-[11px] font-normal text-[#5F6368]">
                  Papers / year (OpenAlex)
                </span>
              </div>
              {timeline.length === 0 ? (
                <div className="text-xs text-[#5F6368] py-6 text-center">
                  No yearly timeline data available.
                </div>
              ) : (
                <div className="flex items-end gap-2 h-28 pt-4">
                  {timeline.map((t) => {
                    const hPct = Math.max(8, Math.round((t.works_count / maxWorks) * 100));
                    return (
                      <div key={t.year} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                          {t.works_count}
                        </span>
                        <div
                          className="w-full max-w-[26px] rounded-t-lg bg-[#1A73E8]/85 hover:bg-[#1A73E8] transition-all"
                          style={{ height: `${hPct}%` }}
                          title={`${t.year}: ${t.works_count} works, ${t.cited_by_count} citations`}
                        />
                        <span className="text-[10px] text-[#5F6368]">{t.year}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3-Column Feed: Recent Papers, Fresh Preprints, Patents */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Papers */}
            <div className="space-y-2">
              <div className="text-xs font-semibold inline-flex items-center gap-1.5 text-[#1967D2]">
                <FileText className="w-3.5 h-3.5" />
                Latest Papers ({(radar.recent_papers || []).length})
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(radar.recent_papers || []).slice(0, 6).map((p: PaperItem, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] space-y-1"
                  >
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium hover:text-[#1A73E8] line-clamp-2 inline-flex items-start gap-1"
                    >
                      <span>{p.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                    </a>
                    <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
                      <span className="truncate">{p.date} · {p.source}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {(p.doi || p.url) && (
                          <a
                            href={`${user?.preferences?.openathens_proxy || "https://go.openathens.net/redirector/ntu.edu.sg?url="}${encodeURIComponent(
                              p.doi ? `https://doi.org/${p.doi}` : p.url
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#1967D2] hover:underline inline-flex items-center gap-0.5"
                            title="Open via NTU OpenAthens"
                          >
                            <GraduationCap className="w-3 h-3" /> NTU
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onSaveZotero(p)}
                          className="text-[#1A73E8] hover:underline inline-flex items-center gap-0.5"
                        >
                          <BookmarkPlus className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preprints */}
            <div className="space-y-2">
              <div className="text-xs font-semibold inline-flex items-center gap-1.5 text-[#188038]">
                <FlaskConical className="w-3.5 h-3.5" />
                Fresh Preprints ({(radar.recent_preprints || []).length})
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(radar.recent_preprints || []).length === 0 ? (
                  <div className="text-xs text-[#5F6368] p-3 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628]">
                    No recent preprints indexed.
                  </div>
                ) : (
                  (radar.recent_preprints || []).slice(0, 6).map((p: PaperItem, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] space-y-1"
                    >
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium hover:text-[#1A73E8] line-clamp-2 inline-flex items-start gap-1"
                      >
                        <span>{p.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                      </a>
                      <div className="flex items-center justify-between text-[11px] text-[#5F6368]">
                        <span>{p.date} · {p.source}</span>
                        <button
                          type="button"
                          onClick={() => onSaveZotero(p)}
                          className="text-[#188038] hover:underline inline-flex items-center gap-0.5"
                        >
                          <BookmarkPlus className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Patents & Trials */}
            <div className="space-y-2">
              <div className="text-xs font-semibold inline-flex items-center gap-1.5 text-[#B06000]">
                <Scale className="w-3.5 h-3.5" />
                Patents &amp; IP ({(radar.recent_patents || []).length})
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(radar.recent_patents || []).length === 0 ? (
                  <div className="text-xs text-[#5F6368] p-3 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628]">
                    No patent disclosures found for this query.
                  </div>
                ) : (
                  (radar.recent_patents || []).slice(0, 6).map((p: PaperItem, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] space-y-1"
                    >
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium hover:text-[#1A73E8] line-clamp-2 inline-flex items-start gap-1"
                      >
                        <span>{p.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                      </a>
                      <div className="text-[11px] text-[#5F6368]">
                        {p.date} · {p.source}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
