"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, SlidersHorizontal, Sparkles, UserCheck, Users } from "lucide-react";
import { apiFetch, UserBundle, UserPreferences } from "@/lib/api";

interface Props {
  user: UserBundle | null;
  onUserUpdated: (u: UserBundle) => void;
}

const DEFAULT_PREFS: UserPreferences = {
  personal_interests: "",
  lab_interests:
    "Amyloid fibrils, molecular chaperones (L-PGDS, Hsp70, Clusterin, TGFBI), cryo-EM & X-ray structural biology, biophysical binding kinetics (SPR, ITC, ThT)",
  scoring_mode: "lab",
  summary_language: "en",
  summary_detail: "quantitative",
  default_source_mode: "omni",
  default_max_results: 60,
  auto_draft_omni: true,
  hide_seen_default: false,
  default_zotero_destination: "personal",
  tracked_pis: "",
  openathens_proxy: "https://go.openathens.net/redirector/ntu.edu.sg?url=",
};

export default function PersonalPreferencesPanel({ user, onUserUpdated }: Props) {
  const [prefs, setPrefs] = useState<UserPreferences>(user?.preferences || DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [savedIsError, setSavedIsError] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPrefs(user.preferences);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    setSavedIsError(false);
    try {
      const res = await apiFetch("/api/preferences", {
        method: "PUT",
        body: JSON.stringify(prefs),
      });
      if (res.user) {
        onUserUpdated(res.user);
      }
      setSavedMsg("Preferences saved & synced!");
    } catch (err: any) {
      setSavedIsError(true);
      setSavedMsg(err.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-6 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#E8F0FE] text-[#1967D2] flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base">
              Personal Interests, AI Scoring & Search Defaults
            </h3>
            <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
              Personal searches can score papers by your own research topics, while shared Lab Folders &amp; Group Briefings always score by Lab Interests.
            </p>
          </div>
        </div>
        {savedMsg && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${
              savedIsError
                ? "text-[#C5221F] bg-[#FCE8E6] dark:bg-[#3B1816] dark:text-[#F28B82]"
                : "text-[#188038] bg-[#E6F4EA] dark:bg-[#0D5226]/40 dark:text-[#81C995]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {savedMsg}
          </span>
        )}
      </div>

      {/* Scoring Mode Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPrefs((p) => ({ ...p, scoring_mode: "personal" }))}
          className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
            prefs.scoring_mode === "personal"
              ? "bg-[#E8F0FE]/70 dark:bg-[#1967D2]/15 border-[#1A73E8]"
              : "bg-[#F8FAFD] dark:bg-[#242628] border-[#E3E8EF] dark:border-[#333537]"
          }`}
        >
          <UserCheck className="w-5 h-5 text-[#1A73E8] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold">Score Personal Searches by My Interests</div>
            <div className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
              1–3 ★ relevance &amp; AI summaries prioritize your personal proteins, methods &amp; goals.
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setPrefs((p) => ({ ...p, scoring_mode: "lab" }))}
          className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
            prefs.scoring_mode === "lab"
              ? "bg-[#E6F4EA]/70 dark:bg-[#188038]/15 border-[#188038]"
              : "bg-[#F8FAFD] dark:bg-[#242628] border-[#E3E8EF] dark:border-[#333537]"
          }`}
        >
          <Users className="w-5 h-5 text-[#188038] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold">Score by Shared Lab Interests (Default)</div>
            <div className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
              Matches shared Lab Folders &amp; Group Zotero scoring baseline across all teammates.
            </div>
          </div>
        </button>
      </div>

      {/* Interest Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1">
            My Personal Research Interests (used in Personal Scoring mode)
          </label>
          <textarea
            rows={3}
            value={prefs.personal_interests}
            onChange={(e) => setPrefs((p) => ({ ...p, personal_interests: e.target.value }))}
            placeholder="e.g. L-PGDS SN-38 drug delivery, M94W/M145W mutants, SPR Kd kinetics, cryo-EM single particle, lipocalin pocket"
            className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1">
            Lab Shared Interests Baseline (used for Lab Folders &amp; Lab Mode)
          </label>
          <textarea
            rows={3}
            value={prefs.lab_interests}
            onChange={(e) => setPrefs((p) => ({ ...p, lab_interests: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
          />
        </div>
      </div>

      {/* Granular Personalization Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-[#5F6368] mb-1">
            Summary Detail Level
          </label>
          <select
            value={prefs.summary_detail}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                summary_detail: e.target.value as UserPreferences["summary_detail"],
              }))
            }
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
          >
            <option value="quantitative">Quantitative (Kd, Å, buffer)</option>
            <option value="concise">Concise (1–2 sentences)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#5F6368] mb-1">
            Default Search Engine
          </label>
          <select
            value={prefs.default_source_mode}
            onChange={(e) => setPrefs((p) => ({ ...p, default_source_mode: e.target.value }))}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
          >
            <option value="omni">All 6 Hubs (Omni-Search)</option>
            <option value="classic_both">PubMed + Semantic Scholar</option>
            <option value="pubmed">PubMed Only</option>
            <option value="semantic_scholar">Semantic Scholar Only</option>
            <option value="preprints">bioRxiv + arXiv Preprints</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#5F6368] mb-1">
            Default Result Limit
          </label>
          <select
            value={prefs.default_max_results}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, default_max_results: Number(e.target.value) || 60 }))
            }
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
          >
            <option value={20}>Max 20</option>
            <option value={40}>Max 40</option>
            <option value={60}>Max 60</option>
            <option value={100}>Max 100</option>
            <option value={150}>Max 150</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-[#5F6368] mb-1">
            Tracked PIs / Collaborators (comma-separated)
          </label>
          <input
            value={prefs.tracked_pis}
            onChange={(e) => setPrefs((p) => ({ ...p, tracked_pis: e.target.value }))}
            placeholder="e.g. Nakatsuji M, Inui T, Radford SE, Eisenberg D"
            className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#5F6368] mb-1">
            Institutional OpenAthens / Proxy Prefix
          </label>
          <input
            value={prefs.openathens_proxy}
            onChange={(e) => setPrefs((p) => ({ ...p, openathens_proxy: e.target.value }))}
            className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.auto_draft_omni}
              onChange={(e) => setPrefs((p) => ({ ...p, auto_draft_omni: e.target.checked }))}
              className="rounded border-[#DADCE0] text-[#1A73E8]"
            />
            <span>Auto-open editable AI query plan before Omni-Search</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.hide_seen_default}
              onChange={(e) => setPrefs((p) => ({ ...p, hide_seen_default: e.target.checked }))}
              className="rounded border-[#DADCE0] text-[#1A73E8]"
            />
            <span>Hide already-seen papers by default</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5 shadow-xs transition"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Save Personal Preferences
        </button>
      </div>
    </form>
  );
}
