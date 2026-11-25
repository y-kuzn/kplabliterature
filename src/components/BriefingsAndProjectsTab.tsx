"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Flame,
  FolderPlus,
  Globe,
  Loader2,
  Newspaper,
  Plus,
  Radio,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { apiFetch, PaperItem, ProjectItem } from "@/lib/api";

interface Props {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onSaveZotero: (paper: PaperItem) => void;
}

const HUB_LABELS: Record<string, string> = {
  preprints: "I. Preprints & OpenAlex",
  structures: "II. 3D Structures (PDB / EMDB / UniProt)",
  patents: "III. Biopharma Patents & IP",
  trials: "IV. Clinical Trials & OpenFDA",
  grants: "V. NIH RePORTER Grants",
  chinese: "VI. Chinese Deep-Tech Frontier",
  code_models: "VII. Code, Models & Zenodo",
  community: "VIII. Lab Whispers (Reddit / HN)",
  conferences: "IX. Conferences, Posters & PhD Theses",
  audits: "X. Retraction Watch & Wet-Lab Protocols",
};

export default function BriefingsAndProjectsTab({
  isAuthenticated,
  onRequireAuth,
  onSaveZotero,
}: Props) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [briefings, setBriefings] = useState<any[]>([]);
  const [enabledHubs, setEnabledHubs] = useState<Record<string, boolean>>({});
  const [streamItems, setStreamItems] = useState<any[]>([]);
  const [vipAlerts, setVipAlerts] = useState<any[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newAuthors, setNewAuthors] = useState("");
  const [newFocus, setNewFocus] = useState("");

  const [genDailyLoading, setGenDailyLoading] = useState(false);
  const [genWeeklyLoading, setGenWeeklyLoading] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [activeBriefing, setActiveBriefing] = useState<any | null>(null);

  const loadAll = async () => {
    try {
      const srcRes = await apiFetch("/api/sources");
      setEnabledHubs(srcRes.enabled_hubs || {});
    } catch {
      // ignore
    }
    try {
      setStreamLoading(true);
      const stRes = await apiFetch("/api/stream?hub=all&page=0");
      setStreamItems(stRes.items || []);
      setVipAlerts(stRes.vip_alerts || []);
    } catch {
      // ignore
    } finally {
      setStreamLoading(false);
    }

    if (!isAuthenticated) return;
    try {
      const [pRes, bRes] = await Promise.all([
        apiFetch("/api/projects"),
        apiFetch("/api/briefings"),
      ]);
      setProjects(pRes.projects || []);
      setBriefings(bRes.briefings || []);
      if (bRes.briefings?.length && !activeBriefing) {
        setActiveBriefing(bRes.briefings[0]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAll();
  }, [isAuthenticated]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return onRequireAuth();
    if (!newName.trim() || !newKeywords.trim()) return;
    const res = await apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: newName,
        keywords: newKeywords,
        target_authors: newAuthors,
        focus: newFocus,
      }),
    });
    setProjects(res.projects || []);
    setNewName("");
    setNewKeywords("");
    setNewAuthors("");
    setNewFocus("");
    setShowAddForm(false);
  };

  const handleDeleteProject = async (id: number) => {
    const res = await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects(res.projects || []);
  };

  const handleToggleHub = async (key: string) => {
    if (!isAuthenticated) return onRequireAuth();
    const res = await apiFetch("/api/sources/toggle", {
      method: "POST",
      body: JSON.stringify({ source_key: key }),
    });
    setEnabledHubs(res.enabled_hubs || {});
  };

  const handleRunDaily = async () => {
    if (!isAuthenticated) return onRequireAuth();
    setGenDailyLoading(true);
    try {
      const created = await apiFetch("/api/briefings/daily", { method: "POST" });
      setBriefings((prev) => [created, ...prev]);
      setActiveBriefing(created);
    } finally {
      setGenDailyLoading(false);
    }
  };

  const handleRunWeekly = async () => {
    if (!isAuthenticated) return onRequireAuth();
    setGenWeeklyLoading(true);
    try {
      const created = await apiFetch("/api/briefings/weekly", { method: "POST" });
      setBriefings((prev) => [created, ...prev]);
      setActiveBriefing(created);
    } finally {
      setGenWeeklyLoading(false);
    }
  };

  const handleRefreshStream = async () => {
    setStreamLoading(true);
    try {
      const stRes = await apiFetch("/api/stream?hub=all&page=0&refresh=true");
      setStreamItems(stRes.items || []);
      setVipAlerts(stRes.vip_alerts || []);
    } finally {
      setStreamLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Active Lab Projects & 100 Sources */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-semibold text-base text-[#1F1F1F] dark:text-[#E3E3E3]">
                Active Research Projects
              </h3>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Synced 24/7 with your Telegram Morning Briefings
              </p>
            </div>
            <button
              onClick={() => (isAuthenticated ? setShowAddForm((s) => !s) : onRequireAuth())}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Project
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreateProject}
              className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#E3E8EF] dark:border-[#3C4043] space-y-3"
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project Title (e.g. Clusterin & ApoD Kinetics)"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746]"
                required
              />
              <input
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                placeholder="Keywords (comma-separated: ApoD, cryo-EM, ThT, amyloid)"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746]"
                required
              />
              <input
                value={newAuthors}
                onChange={(e) => setNewAuthors(e.target.value)}
                placeholder="VIP Labs / Authors (e.g. Eisenberg, Radford, Scheres)"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746]"
              />
              <input
                value={newFocus}
                onChange={(e) => setNewFocus(e.target.value)}
                placeholder="Experimental focus / physiological buffer notes"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-full text-xs text-[#5F6368]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#1A73E8] text-white"
                >
                  Activate Project
                </button>
              </div>
            </form>
          )}

          {!isAuthenticated ? (
            <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] text-xs text-[#444746] dark:text-[#C4C7C5] flex items-center justify-between">
              <span>Sign in to view and sync your active lab research fronts.</span>
              <button
                onClick={onRequireAuth}
                className="px-3 py-1.5 rounded-full bg-[#1A73E8] text-white font-medium"
              >
                Sign in
              </button>
            </div>
          ) : projects.length === 0 ? (
            <p className="text-xs text-[#5F6368]">No active projects yet. Add one above!</p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display font-semibold text-sm text-[#1F1F1F] dark:text-[#E3E3E3]">
                      {p.name}
                    </h4>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="text-[#747775] hover:text-[#D93025] p-1 opacity-70 group-hover:opacity-100"
                      title="Remove project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-[#1967D2] dark:text-[#A8C7FA] mt-1">
                    {p.keywords}
                  </p>
                  {p.target_authors && (
                    <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-1">
                      <strong>VIP Radar:</strong> {p.target_authors}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 10 Strategic Intelligence Hubs (100 Sources) */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#1A73E8]" />
              <h3 className="font-display font-semibold text-sm">
                100 Monitored Sources (10 Strategic Hubs)
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {Object.entries(HUB_LABELS).map(([key, label]) => {
              const on = enabledHubs[key] !== false;
              return (
                <button
                  key={key}
                  onClick={() => handleToggleHub(key)}
                  className="px-3.5 py-2 rounded-2xl text-xs flex items-center justify-between bg-[#F8FAFD] dark:bg-[#242628] hover:bg-[#F0F4F9] transition text-left"
                >
                  <span className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">{label}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                      on
                        ? "bg-[#E6F4EA] text-[#137333] dark:bg-[#0D5226]/50 dark:text-[#81C995]"
                        : "bg-[#F0F4F9] text-[#747775]"
                    }`}
                  >
                    {on ? "ON" : "OFF"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Briefings, Weekly Magazine Dossiers & Live 100-Source Stream */}
      <div className="lg:col-span-7 space-y-6">
        {/* Action Header Card */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-lg text-[#1F1F1F] dark:text-[#E3E3E3]">
                Executive Briefings & Magazine Dossiers
              </h2>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Synthesize multi-project breakthroughs with quantitative metrics, bench translations, and caveats
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRunDaily}
                disabled={genDailyLoading}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {genDailyLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {genDailyLoading ? "Synthesizing Daily..." : "Generate Daily Briefing"}
              </button>
              <button
                onClick={handleRunWeekly}
                disabled={genWeeklyLoading}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#E8F0FE] hover:bg-[#D3E3FD] text-[#1967D2] dark:bg-[#0842A0]/50 dark:text-[#A8C7FA] inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {genWeeklyLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Newspaper className="w-3.5 h-3.5" />
                )}
                {genWeeklyLoading ? "Compiling Dossier..." : "Generate Weekly Dossier"}
              </button>
            </div>
          </div>

          {/* Archive Selector Pills */}
          {briefings.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {briefings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBriefing(b)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    activeBriefing?.id === b.id
                      ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD]"
                      : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]"
                  }`}
                >
                  {b.kind === "weekly" ? "🗞️ " : "⚡ "}
                  {b.title}
                </button>
              ))}
            </div>
          )}

          {/* Rendered Active Briefing / Dossier */}
          {activeBriefing ? (
            <div className="pt-2 space-y-5">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#E3E8EF] dark:border-[#333537] pb-3">
                <h3 className="font-display font-semibold text-base">
                  {activeBriefing.title}
                </h3>
                {activeBriefing.telegraph_url && (
                  <a
                    href={activeBriefing.telegraph_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] text-[#1A73E8] inline-flex items-center gap-1"
                  >
                    Instant View (graph.org) <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Daily Format */}
              {activeBriefing.kind === "daily" &&
                (activeBriefing.payload?.projects || []).map((proj: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="font-display font-semibold text-sm text-[#1A73E8] dark:text-[#A8C7FA]">
                      🧬 {proj.project_name}
                    </h4>
                    {(proj.highlights || []).length === 0 ? (
                      <p className="text-xs text-[#5F6368] italic">
                        No direct Score 2–3 breakthroughs in the past 72h matching strict project criteria.
                      </p>
                    ) : (
                      (proj.highlights || []).map((hl: any, hIdx: number) => (
                        <div
                          key={hIdx}
                          className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={hl.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-sm hover:text-[#1A73E8]"
                            >
                              {hl.title}
                            </a>
                            <button
                              onClick={() => onSaveZotero({ ...hl, project: proj.project_name })}
                              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E8F0FE] text-[#1967D2] shrink-0"
                            >
                              + Zotero
                            </button>
                          </div>
                          <p className="text-xs text-[#444746] dark:text-[#C4C7C5]">{hl.summary}</p>
                          {hl.relevance && (
                            <p className="text-xs text-[#188038] dark:text-[#81C995]">
                              <strong>Bench Insight:</strong> {hl.relevance}
                            </p>
                          )}
                          {hl.caveat && (
                            <p className="text-xs text-[#B06000] dark:text-[#FDD663] flex items-start gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{hl.caveat}</span>
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ))}

              {/* Weekly Magazine Dossier Format */}
              {activeBriefing.kind === "weekly" && (
                <div className="space-y-5">
                  {activeBriefing.payload?.executive_editorial && (
                    <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {activeBriefing.payload.executive_editorial}
                    </div>
                  )}
                  {(activeBriefing.payload?.project_chapters || []).map(
                    (chap: any, cIdx: number) => (
                      <div
                        key={cIdx}
                        className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] space-y-2.5"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#1A73E8]">
                          Chapter {cIdx + 1} · {chap.project_name}
                        </div>
                        {chap.landmark && (
                          <div className="space-y-1.5">
                            <a
                              href={chap.landmark.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-display font-semibold text-sm sm:text-base hover:text-[#1A73E8] block"
                            >
                              🌟 {chap.landmark.title}
                            </a>
                            <p className="text-xs text-[#444746] dark:text-[#C4C7C5]">
                              {chap.landmark.executive_summary}
                            </p>
                            {chap.landmark.mechanistic_deep_dive && (
                              <p className="text-xs text-[#1F1F1F] dark:text-[#E3E3E3]">
                                <strong>Mechanistic Dive:</strong> {chap.landmark.mechanistic_deep_dive}
                              </p>
                            )}
                            {chap.landmark.bench_translation && (
                              <p className="text-xs text-[#188038] dark:text-[#81C995]">
                                <strong>Bench Translation:</strong> {chap.landmark.bench_translation}
                              </p>
                            )}
                            {chap.landmark.methodological_caveat && (
                              <p className="text-xs text-[#B06000] dark:text-[#FDD663]">
                                <strong>⚠️ Caveat:</strong> {chap.landmark.methodological_caveat}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] text-center space-y-2">
              <BookOpen className="w-7 h-7 text-[#1A73E8] mx-auto" />
              <p className="text-sm font-medium">No generated briefings in archive yet</p>
              <p className="text-xs text-[#5F6368] max-w-md mx-auto">
                Click &ldquo;Generate Daily Briefing&rdquo; above to harvest live candidates across 100 sources and synthesize project-specific breakthroughs.
              </p>
            </div>
          )}
        </div>

        {/* Live 100-Source Radar Stream */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#188038]" />
              <h3 className="font-display font-semibold text-base">
                Live Global Harvest Stream
              </h3>
            </div>
            <button
              onClick={handleRefreshStream}
              disabled={streamLoading}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E3E8EF] inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${streamLoading ? "animate-spin" : ""}`} />
              Harvest Fresh Pulse
            </button>
          </div>

          {vipAlerts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#FCE8E6]/60 dark:bg-[#5C1A16]/25 space-y-1">
              <div className="text-xs font-semibold text-[#D93025] inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> VIP Lab Deposits Detected
              </div>
              {vipAlerts.map((v, i) => (
                <div key={i} className="text-xs">
                  <strong>{(v.matched_vips || []).join(", ")}:</strong>{" "}
                  <a href={v.url} target="_blank" rel="noreferrer" className="underline">
                    {v.title}
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="divide-y divide-[#F0F4F9] dark:divide-[#2C2E30]">
            {streamItems.slice(0, 10).map((it, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs sm:text-sm font-medium hover:text-[#1A73E8] line-clamp-1"
                  >
                    {it.title}
                  </a>
                  <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                    {it.source} {it.authors ? `· ${it.authors}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => onSaveZotero(it)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] hover:text-[#1967D2] shrink-0"
                >
                  + Zotero
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
