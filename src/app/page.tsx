"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BookMarked,
  BookOpen,
  Box,
  Calendar,
  ChevronDown,
  ClipboardPaste,
  Code2,
  FileSpreadsheet,
  FileUp,
  Flame,
  FolderKanban,
  Headphones,
  Link2,
  Loader2,
  LogOut,
  MessageSquareText,
  Moon,
  Pill,
  RefreshCw,
  Search,
  Server,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  User,
  Wand2,
  X,
} from "lucide-react";
import {
  apiFetch,
  ComparisonMatrixResult,
  getApiBaseUrl,
  getStoredToken,
  PaperItem,
  setApiBaseUrl,
  setStoredToken,
  UserBundle,
} from "@/lib/api";
import PaperCard from "@/components/PaperCard";
import CompareMatrixModal from "@/components/CompareMatrixModal";
import InspectorDrawer from "@/components/InspectorDrawer";
import StructureViewer3D from "@/components/StructureViewer3D";
import BriefingsAndProjectsTab from "@/components/BriefingsAndProjectsTab";
import AudioStudioTab from "@/components/AudioStudioTab";
import ZoteroAndSyncTab from "@/components/ZoteroAndSyncTab";
import AuthModal from "@/components/AuthModal";
import HelpTip from "@/components/HelpTip";
import ScienceCatLoader from "@/components/ScienceCatLoader";
import PiRadarPanel from "@/components/PiRadarPanel";
import FeedTab from "@/components/FeedTab";
import NotebookChatModal from "@/components/NotebookChatModal";
import CatResearchAssistant from "@/components/CatResearchAssistant";
import LabJournalTab from "@/components/LabJournalTab";
import { getAmyloidQuote, TOTAL_AMYLOID_QUOTES } from "@/lib/amyloidQuotes";

type NavSection = "search" | "feed" | "studio" | "zotero" | "journal";
type SearchInputMode = "omni" | "boolean" | "batch" | "lookup";

const DOMAIN_CHIPS = [
  {
    key: "all",
    label: "All 6 Hubs",
    tipTitle: "All 6 Intelligence Hubs (100 Sources)",
    tipDesc: "Simultaneously searches journals/preprints, PDB 3D structures, wet-lab protocols, PhD theses, patents/trials, and conference posters.",
  },
  {
    key: "papers",
    label: "Papers & Preprints",
    tipTitle: "Journal Articles & Preprints",
    tipDesc: "Searches PubMed, Semantic Scholar, OpenAlex, bioRxiv, medRxiv, arXiv, and ChemRxiv.",
  },
  {
    key: "plasmids",
    label: "3D Structures & Plasmids",
    tipTitle: "Structural Biology & Vector Constructs",
    tipDesc: "Finds atomic 3D coordinates in RCSB PDB (with resolution in Å & interactive 3D viewer) plus newly deposited Addgene plasmids.",
  },
  {
    key: "protocols",
    label: "Wet-Lab Protocols",
    tipTitle: "Actionable Wet-Lab Protocols",
    tipDesc: "Retrieves purification, buffer recipes, pH/salt conditions, and vitrification steps from Nature Protocols & Bio-protocol.",
  },
  {
    key: "theses",
    label: "Global PhD Theses",
    tipTitle: "Top-100 University PhD Dissertations",
    tipDesc: "Finds newly defended 200+ page doctoral dissertations (Harvard, Oxford, Cambridge, Sorbonne, NTU, NUS) containing unpublished negative controls.",
  },
  {
    key: "patents",
    label: "Patents & Trials",
    tipTitle: "Biopharma IP & Clinical Trials",
    tipDesc: "Monitors pharmaceutical patent filings, formulations, and active ClinicalTrials.gov Phase I–III studies.",
  },
  {
    key: "underground",
    label: "Posters & Lab Whispers",
    tipTitle: "Pre-Publication Posters & Bench Troubleshooting",
    tipDesc: "Scans Zenodo conference posters (deposited months before journals) and community bench troubleshooting discussions.",
  },
];

const LAB_TEMPLATES = [
  {
    label: "Tracked VIP authors in recent months",
    template: "Recent structural biology and amyloid papers by Eisenberg, Radford, Scheres, or Riek in 2025-2026",
  },
  {
    label: "Target protein + method deep dive",
    template: '("ApoD"[Title/Abstract] OR "L-PGDS"[Title/Abstract]) AND ("amyloid"[Title/Abstract] OR "chaperone"[Title/Abstract])',
  },
  {
    label: "Wet-lab purification & buffer recipe",
    template: "recombinant amyloid protein purification neutral pH SEC-MALS buffer protocol",
  },
  {
    label: "Clinical trials & therapeutic modulators",
    template: "transthyretin OR alpha-synuclein kinetic stabilizer clinical trial 2025-2026",
  },
];

const QUICK_SUGGESTIONS = [
  { label: "ApoD & L-PGDS amyloid disaggregation", query: "ApoD L-PGDS amyloid disaggregation" },
  { label: "α-Synuclein Cryo-EM polymorphs 2025-2026", query: "alpha-synuclein cryo-EM fibril polymorphs dates:2025-2026" },
  { label: "TGFBIp FAS1-1 solution NMR", query: "TGFBI FAS1 corneal dystrophy NMR" },
  { label: "Cryo-EM grid buffer protocols", query: "cryo-EM amyloid vitrification buffer in:protocols" },
  { label: "Chaperone PhD dissertations", query: "molecular chaperone amyloid in:theses dates:2025-2026" },
];

interface SavedQueryItem {
  name: string;
  query: string;
  mode: string;
  savedAt: string;
}

