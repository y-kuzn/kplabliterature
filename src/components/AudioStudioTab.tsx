"use client";

import React, { useEffect, useState } from "react";
import {
  Headphones,
  Loader2,
  Mic,
  Play,
  Sparkles,
  Video,
  Volume2,
} from "lucide-react";
import { apiFetch, mediaUrl, PaperItem } from "@/lib/api";

interface Props {
  selectedPapers: PaperItem[];
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  autoStartNonce?: number;
}

export default function AudioStudioTab({
  selectedPapers,
  isAuthenticated,
  onRequireAuth,
  autoStartNonce = 0,
}: Props) {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [activeEp, setActiveEp] = useState<any | null>(null);
  const [projectName, setProjectName] = useState("Amyloid Chaperones & Cryo-EM");
  const [generating, setGenerating] = useState(false);
  const [podcastError, setPodcastError] = useState<string>("");

  const [seminarInput, setSeminarInput] = useState("");
  const [seminarLoading, setSeminarLoading] = useState(false);
  const [seminarInsights, setSeminarInsights] = useState<string>("");
  const [seminarError, setSeminarError] = useState<string>("");

  useEffect(() => {
    apiFetch("/api/podcasts")
      .then((res) => {
        const eps = res.episodes || [];
        setEpisodes(eps);
        if (eps.length > 0 && !activeEp) setActiveEp(eps[0]);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleGeneratePodcast = async (overrideTheme?: string) => {
    if (!isAuthenticated) {
      setPodcastError("Please sign in to generate an Audio Overview.");
      onRequireAuth();
      return;
    }
    setGenerating(true);
    setPodcastError("");
    try {
      const ep = await apiFetch("/api/podcasts/generate", {
        method: "POST",
        body: JSON.stringify({
          papers: selectedPapers,
          project_name: (overrideTheme ?? projectName).trim() || "Structural Biology",
        }),
      });
      setEpisodes((prev) => [ep, ...prev]);
      setActiveEp(ep);
    } catch (err: any) {
      setPodcastError(err?.message || "Failed to generate podcast. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (autoStartNonce > 0 && selectedPapers.length > 0 && !generating) {
      const leadTitle = selectedPapers[0]?.title?.slice(0, 72) || projectName;
      setProjectName(leadTitle);
      void handleGeneratePodcast(leadTitle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartNonce]);

  const handleAnalyzeSeminar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seminarInput.trim()) return;
    setSeminarLoading(true);
    setSeminarError("");
    setSeminarInsights("");
    try {
      const res = await apiFetch("/api/methods/seminar", {
        method: "POST",
        body: JSON.stringify({ video_url_or_id: seminarInput.trim() }),
      });
      setSeminarInsights(res.insights || res.qa_summary || "No Q&A admissions found.");
    } catch (err: any) {
      setSeminarError(err.message || "Failed to transcribe YouTube video.");
    } finally {
      setSeminarLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: NotebookLM-style Audio Overview Generator & Player */}
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] dark:bg-[#0842A0]/50 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg">
                  Audio Overview Studio (Dr. Maya & Dr. Alex)
                </h2>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                  NotebookLM-style 5-minute quantitative debate dissecting resolutions, Kd, and bench caveats
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5F6368] mb-1">
                Episode Theme / Focus
              </label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-full text-sm bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746]"
              />
              <p className="text-[11px] text-[#5F6368] mt-1">
                {selectedPapers.length > 0
                  ? `Using ${selectedPapers.length} selected search paper(s)`
                  : "Using top recent breakthroughs from your lab radar"}
              </p>
            </div>
            <button
              onClick={() => handleGeneratePodcast()}
              disabled={generating}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-2 disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generating ? "Synthesizing Voices (~15s)..." : "Generate Audio Overview"}
            </button>
          </div>

          {podcastError && (
            <div className="p-3.5 rounded-2xl bg-[#FCE8E6] dark:bg-[#5C1D1A] text-[#C5221F] dark:text-[#F6AEA9] text-xs font-medium">
              {podcastError}
            </div>
          )}

          {activeEp ? (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-[#F8FAFD] dark:bg-[#18191A] border border-[#E3E8EF] dark:border-[#333537] flex flex-col sm:flex-row items-center gap-5">
                {activeEp.cover_filename ? (
                  <img
                    src={mediaUrl(activeEp.cover_filename)}
                    alt="Episode cover"
                    className="w-28 h-28 rounded-2xl object-cover shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#1A73E8] to-[#041E49] text-white flex items-center justify-center shrink-0">
                    <Volume2 className="w-10 h-10" />
                  </div>
                )}
                <div className="flex-1 w-full space-y-2">
                  <div className="text-xs font-semibold text-[#1A73E8]">
                    {activeEp.project_name} · Hosted by Dr. Maya & Dr. Alex
                  </div>
                  <h3 className="font-display font-semibold text-base line-clamp-2">
                    {activeEp.title}
                  </h3>
                  <audio
                    controls
                    src={mediaUrl(activeEp.mp3_filename)}
                    className="w-full h-10 mt-2"
                  />
                </div>
              </div>

              {/* Dialogue Transcript */}
              {activeEp.script && activeEp.script.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                    Interactive Studio Transcript
                  </div>
                  {activeEp.script.map((turn: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        turn.speaker?.includes("Maya")
                          ? "bg-[#E8F0FE]/55 dark:bg-[#0842A0]/20"
                          : "bg-[#F8FAFD] dark:bg-[#242628]"
                      }`}
                    >
                      <span className="font-semibold text-[#1A73E8] dark:text-[#A8C7FA] mr-1.5">
                        {turn.speaker}:
                      </span>
                      <span>{turn.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#5F6368]">
              Click &ldquo;Generate Audio Overview&rdquo; to produce your first neural two-host episode.
            </div>
          )}
        </div>
      </div>

      {/* Right: Episode Archive & YouTube Seminar Q&A Miner */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FCE8E6] text-[#D93025] flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm">
                YouTube Seminar Q&A Intelligence Miner
              </h3>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Extracts speaker Q&A admissions, failed controls, and unpublished buffer tips
              </p>
            </div>
          </div>

          <form onSubmit={handleAnalyzeSeminar} className="flex gap-2">
            <input
              value={seminarInput}
              onChange={(e) => setSeminarInput(e.target.value)}
              placeholder="Paste YouTube lecture URL or ID..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-full bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
            />
            <button
              type="submit"
              disabled={seminarLoading}
              className="px-4 py-2 rounded-full text-xs font-medium bg-[#1A73E8] text-white hover:bg-[#1557B0]"
            >
              {seminarLoading ? "Mining..." : "Analyze Q&A"}
            </button>
          </form>

          {seminarError && (
            <div className="p-3 rounded-2xl bg-[#FCE8E6] text-[#C5221F] text-xs">
              {seminarError}
            </div>
          )}
          {seminarInsights && (
            <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {seminarInsights}
            </div>
          )}
        </div>

        {/* Episode Archive */}
        {episodes.length > 1 && (
          <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-3">
            <h3 className="font-display font-semibold text-sm">Previous Episodes</h3>
            <div className="space-y-2">
              {episodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setActiveEp(ep)}
                  className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition ${
                    activeEp?.id === ep.id
                      ? "bg-[#E8F0FE] dark:bg-[#0842A0]/40"
                      : "bg-[#F8FAFD] dark:bg-[#242628] hover:bg-[#F0F4F9]"
                  }`}
                >
                  <Play className="w-4 h-4 text-[#1A73E8] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{ep.title}</div>
                    <div className="text-[11px] text-[#5F6368]">{ep.project_name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