function BenchQuestLogo({ large = false }: { large?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <svg
        width={large ? 38 : 28}
        height={large ? 38 : 28}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="3" y="3" width="13" height="13" rx="4.5" fill="#1A73E8" />
        <rect x="20" y="3" width="13" height="13" rx="6.5" fill="#EA4335" />
        <rect x="3" y="20" width="13" height="13" rx="6.5" fill="#FBBC04" />
        <rect x="20" y="20" width="13" height="13" rx="4.5" fill="#34A853" />
        <circle cx="18" cy="18" r="4.2" fill="#FFFFFF" />
      </svg>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-display font-semibold tracking-tight text-[#1F1F1F] dark:text-[#E3E3E3] ${
            large ? "text-3xl sm:text-4xl" : "text-lg"
          }`}
        >
          BenchQuest
        </span>
        <span
          className={`font-display font-medium text-[#5F6368] dark:text-[#9AA0A6] ${
            large ? "text-lg sm:text-xl" : "text-xs hidden lg:inline"
          }`}
        >
          Lab Literature
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [nav, setNav] = useState<NavSection>("search");
  const [studioTab, setStudioTab] = useState<"3d" | "audio" | "radar">("3d");
  const [autoStartPodcastNonce, setAutoStartPodcastNonce] = useState(0);
  const [feedMounted, setFeedMounted] = useState(false);
  const [dark, setDark] = useState(false);

  // Auth & Server State
  const [user, setUser] = useState<UserBundle | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [apiPopoverOpen, setApiPopoverOpen] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState("");

  // Search Modes & Classic Options (100% parity with old site + new Omni engine)
  const [inputMode, setInputMode] = useState<SearchInputMode>("omni");
  const [query, setQuery] = useState("");
  const [booleanDraft, setBooleanDraft] = useState("");
  const [skipAiBoolean, setSkipAiBoolean] = useState(false);
  const [draftingBoolean, setDraftingBoolean] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [lookupInput, setLookupInput] = useState("");

  // Provider, Limits, Dates, Thresholds, Zotero Destination
  const [sourceMode, setSourceMode] = useState<
    "all" | "classic_both" | "pubmed" | "semantic_scholar" | "preprints"
  >("all");
  const [maxResults, setMaxResults] = useState<number>(60);
  const [domainFilter, setDomainFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastExecutedQuery, setLastExecutedQuery] = useState<string>("");
  const [lastManualFlag, setLastManualFlag] = useState<boolean>(false);
  const [omniDrafting, setOmniDrafting] = useState(false);
  const [editablePlan, setEditablePlan] = useState<Record<string, string> | null>(null);
  const [zoteroDest, setZoteroDest] = useState<string>("personal");

  // Saved Favorite Queries (from classic site)
  const [savedQueries, setSavedQueries] = useState<SavedQueryItem[]>([]);
  const [showSavedQueries, setShowSavedQueries] = useState(false);

  // Execution & Results
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<PaperItem[]>([]);
  const [queryPlan, setQueryPlan] = useState<Record<string, string> | null>(null);
  const [showQueryPlan, setShowQueryPlan] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Selection, Persistent Notebook Sources, Matrix, Inspector Drawer & Zotero
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [notebookMap, setNotebookMap] = useState<Record<string, PaperItem>>({});
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [comparingLoading, setComparingLoading] = useState(false);
  const [matrixResult, setMatrixResult] = useState<ComparisonMatrixResult | null>(null);
  const [inspectorPaper, setInspectorPaper] = useState<PaperItem | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"overview" | "graph" | "structure">("overview");
  const [toast, setToast] = useState<string>("");

  const [repurposing, setRepurposing] = useState<any[]>([]);
  const [scoringScope, setScoringScope] = useState<"auto" | "personal" | "lab">("auto");
  const [repostModalPaper, setRepostModalPaper] = useState<PaperItem | null>(null);
  const [repostModalNote, setRepostModalNote] = useState("");
  const [repostSubmitting, setRepostSubmitting] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("bq_theme");
    if (savedTheme === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    const sq = window.localStorage.getItem("bq_saved_queries");
    if (sq) {
      try {
        setSavedQueries(JSON.parse(sq));
      } catch {
        // ignore
      }
    }
    setCustomApiUrl(getApiBaseUrl());
    setQuoteIdx(Math.floor(Math.random() * TOTAL_AMYLOID_QUOTES));
    try {
      const nbRaw = window.localStorage.getItem("bq_notebook_sources");
      if (nbRaw) {
        const parsed = JSON.parse(nbRaw);
        if (parsed && typeof parsed === "object") {
          setNotebookMap(parsed);
          setSelectedUrls(new Set(Object.keys(parsed)));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persistNotebook = (nextMap: Record<string, PaperItem>) => {
    setNotebookMap(nextMap);
    setSelectedUrls(new Set(Object.keys(nextMap)));
    try {
      window.localStorage.setItem("bq_notebook_sources", JSON.stringify(nextMap));
    } catch {
      // ignore
    }
  };

  const toggleNotebookPaper = (item: PaperItem) => {
    const k = item.url || item.title;
    if (!k) return;
    const next = { ...notebookMap };
    if (next[k]) {
      delete next[k];
    } else {
      next[k] = item;
    }
    persistNotebook(next);
  };

  const addPapersToNotebook = (items: PaperItem[]) => {
    const next = { ...notebookMap };
    for (const it of items) {
      const k = it.url || it.title;
      if (k) next[k] = it;
    }
    persistNotebook(next);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRepostModalPaper(null);
        setInspectorPaper(null);
        setMatrixResult(null);
        setAuthModalOpen(false);
        setApiPopoverOpen(false);
        setDatePickerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (nav === "feed") setFeedMounted(true);
  }, [nav]);

  const persistSavedQueries = (next: SavedQueryItem[]) => {
    setSavedQueries(next);
    window.localStorage.setItem("bq_saved_queries", JSON.stringify(next));
  };

  const handleSaveCurrentQuery = () => {
    const activeQ = (inputMode === "boolean" ? booleanDraft || query : query).trim();
    if (!activeQ) {
      showToast("Enter a query first to save it to Favorites.");
      return;
    }
    const item: SavedQueryItem = {
      name: activeQ.slice(0, 42),
      query: activeQ,
      mode: sourceMode,
      savedAt: new Date().toLocaleDateString(),
    };
    persistSavedQueries([item, ...savedQueries.slice(0, 19)]);
    showToast("⭐ Saved query to Favorites!");
  };

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        window.localStorage.setItem("bq_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        window.localStorage.setItem("bq_theme", "light");
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(""), 3800);
  };

  useEffect(() => {
    if (user?.preferences) {
      const p = user.preferences;
      if (p.default_max_results) setMaxResults(p.default_max_results);
      if (p.default_source_mode) {
        setSourceMode((p.default_source_mode === "omni" ? "all" : p.default_source_mode) as any);
      }
      if (p.scoring_mode) setScoringScope(p.scoring_mode);
      if (p.default_zotero_destination) setZoteroDest(p.default_zotero_destination);
    }
  }, [user?.preferences]);

  useEffect(() => {
    apiFetch("/api/health")
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));

    apiFetch("/api/methods/repurposing")
      .then((res) => setRepurposing(res.candidates || []))
      .catch(() => {});

    const tok = getStoredToken();
    if (tok) {
      apiFetch("/api/auth/me")
        .then((res) => setUser(res.user))
        .catch(() => setStoredToken(null));
    }
  }, []);

  const handleDraftBoolean = async () => {
    const seed = query.trim() || booleanDraft.trim();
    if (!seed) {
      showToast("Describe your research topic above first.");
      return;
    }
    setDraftingBoolean(true);
    try {
      const res = await apiFetch("/api/search/draft-query", {
        method: "POST",
        body: JSON.stringify({
          query: seed,
          dates: dateFrom || dateTo ? `${dateFrom || "..."}..${dateTo || "..."}` : "all",
          date_from: dateFrom || null,
          date_to: dateTo || null,
        }),
      });
      setBooleanDraft(res.recommended_boolean || seed);
      setQueryPlan(res.query_plan || null);
      showToast("✨ AI drafted optimized MeSH / Boolean query — tweak below & execute!");
    } catch (err: any) {
      showToast(`Draft error: ${err.message}`);
    } finally {
      setDraftingBoolean(false);
    }
  };

  const handleDraftOmniPlan = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    if (!q) return;
    if (overrideQuery !== undefined) setQuery(overrideQuery);
    setOmniDrafting(true);
    setSearchError("");
    try {
      const res = await apiFetch("/api/search/draft-query", {
        method: "POST",
        body: JSON.stringify({
          query: q,
          dates: dateFrom || dateTo ? `${dateFrom || "..."}..${dateTo || "..."}` : "all",
          date_from: dateFrom || null,
          date_to: dateTo || null,
        }),
      });
      setEditablePlan(res.query_plan || { pubmed: q, semantic_scholar: q, openalex: q });
      setQueryPlan(res.query_plan || null);
    } catch (err: any) {
      setSearchError(err.message || "Could not generate AI query plan.");
    } finally {
      setOmniDrafting(false);
    }
  };

  const executeOmniSearch = async (
    overrideQuery?: string,
    forceManual = false,
    customPlanOverride?: Record<string, string> | null
  ) => {
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    if (!q) return;
    if (overrideQuery !== undefined) setQuery(overrideQuery);

    setSearching(true);
    setHasSearched(true);
    setSearchError("");
    setLastExecutedQuery(q);
    setLastManualFlag(forceManual || skipAiBoolean);
    const activePlan = customPlanOverride !== undefined ? customPlanOverride : editablePlan;
    try {
      const res = await apiFetch("/api/search/omni", {
        method: "POST",
        body: JSON.stringify({
          query: q,
          domains: domainFilter === "all" ? null : [domainFilter],
          dates: dateFrom || dateTo ? `${dateFrom || "..."}..${dateTo || "..."}` : "all",
          date_from: dateFrom || null,
          date_to: dateTo || null,
          offset: 0,
          max_results: maxResults,
          source_mode: sourceMode,
          manual_boolean: forceManual || skipAiBoolean,
          custom_plan: activePlan || null,
          scoring_scope: scoringScope,
        }),
      });
      setResults(res.items || []);
      setQueryPlan(res.query_plan || null);
      setEditablePlan(null);
    } catch (err: any) {
      setSearchError(err.message || "Search failed. Check API connection.");
    } finally {
      setSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (!lastExecutedQuery || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await apiFetch("/api/search/omni", {
        method: "POST",
        body: JSON.stringify({
          query: lastExecutedQuery,
          domains: domainFilter === "all" ? null : [domainFilter],
          dates: dateFrom || dateTo ? `${dateFrom || "..."}..${dateTo || "..."}` : "all",
          date_from: dateFrom || null,
          date_to: dateTo || null,
          offset: results.length,
          max_results: maxResults,
          source_mode: sourceMode,
          manual_boolean: lastManualFlag,
          custom_plan: editablePlan || queryPlan || null,
          scoring_scope: scoringScope,
          hide_seen: Boolean(user?.preferences?.hide_seen_default),
        }),
      });
      const incoming: PaperItem[] = res.items || [];
      const seen = new Set(results.map((r) => (r.url || r.title).toLowerCase()));
      const fresh = incoming.filter((it) => !seen.has((it.url || it.title).toLowerCase()));
      setResults((prev) => [...prev, ...fresh]);
      showToast(fresh.length > 0 ? `+${fresh.length} more discoveries loaded` : "No additional unique results in deeper pages");
    } catch (err: any) {
      showToast(`Load more error: ${err.message}`);
    } finally {
      setLoadingMore(false);
    }
  };

  const executeBatchOrLookup = async (rawContent: string) => {
    if (!rawContent.trim()) return;
    setSearching(true);
    setHasSearched(true);
    setSearchError("");
    try {
      const res = await apiFetch("/api/search/batch", {
        method: "POST",
        body: JSON.stringify({ text: rawContent }),
      });
      setResults(res.items || []);
      setQueryPlan(null);
    } catch (err: any) {
      setSearchError(err.message || "Reference lookup failed.");
    } finally {
      setSearching(false);
    }
  };

  const handlePdfSelected = async (file: File) => {
    setSearching(true);
    setHasSearched(true);
    setSearchError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/search/pdf", {
        method: "POST",
        body: fd,
      });
      setResults(res.items || []);
      showToast(`Analyzed PDF: ${file.name}`);
    } catch (err: any) {
      setSearchError(err.message || "PDF analysis failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleSaveToZotero = async (papersToSave: PaperItem[]) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (zoteroDest === "personal" && !user.zotero_connected) {
      showToast("Connect your Zotero key in the 'Settings' tab (or pick a Shared Lab Library)!");
      setNav("zotero");
      return;
    }
    try {
      showToast(`Saving ${papersToSave.length} item(s) to Zotero (${zoteroDest})...`);
      const res = await apiFetch("/api/zotero/save", {
        method: "POST",
        body: JSON.stringify({ papers: papersToSave, destination: zoteroDest }),
      });
      const nextSaved = new Set(savedUrls);
      papersToSave.forEach((p) => nextSaved.add(p.url || p.title));
      setSavedUrls(nextSaved);
      showToast(
        `✅ Zotero: ${res.saved_new} saved${
          res.duplicates ? `, ${res.duplicates} already in library` : ""
        }`
      );
    } catch (err: any) {
      showToast(`❌ Zotero: ${err.message}`);
    }
  };

  const handleCompareSelected = async () => {
    const chosen = results.filter((r) => selectedUrls.has(r.url || r.title));
    if (chosen.length < 2) {
      showToast("Select at least 2 papers using the checkboxes on the left of cards.");
      return;
    }
    setComparingLoading(true);
    try {
      const res = await apiFetch<ComparisonMatrixResult>("/api/methods/compare", {
        method: "POST",
        body: JSON.stringify({ papers: chosen, focus_question: query }),
      });
      setMatrixResult(res);
    } catch (err: any) {
      showToast(`❌ Comparison failed: ${err.message}`);
    } finally {
      setComparingLoading(false);
    }
  };

  const filteredResults = results.filter((it) => {
    if ((it.score3 || 2) < minScoreFilter) return false;
    if (domainFilter !== "all" && it.domain && it.domain !== domainFilter) return false;
    return true;
  });

  const selectedPapersList =
    Object.keys(notebookMap).length > 0
      ? Object.values(notebookMap)
      : results.filter((r) => selectedUrls.has(r.url || r.title));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Google Workspace App Bar */}
      <header className="sticky top-0 z-30 bg-[#F8FAFD]/95 dark:bg-[#131314]/95 backdrop-blur-md border-b border-[#E3E8EF] dark:border-[#2C2E30]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => {
                setNav("search");
                setHasSearched(false);
              }}
              className="focus:outline-none shrink-0"
            >
              <BenchQuestLogo />
            </button>

            {/* Primary Navigation Pills with "?" Tooltips */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#F0F4F9] dark:bg-[#1E1F20] p-1 rounded-full">
              {(
                [
                  [
                    "search",
                    "Search",
                    Search,
                    "Multi-Mode Literature Search",
                    "Search via AI Omni-Search, Classic PubMed/Semantic Scholar Boolean Builder, Pasted Citations, or DOI/PMID/URL/PDF.",
                  ],
                  [
                    "feed",
                    "Feed",
                    Flame,
                    "BenchFeed · Discovery, Reposts & Briefings",
                    "Scroll For You papers, teammate reposts, Recently in Lab Zotero, and Daily/Weekly Briefings & Projects.",
                  ],
                  [
                    "studio",
                    "Lab Studio",
                    Box,
                    "3D Viewer, Audio Podcasts & PI Radar",
                    "Inspect 3D PDB/AlphaFold structures, generate Dr. Maya & Dr. Alex science podcasts, and track competitor PIs.",
                  ],
                  [
                    "zotero",
                    "Settings",
                    SlidersHorizontal,
                    "Personal Settings, Zotero & Telegram Sync",
                    "Configure personal vs. lab AI scoring interests, tracked PIs, Zotero libraries (6072114 / 6064631 / 6059722), smart tags, and @BenchQuestScoutBot pairing.",
                  ],
                  ...(user?.username?.toLowerCase() === "y-kuz"
                    ? ([
                        [
                          "journal",
                          "Lab Journal",
                          BookOpen,
                          "Private Lab Journal & 96-Well ThT Planner",
                          "Strictly private wet-lab notebook for 96-well ThT assays, master mix recipes, SDS-PAGE gels, and protein purifications.",
                        ],
                      ] as const)
                    : []),
                ] as const
              ).map(([key, label, Icon, tipTitle, tipDesc]) => {
                const active = nav === key;
                return (
                  <button
                    key={key}
                    onClick={() => setNav(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition ${
                      active
                        ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD] font-semibold"
                        : "text-[#444746] dark:text-[#C4C7C5] hover:bg-white/70 dark:hover:bg-[#282A2C]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                    <HelpTip title={tipTitle} description={tipDesc} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 relative shrink-0">
            <button
              type="button"
              onClick={() => setNotebookOpen(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
                selectedUrls.size > 0
                  ? "bg-[#E8F0FE] dark:bg-[#0842A0]/50 text-[#1967D2] dark:text-[#A8C7FA] border border-[#1A73E8]/40"
                  : "bg-[#F0F4F9] dark:bg-[#1E1F20] hover:bg-[#E3E8EF] text-[#444746] dark:text-[#C4C7C5]"
              }`}
              title="Open Notebook Sources & Grounded AI Chat"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span className="hidden sm:inline">Notebook</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#1A73E8] text-white text-[10px] font-semibold">
                {selectedPapersList.length}
              </span>
            </button>
            <button
              onClick={() => setApiPopoverOpen((o) => !o)}
              className="px-2.5 py-1.5 rounded-full text-xs bg-[#F0F4F9] dark:bg-[#1E1F20] hover:bg-[#E3E8EF] inline-flex items-center gap-1.5 text-[#444746] dark:text-[#C4C7C5]"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOk === true
                    ? "bg-[#34A853]"
                    : serverOk === false
                    ? "bg-[#EA4335]"
                    : "bg-[#FBBC04]"
                }`}
              />
              <Server className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">
                {serverOk ? "Engine Online" : "API Config"}
              </span>
            </button>

            {apiPopoverOpen && (
              <div className="absolute right-0 top-12 w-80 p-4 rounded-2xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-xl z-50 space-y-2.5">
                <div className="text-xs font-semibold">FastAPI Engine URL (Railway / Local)</div>
                <input
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  placeholder="https://your-service.up.railway.app"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setApiPopoverOpen(false)}
                    className="px-3 py-1 text-xs text-[#5F6368]"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setApiBaseUrl(customApiUrl);
                      setApiPopoverOpen(false);
                      apiFetch("/api/health")
                        .then(() => {
                          setServerOk(true);
                          showToast("✅ Connected to FastAPI Engine!");
                        })
                        .catch(() => setServerOk(false));
                    }}
                    className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#1A73E8] text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={toggleDark}
              aria-label="Toggle color theme"
              className="p-2 rounded-full hover:bg-[#E3E8EF] dark:hover:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-[#E8F0FE] dark:bg-[#0842A0]/45 text-[#1967D2] dark:text-[#A8C7FA] text-xs font-medium">
                <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-semibold uppercase">
                  {user.display_name.slice(0, 1)}
                </span>
                <span className="hidden lg:inline max-w-[150px] truncate px-1">
                  {user.display_name}
                </span>
                <button
                  onClick={() => {
                    setStoredToken(null);
                    setUser(null);
                    showToast("Signed out");
                  }}
                  className="p-1 rounded-full hover:bg-black/10"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5 shadow-xs transition"
              >
                <User className="w-3.5 h-3.5" /> Sign in
              </button>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Nav Strip */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2">
          {(
            [
              ["search", "Search"],
              ["feed", "Feed"],
              ["studio", "Lab Studio"],
              ["zotero", "Settings"],
              ...(user?.username?.toLowerCase() === "y-kuz" ? ([["journal", "Lab Journal"]] as const) : []),
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setNav(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                nav === key
                  ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD]"
                  : "text-[#5F6368] dark:text-[#C4C7C5]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {nav === "search" && (
          <div className="space-y-6">
            {!hasSearched && (
              <div className="pt-4 sm:pt-8 pb-1 text-center space-y-2.5">
                {!searching && !omniDrafting && !draftingBoolean && (
                  <div className="flex justify-center -mb-1">
                    <ScienceCatLoader stage="idle" compact subtitle=" " />
                  </div>
                )}
                <BenchQuestLogo large />
                {(() => {
                  const q = getAmyloidQuote(quoteIdx);
                  return (
                    <div className="flex items-center justify-center px-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuoteIdx(Math.floor(Math.random() * TOTAL_AMYLOID_QUOTES))
                        }
                        title="Click for another amyloid / chaperone joke or motivation"
                        className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0F4F9]/80 dark:bg-[#1E1F20] hover:bg-[#E8F0FE] dark:hover:bg-[#282A2C] border border-[#E3E8EF] dark:border-[#333537] text-xs sm:text-sm text-[#444746] dark:text-[#C4C7C5] transition max-w-2xl"
                      >
                        <span className="italic">“{q.text}”</span>
                        <span className="text-[10px] font-mono text-[#1A73E8] shrink-0 inline-flex items-center gap-1">
                          #{q.index}/{q.total}
                          <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ==============================================================
                UNIFIED GOOGLE OMNIBOX WITH ALL 4 CLASSIC + NEW MODES & "?" TIPS
            ============================================================== */}
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Top Mode Switcher Strip (with ? tooltips explaining every mode!) */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {(
                  [
                    [
                      "omni",
                      "Omni-Search (AI)",
                      Sparkles,
                      "Natural Language Omni-Search",
                      "Type any topic or question in plain English or Russian. AI automatically crafts tailored queries for PubMed, Semantic Scholar, OpenAlex, PDB, protocols, theses, and patents.",
                    ],
                    [
                      "boolean",
                      "Boolean & Templates",
                      Code2,
                      "Classic Boolean Query Builder & Templates",
                      "Preserves the classic 2-step workflow: pick a Lab Search Template, let AI draft a PubMed MeSH Boolean string so you can edit it, OR toggle 'Manual Query (Skip AI)' to run exact Boolean operators.",
                    ],
                    [
                      "batch",
                      "Paste Citations / Text",
                      ClipboardPaste,
                      "Extract References from Text",
                      "Paste copied Google Scholar pages, reference lists, or manuscript paragraphs. Automatically extracts titles & DOIs, enriches metadata, and scores relevance.",
                    ],
                    [
                      "lookup",
                      "URL / DOI / PMID / PDF",
                      Link2,
                      "Direct Identifier & PDF Manuscript Lookup",
                      "Paste one or multiple PubMed IDs (e.g. 38491023, 37912044), DOIs (10.1038/...), publisher/bioRxiv/arXiv URLs, OR upload a PDF file directly.",
                    ],
                  ] as const
                ).map(([mKey, mLabel, MIcon, tipTitle, tipDesc]) => {
                  const active = inputMode === mKey;
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => setInputMode(mKey)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
                        active
                          ? "bg-[#1A73E8] text-white shadow-xs"
                          : "bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9]"
                      }`}
                    >
                      <MIcon className="w-3.5 h-3.5" />
                      <span>{mLabel}</span>
                      <HelpTip title={tipTitle} description={tipDesc} />
                    </button>
                  );
                })}
              </div>

              {/* Omnibox Surface */}
              <div className="rounded-[28px] bg-white dark:bg-[#1E1F20] border border-[#DFE1E5] dark:border-[#3C4043] shadow-omnibox focus-within:shadow-omnibox-focus focus-within:border-[#1A73E8] transition-all p-2.5 sm:p-3">
                {/* MODE 1: OMNI-SEARCH (DRAFT -> EDIT -> RUN) */}
                {inputMode === "omni" && (
                  <div className="space-y-2">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleDraftOmniPlan();
                      }}
                      className="flex items-center gap-2 px-2.5 py-1"
                    >
                      <Search className="w-5 h-5 text-[#5F6368] shrink-0" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask in natural language, protein target, or topic..."
                        className="w-full bg-transparent text-sm sm:text-base text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] focus:outline-none py-1.5"
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuery("");
                            setEditablePlan(null);
                          }}
                          className="p-1.5 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-[#5F6368]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveCurrentQuery}
                        title="Save query to Favorites"
                        className="p-2 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-[#5F6368] hover:text-[#F9AB00]"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={omniDrafting || searching || !query.trim()}
                        className="px-4 py-2 rounded-full bg-[#E8F0FE] hover:bg-[#D3E3FD] text-[#1967D2] dark:bg-[#0842A0]/60 dark:text-[#A8C7FA] text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 shrink-0 transition"
                        title="Step 1: Generate & review AI queries before running"
                      >
                        {omniDrafting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Draft Query</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => executeOmniSearch()}
                        disabled={searching || !query.trim()}
                        className="px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 shrink-0 transition"
                      >
                        {searching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Search <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Editable AI Query Review Card */}
                    {editablePlan && !omniDrafting && (
                      <div className="mx-2 mb-1 p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#D3E3FD] dark:border-[#3C4043] space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-display font-semibold text-[#1967D2] dark:text-[#A8C7FA]">
                            <Sparkles className="w-3.5 h-3.5" />
                            Step 2: Review &amp; Edit AI-Generated Queries Before Searching
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditablePlan(null)}
                            className="text-xs text-[#5F6368] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3]"
                          >
                            Dismiss
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {Object.entries(editablePlan).map(([hubKey, hubVal]) => (
                            <div key={hubKey} className="space-y-1">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6]">
                                {hubKey.replace("_", " ")}
                              </label>
                              <input
                                value={hubVal}
                                onChange={(e) =>
                                  setEditablePlan((prev) =>
                                    prev ? { ...prev, [hubKey]: e.target.value } : prev
                                  )
                                }
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => executeOmniSearch(query, false, editablePlan)}
                            disabled={searching}
                            className="px-5 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5"
                          >
                            Run Edited Queries <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: CLASSIC BOOLEAN QUERY BUILDER + TEMPLATES + MANUAL MODE */}
                {inputMode === "boolean" && (
                  <div className="p-2 space-y-3">
                    {/* Templates & Saved Favorites Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setQuery(e.target.value);
                              setBooleanDraft(e.target.value);
                            }
                          }}
                          className="px-3 py-1.5 rounded-full text-xs bg-[#F0F4F9] dark:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none"
                        >
                          <option value="">✨ Load a Lab Search Template...</option>
                          {LAB_TEMPLATES.map((tpl, idx) => (
                            <option key={idx} value={tpl.template}>
                              {tpl.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setShowSavedQueries((s) => !s)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E3E8EF] inline-flex items-center gap-1"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-[#1A73E8]" />
                          Saved Queries ({savedQueries.length})
                        </button>
                      </div>

                      <label className="inline-flex items-center gap-1.5 text-xs text-[#444746] dark:text-[#C4C7C5] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={skipAiBoolean}
                          onChange={(e) => setSkipAiBoolean(e.target.checked)}
                          className="rounded text-[#1A73E8]"
                        />
                        <span>Manual Query (Skip AI)</span>
                        <HelpTip
                          align="right"
                          title="Manual Boolean Mode (Skip AI)"
                          description="When checked, your exact Boolean operators (AND / OR / NOT) and PubMed field tags ([Title/Abstract], [MeSH]) are sent directly to the search APIs without AI rewriting."
                        />
                      </label>
                    </div>

                    {showSavedQueries && (
                      <div className="p-3 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] space-y-1.5 max-h-40 overflow-y-auto">
                        {savedQueries.length === 0 ? (
                          <div className="text-xs text-[#5F6368]">
                            No saved queries yet. Click the ★ icon to save favorite queries!
                          </div>
                        ) : (
                          savedQueries.map((sq, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-xl hover:bg-white dark:hover:bg-[#1E1F20]"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setBooleanDraft(sq.query);
                                  setQuery(sq.query);
                                }}
                                className="font-mono truncate text-left text-[#1A73E8] hover:underline"
                              >
                                {sq.query}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  persistSavedQueries(savedQueries.filter((_, idx) => idx !== i))
                                }
                                className="text-[#747775] hover:text-[#D93025]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Step 1: Natural Language Prompt (if not skipping AI) */}
                    {!skipAiBoolean && (
                      <div className="flex gap-2">
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Step 1: Describe what you want in plain words (e.g. L-PGDS binding to Aβ fibrils)..."
                          className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#E3E8EF] dark:border-[#3C4043] focus:outline-none focus:border-[#1A73E8]"
                        />
                        <button
                          type="button"
                          onClick={handleDraftBoolean}
                          disabled={draftingBoolean}
                          className="px-4 py-2 rounded-2xl text-xs font-medium bg-[#E8F0FE] text-[#1967D2] hover:bg-[#D3E3FD] inline-flex items-center gap-1.5 shrink-0"
                        >
                          {draftingBoolean ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                          )}
                          Draft Boolean
                        </button>
                      </div>
                    )}

                    {/* Step 2: Review & Edit Exact Boolean Query */}
                    <textarea
                      value={booleanDraft}
                      onChange={(e) => setBooleanDraft(e.target.value)}
                      rows={3}
                      placeholder='Step 2: Review or write your Boolean query, e.g. ("ApoD"[Title/Abstract] OR "L-PGDS"[Title/Abstract]) AND "amyloid"[Title/Abstract]'
                      className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#E3E8EF] dark:border-[#3C4043] focus:outline-none focus:border-[#1A73E8]"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSaveCurrentQuery}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] inline-flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 text-[#F9AB00]" /> Save to Favorites
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          executeOmniSearch(booleanDraft || query, true)
                        }
                        disabled={searching || !(booleanDraft.trim() || query.trim())}
                        className="px-5 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5"
                      >
                        {searching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Execute Query <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 3: PASTE CITATIONS / BIBLIOGRAPHY TEXT */}
                {inputMode === "batch" && (
                  <div className="p-2 space-y-2.5">
                    <textarea
                      value={batchText}
                      onChange={(e) => setBatchText(e.target.value)}
                      rows={4}
                      placeholder="Paste bibliography references, copied Google Scholar results, or manuscript text containing citations..."
                      className="w-full bg-[#F8FAFD] dark:bg-[#282A2C] rounded-2xl p-3 text-xs sm:text-sm focus:outline-none resize-none border border-[#E3E8EF] dark:border-[#3C4043]"
                    />
                    <div className="flex items-center justify-between text-xs text-[#5F6368] px-1">
                      <span>
                        Pipeline: Extract Titles/DOIs → CrossRef / OpenAlex / PubMed → Score & Tag
                      </span>
                      <button
                        type="button"
                        onClick={() => executeBatchOrLookup(batchText)}
                        disabled={searching || !batchText.trim()}
                        className="px-5 py-2 rounded-full bg-[#1A73E8] text-white text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        {searching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Extract & Score Citations
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 4: DIRECT LOOKUP BY URL / DOI / PMID / PDF */}
                {inputMode === "lookup" && (
                  <div className="p-2 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={lookupInput}
                        onChange={(e) => setLookupInput(e.target.value)}
                        placeholder="Paste DOI (10.1038/...), single or multiple PMIDs (38491023, 37912044), or article URL..."
                        className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-mono rounded-full bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#E3E8EF] dark:border-[#3C4043] focus:outline-none focus:border-[#1A73E8]"
                      />
                      <button
                        type="button"
                        onClick={() => executeBatchOrLookup(lookupInput)}
                        disabled={searching || !lookupInput.trim()}
                        className="px-5 py-2 rounded-full bg-[#1A73E8] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {searching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Lookup ID / URL
                      </button>
                    </div>

                    <div
                      onClick={() => pdfInputRef.current?.click()}
                      className="p-4 border-2 border-dashed border-[#D3E3FD] dark:border-[#3C4043] rounded-2xl text-center cursor-pointer hover:bg-[#F8FAFD] dark:hover:bg-[#282A2C] transition flex items-center justify-center gap-3"
                    >
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePdfSelected(f);
                        }}
                      />
                      <FileUp className="w-5 h-5 text-[#1A73E8] shrink-0" />
                      <div className="text-left">
                        <div className="text-xs sm:text-sm font-medium">
                          Or upload a PDF manuscript from your computer
                        </div>
                        <div className="text-[11px] text-[#5F6368]">
                          Extracts full text & DOI via PyMuPDF, enriches metadata, checks PubPeer & prepares Zotero tags
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================
                    OMNIBOX SETTINGS FOOTER (SOURCE ENGINE, MAX RESULTS, DATES, ZOTERO DEST)
                ============================================================ */}
                <div className="mt-2 pt-2.5 px-2.5 border-t border-[#F0F4F9] dark:border-[#2C2E30] flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Classic Source Engine Selector + ? */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1 bg-[#F0F4F9] dark:bg-[#282A2C] px-2.5 py-1 rounded-full">
                      <select
                        value={sourceMode}
                        onChange={(e) => setSourceMode(e.target.value as any)}
                        className="bg-transparent text-[#1F1F1F] dark:text-[#E3E3E3] font-medium focus:outline-none"
                      >
                        <option value="all">🌐 Source: All 6 Hubs + S2</option>
                        <option value="classic_both">📚 Classic: PubMed + Semantic Scholar</option>
                        <option value="pubmed">🧬 PubMed Only (NCBI)</option>
                        <option value="semantic_scholar">🔎 Semantic Scholar Only</option>
                        <option value="preprints">📄 OpenAlex + bioRxiv + arXiv</option>
                      </select>
                      <HelpTip
                        align="left"
                        title="Database Provider Selection"
                        description="Choose whether to scan all 6 BenchQuest hubs simultaneously or restrict strictly to classic academic engines:"
                        bullets={[
                          "All 6 Hubs + S2: PubMed, Semantic Scholar, OpenAlex, bioRxiv, PDB, Protocols, Theses & Patents.",
                          "Classic (PubMed + S2): Exact provider pair from the legacy lab app.",
                          "PubMed Only / Semantic Scholar Only: Targeted single-engine search.",
                        ]}
                      />
                    </div>

                    {/* Max Results */}
                    <div className="inline-flex items-center gap-1 bg-[#F0F4F9] dark:bg-[#282A2C] px-2.5 py-1 rounded-full">
                      <select
                        value={maxResults}
                        onChange={(e) => setMaxResults(Number(e.target.value))}
                        className="bg-transparent text-[#444746] dark:text-[#C4C7C5] focus:outline-none"
                      >
                        <option value={20}>Max 20</option>
                        <option value={40}>Max 40</option>
                        <option value={60}>Max 60</option>
                        <option value={100}>Max 100</option>
                        <option value={150}>Max 150</option>
                      </select>
                    </div>

                    {/* Scoring Scope (Personal Interests vs Shared Lab Interests) */}
                    <div className="inline-flex items-center gap-1 bg-[#F0F4F9] dark:bg-[#282A2C] px-2.5 py-1 rounded-full">
                      <select
                        value={scoringScope}
                        onChange={(e) => setScoringScope(e.target.value as "auto" | "personal" | "lab")}
                        className="bg-transparent text-[#444746] dark:text-[#C4C7C5] focus:outline-none"
                      >
                        <option value="auto">
                          ★ Score: {user?.preferences?.scoring_mode === "personal" ? "Personal (Auto)" : "Lab (Auto)"}
                        </option>
                        <option value="personal">★ Score: My Interests</option>
                        <option value="lab">★ Score: Lab Shared</option>
                      </select>
                      <HelpTip
                        align="left"
                        title="Personal vs. Lab Interest Scoring"
                        description="Choose which profile grades your 1–3 ★ relevance scores for this search. Shared Lab Folders & Group Briefings always use Lab Shared Interests for team consistency."
                      />
                    </div>

                    {/* Custom Date Range Picker (From / To Calendar + Quick Presets) */}
                    <div className="relative inline-flex items-center">
                      <button
                        type="button"
                        onClick={() => setDatePickerOpen((o) => !o)}
                        className={`px-3 py-1 rounded-full inline-flex items-center gap-1.5 transition ${
                          dateFrom || dateTo
                            ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD] font-medium"
                            : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E3E8EF]"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#1A73E8] dark:text-[#A8C7FA]" />
                        <span>
                          {dateFrom || dateTo
                            ? `${dateFrom || "…"} → ${dateTo || "Now"}`
                            : "Date range"}
                        </span>
                        <HelpTip
                          title="Publication Date Range"
                          description="Pick exact start & end dates (calendar) or quick intervals. Filters PubMed (pdat), OpenAlex, and Semantic Scholar directly."
                        />
                      </button>

                      {datePickerOpen && (
                        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-4 rounded-2xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-2xl z-50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-display font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
                              Select Publication Dates
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDateFrom("");
                                setDateTo("");
                                setDatePickerOpen(false);
                              }}
                              className="text-[11px] text-[#1A73E8] hover:underline"
                            >
                              Reset (Any time)
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">
                                From
                              </label>
                              <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">
                                To
                              </label>
                              <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {[
                              { label: "Last 7 days", days: 7 },
                              { label: "Last 30 days", days: 30 },
                              { label: "Last 6 months", days: 180 },
                              { label: "Last 1 year", days: 365 },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  const end = new Date();
                                  const start = new Date(
                                    end.getTime() - preset.days * 86400_000
                                  );
                                  setDateFrom(start.toISOString().slice(0, 10));
                                  setDateTo(end.toISOString().slice(0, 10));
                                  setDatePickerOpen(false);
                                }}
                                className="px-2.5 py-1 rounded-full text-[11px] bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] hover:text-[#1967D2] transition"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setDatePickerOpen(false)}
                              className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#1A73E8] text-white"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score Filter & Zotero Target Library */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1 bg-[#F0F4F9] dark:bg-[#282A2C] px-2.5 py-1 rounded-full">
                      <select
                        value={minScoreFilter}
                        onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                        className="bg-transparent text-[#444746] dark:text-[#C4C7C5] focus:outline-none"
                      >
                        <option value={0}>Show All (Score ≥ 0)</option>
                        <option value={1}>Score ≥ 1</option>
                        <option value={2}>Score ≥ 2 (Recommended)</option>
                        <option value={3}>Score 3 Only</option>
                      </select>
                      <HelpTip
                        title="Minimum AI Score Filter"
                        description="Hide lower-scoring background papers or choose 'Show All (Score ≥ 0)' to inspect every single raw result returned by the databases."
                      />
                    </div>

                    <div className="inline-flex items-center gap-1 bg-[#E8F0FE] dark:bg-[#0842A0]/40 px-2.5 py-1 rounded-full text-[#1967D2] dark:text-[#A8C7FA]">
                      <select
                        value={zoteroDest}
                        onChange={(e) => setZoteroDest(e.target.value)}
                        className="bg-transparent font-medium focus:outline-none max-w-[165px]"
                      >
                        <option value="personal">📥 To: Personal Zotero</option>
                        <option value="Recently added (Lab)">👥 Lab: Recently added</option>
                        <option value="Chemistry (6059722)">⚗️ Lab: Chemistry</option>
                        <option value="Evolution (6064631)">🧬 Lab: Evolution</option>
                      </select>
                      <HelpTip
                        align="right"
                        title="Zotero Save Destination"
                        description="Choose where 'Save to Zotero' exports papers: your Personal Zotero account or one of Professor Konstantin's shared Lab Group libraries (6072114, 6059722, 6064631)."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain Filter Chips with "?" Explanations */}
              <div className="flex items-center justify-center flex-wrap gap-1.5">
                {DOMAIN_CHIPS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setDomainFilter(c.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition ${
                      domainFilter === c.key
                        ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD] font-semibold"
                        : "bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9]"
                    }`}
                  >
                    <span>{c.label}</span>
                    <HelpTip title={c.tipTitle} description={c.tipDesc} />
                  </button>
                ))}
              </div>

              {/* Idle Cat Drafting Loader */}
              {omniDrafting && !hasSearched && (
                <ScienceCatLoader stage="drafting" />
              )}

              {/* Idle Quick Starters */}
              {!hasSearched && !omniDrafting && (
                <div className="pt-3 space-y-2 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#747775]">
                    One-Click Laboratory Discovery Queries
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => {
                          setInputMode("omni");
                          executeOmniSearch(s.query);
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs bg-[#F0F4F9] dark:bg-[#1E1F20] hover:bg-[#E8F0FE] hover:text-[#1967D2] text-[#444746] dark:text-[#C4C7C5] inline-flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3 h-3 text-[#1A73E8]" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Global Science Cat Loader (visible during both AI query drafting & search) */}
            {(searching || omniDrafting || draftingBoolean) && (
              <div className="max-w-4xl mx-auto pt-2">
                <ScienceCatLoader stage={omniDrafting || draftingBoolean ? "drafting" : "searching"} />
              </div>
            )}

            {/* Results Feed */}
            {hasSearched && !searching && !omniDrafting && (
              <div className="max-w-4xl mx-auto space-y-4 pt-2">
                {searchError && (
                  <div className="p-4 rounded-2xl bg-[#FCE8E6] text-[#C5221F] text-sm">
                    {searchError}
                  </div>
                )}

                <>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5F6368] dark:text-[#9AA0A6] px-1">
                      <div className="inline-flex items-center gap-1.5">
                        <span>
                          Showing <strong>{filteredResults.length}</strong> curated discoveries
                          {results.length !== filteredResults.length && ` (of ${results.length} total)`}
                        </span>
                        <HelpTip
                          align="left"
                          title="Multi-Paper AI Comparison & Batch Actions"
                          description="Tick the checkboxes on 2 to 15 cards to summon the floating action bar at the bottom: generate a side-by-side Biophysical Comparison Matrix, create a 5-min Audio Overview, or batch-upload to Zotero."
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {queryPlan && (
                          <button
                            onClick={() => setShowQueryPlan((s) => !s)}
                            className="px-3 py-1 rounded-full bg-[#F0F4F9] dark:bg-[#1E1F20] hover:bg-[#E3E8EF] text-[#1F1F1F] dark:text-[#E3E3E3] inline-flex items-center gap-1 font-medium"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-[#1A73E8]" />
                            Executed Query Breakdown <ChevronDown className="w-3 h-3" />
                          </button>
                        )}
                        {filteredResults.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedUrls.size > 0) {
                                persistNotebook({});
                              } else {
                                addPapersToNotebook(filteredResults.slice(0, 10));
                              }
                            }}
                            className="px-3 py-1 rounded-full bg-[#F0F4F9] dark:bg-[#1E1F20] hover:bg-[#E3E8EF] dark:hover:bg-[#282A2C] font-medium"
                          >
                            {selectedUrls.size > 0 ? "Clear Selection" : "Select Top 10"}
                          </button>
                        )}
                      </div>
                    </div>

                    {showQueryPlan && queryPlan && (
                      <div className="p-4 rounded-2xl bg-[#F0F4F9] dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {Object.entries(queryPlan).map(([engine, qStr]) => (
                          <div key={engine} className="space-y-0.5">
                            <div className="font-semibold uppercase text-[10px] tracking-wider text-[#1A73E8]">
                              {engine}
                            </div>
                            <div className="font-mono text-[11px] bg-white dark:bg-[#282A2C] p-2 rounded-xl break-words">
                              {qStr}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3.5 pb-20">
                      {results.length > 0 && filteredResults.length === 0 && (
                        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] text-center space-y-2.5">
                          <div className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                            No results match the current Score (★ ≥ {minScoreFilter}) or Hub filter.
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMinScoreFilter(1);
                              setDomainFilter("all");
                            }}
                            className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1967D2] hover:bg-[#D2E3FC] transition"
                          >
                            Reset Filters (Show all {results.length})
                          </button>
                        </div>
                      )}
                      {filteredResults.map((item, idx) => {
                        const key = item.url || item.title || String(idx);
                        return (
                          <PaperCard
                            key={key + idx}
                            paper={item}
                            selected={selectedUrls.has(key)}
                            saved={savedUrls.has(key)}
                            onToggleSelect={() => toggleNotebookPaper(item)}
                            onSaveZotero={() => handleSaveToZotero([item])}
                            onRepostFeed={() => {
                              if (!user) return setAuthModalOpen(true);
                              setRepostModalPaper(item);
                              setRepostModalNote("");
                            }}
                            onOpenInspector={(tab) => {
                              setInspectorPaper(item);
                              setInspectorTab(tab);
                            }}
                          />
                        );
                      })}

                      {lastExecutedQuery && filteredResults.length > 0 && (
                        <div className="pt-4 flex justify-center">
                          <button
                            type="button"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#3C4043] hover:bg-[#E8F0FE] hover:border-[#1A73E8] hover:text-[#1967D2] shadow-xs inline-flex items-center gap-2 transition"
                          >
                            {loadingMore && <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />}
                            {loadingMore ? "Harvesting next batch..." : `Load More (+${maxResults})`}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
              </div>
            )}
          </div>
        )}

        {feedMounted && (
          <div className={nav === "feed" ? "" : "hidden"}>
            <FeedTab
              user={user}
              onRequireAuth={() => setAuthModalOpen(true)}
              onSaveZotero={(p) => handleSaveToZotero([p])}
              onPinNotebook={(p) => {
                toggleNotebookPaper(p);
                showToast("Updated Notebook sources!");
              }}
              onOpenInspector={(p, tab) => {
                setInspectorPaper(p);
                setInspectorTab(tab);
              }}
            />
          </div>
        )}

        {nav === "studio" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["3d", "3D & Drug Lab", Box],
                  ["audio", "Audio Studio", Headphones],
                  ["radar", "PI Radar", Sparkles],
                ] as const
              ).map(([k, lbl, Icon]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStudioTab(k)}
                  className={`px-4 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
                    studioTab === k
                      ? "bg-[#1A73E8] text-white shadow-xs"
                      : "bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {lbl}
                </button>
              ))}
            </div>

            {studioTab === "3d" && (
              <div className="space-y-6">
                <StructureViewer3D initialId="6XYO" />
                <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-6 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#137333] flex items-center justify-center">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-base">
                        Amyloid &amp; Chaperone Drug Repurposing Matcher
                      </h3>
                      <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                        FDA-approved &amp; clinical small-molecule kinetic stabilizers and endogenous lipocalin inducers
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {repurposing.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-semibold text-sm">{c.compound}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F0FE] text-[#1967D2]">
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#188038] dark:text-[#81C995] font-medium">
                          Target: {c.target}
                        </div>
                        <p className="text-xs text-[#444746] dark:text-[#C4C7C5] leading-relaxed">
                          {c.chaperone_mechanism}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {studioTab === "audio" && (
              <AudioStudioTab
                selectedPapers={selectedPapersList}
                isAuthenticated={Boolean(user)}
                onRequireAuth={() => setAuthModalOpen(true)}
                autoStartNonce={autoStartPodcastNonce}
              />
            )}

            {studioTab === "radar" && (
              <PiRadarPanel
                user={user}
                onUserUpdated={(u) => setUser(u)}
                onSaveZotero={(p) => handleSaveToZotero([p])}
              />
            )}
          </div>
        )}

        {nav === "zotero" && (
          <ZoteroAndSyncTab
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
            onUserUpdated={(u) => setUser(u)}
          />
        )}

        {nav === "journal" && user?.username?.toLowerCase() === "y-kuz" && (
          <LabJournalTab selectedPapers={selectedPapersList} />
        )}
      </main>

      {/* Floating Google Multi-Select Action Pill Bar */}
      {selectedUrls.size > 0 && nav === "search" && (
        <div className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto rounded-full bg-[#1F1F1F] dark:bg-[#E3E3E3] text-white dark:text-[#1F1F1F] shadow-2xl px-4 sm:px-5 py-2.5 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1A73E8] text-white font-semibold">
              {selectedPapersList.length} in Notebook
            </span>
            <button
              type="button"
              onClick={() => setNotebookOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#34A853] hover:bg-[#188038] text-white inline-flex items-center gap-1.5 transition"
            >
              <MessageSquareText className="w-3.5 h-3.5" /> Ask Papers [1][2]
            </button>
            <button
              onClick={handleCompareSelected}
              disabled={comparingLoading}
              className="px-3.5 py-1.5 rounded-full bg-white/15 dark:bg-black/10 hover:bg-white/25 inline-flex items-center gap-1.5 transition"
            >
              {comparingLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#8AB4F8] dark:text-[#1A73E8]" />
              )}
              {comparingLoading ? "Building Matrix..." : "Compare in AI Matrix"}
            </button>
            <button
              onClick={() => {
                setNav("studio");
                setStudioTab("audio");
                setAutoStartPodcastNonce((n) => n + 1);
              }}
              className="px-3.5 py-1.5 rounded-full bg-white/15 dark:bg-black/10 hover:bg-white/25 inline-flex items-center gap-1.5 transition"
            >
              <Headphones className="w-3.5 h-3.5" /> Audio Overview
            </button>
            <button
              onClick={() => handleSaveToZotero(selectedPapersList)}
              className="px-3.5 py-1.5 rounded-full bg-[#1A73E8] text-white hover:bg-[#1557B0] inline-flex items-center gap-1.5 transition"
            >
              <BookMarked className="w-3.5 h-3.5" /> Batch Save ({zoteroDest === "personal" ? "Personal" : "Lab Group"})
            </button>
            <button
              onClick={() => persistNotebook({})}
              className="p-1 rounded-full hover:bg-white/15"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed right-5 z-50 px-4 py-2.5 rounded-2xl bg-[#1F1F1F] text-white text-xs font-medium shadow-xl transition-all ${
            selectedUrls.size > 0 ? "bottom-20" : "bottom-5"
          }`}
        >
          {toast}
        </div>
      )}

      <CompareMatrixModal matrix={matrixResult} onClose={() => setMatrixResult(null)} />
      <NotebookChatModal
        open={notebookOpen}
        papers={selectedPapersList}
        user={user}
        onClose={() => setNotebookOpen(false)}
        onRemovePaper={(k) => {
          const next = { ...notebookMap };
          delete next[k];
          persistNotebook(next);
        }}
        onClearAll={() => persistNotebook({})}
        onAddPapers={(items) => addPapersToNotebook(items)}
        onOpenInspector={(p) => {
          setInspectorPaper(p);
          setInspectorTab("overview");
        }}
        onCompareMatrix={() => {
          setNotebookOpen(false);
          handleCompareSelected();
        }}
        onOpenAudio={() => {
          setNotebookOpen(false);
          setNav("studio");
          setStudioTab("audio");
          setAutoStartPodcastNonce((n) => n + 1);
        }}
        onRequireAuth={() => setAuthModalOpen(true)}
      />
      <InspectorDrawer
        paper={inspectorPaper}
        initialTab={inspectorTab}
        onClose={() => setInspectorPaper(null)}
        onSaveZotero={(p) => handleSaveToZotero([p])}
      />
      <CatResearchAssistant
        hasSelectionBar={selectedUrls.size > 0}
        onOpenInspector={(p) => {
          setInspectorPaper(p);
          setInspectorTab("overview");
        }}
        onSaveZotero={(p) => handleSaveToZotero([p])}
      />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          showToast(`Welcome back, ${u.display_name}!`);
        }}
      />

      {repostModalPaper && (
        <div
          onClick={() => setRepostModalPaper(null)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              setRepostSubmitting(true);
              try {
                await apiFetch("/api/feed/repost", {
                  method: "POST",
                  body: JSON.stringify({ paper: repostModalPaper, caption: repostModalNote }),
                });
                setRepostModalPaper(null);
                setRepostModalNote("");
                showToast("Reposted to Lab Feed!");
              } catch (err: any) {
                showToast(`❌ ${err.message}`);
              } finally {
                setRepostSubmitting(false);
              }
            }}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-2xl p-6 space-y-4"
          >
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#1A73E8]">
                Repost to Lab Feed
              </div>
              <div className="font-display font-semibold text-sm text-[#1F1F1F] dark:text-[#E3E3E3] line-clamp-2">
                {repostModalPaper.title}
              </div>
            </div>
            <textarea
              rows={3}
              autoFocus
              value={repostModalNote}
              onChange={(e) => setRepostModalNote(e.target.value)}
              placeholder="Add an optional note for teammates (e.g. 'Check Fig 3 SPR curve for L-PGDS M94W')..."
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRepostModalPaper(null)}
                className="px-4 py-2 rounded-full text-xs text-[#5F6368] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={repostSubmitting}
                className="px-5 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5"
              >
                {repostSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Share to Lab Feed
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
