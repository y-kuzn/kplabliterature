"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Beaker,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  FlaskConical,
  Layers,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { apiFetch, PaperItem } from "@/lib/api";

type ExpType = "tht_96" | "sds_page" | "purification" | "note";
type WellCategory = "reaction" | "chaperone_ctrl" | "fibril_ctrl" | "blank" | "water";

interface ThTCondition {
  id: string;
  mixId: string;
  name: string;
  category: Exclude<WellCategory, "water">;
  mode: "ratio" | "direct";
  value: number; // ratio denominator (e.g. 10 for 1:10) OR direct chaperone uM
  peptideUm: number;
  thtUm: number;
  replicates: number;
}

interface ThTConfig {
  peptideName: string;
  peptideStockUm: number;
  chaperoneName: string;
  chaperoneStockUm: number;
  thtStockUm: number;
  bufferName: string;
  wellVolumeUl: number;
  overagePct: number;
  edgeBarrier: "corners" | "perimeter" | "none";
  avoidEdges: boolean;
  conditions: ThTCondition[];
  checkedSteps: string[];
}

interface SdsLane {
  lane: number;
  sample: string;
  sampleUl: number;
  bufferUl: number;
  notes: string;
}

interface SdsConfig {
  gelPct: string;
  runningBuffer: string;
  voltageTime: string;
  loadingDye: "4x" | "5x";
  boilInfo: string;
  lanes: SdsLane[];
}

interface PurifConfig {
  construct: string;
  host: string;
  media: string;
  od600: string;
  inducer: string;
  tempTime: string;
  lysisBuffer: string;
  washElution: string;
  columnResin: string;
  yieldResult: string;
}

interface JournalEntry {
  id?: number;
  entry_date: string;
  exp_type: ExpType;
  title: string;
  tags: string[];
  notes_md: string;
  payload: Record<string, any>;
  linked_papers: PaperItem[];
}

interface Props {
  selectedPapers: PaperItem[];
}

const DEFAULT_THT_CONFIG = (): ThTConfig => ({
  peptideName: "Peptide",
  peptideStockUm: 1000,
  chaperoneName: "LCN1",
  chaperoneStockUm: 50,
  thtStockUm: 1000,
  bufferName: "PBS",
  wellVolumeUl: 100,
  overagePct: 15,
  edgeBarrier: "corners",
  avoidEdges: true,
  conditions: [
    { id: "c1", mixId: "M1", name: "Peptide + LCN1 1:10", category: "reaction", mode: "ratio", value: 10, peptideUm: 100, thtUm: 20, replicates: 3 },
    { id: "c2", mixId: "M2", name: "Peptide + LCN1 1:25", category: "reaction", mode: "ratio", value: 25, peptideUm: 100, thtUm: 20, replicates: 3 },
    { id: "c3", mixId: "M3", name: "Peptide + LCN1 1:50", category: "reaction", mode: "ratio", value: 50, peptideUm: 100, thtUm: 20, replicates: 3 },
    { id: "c4", mixId: "M4", name: "Fibril control", category: "fibril_ctrl", mode: "direct", value: 0, peptideUm: 100, thtUm: 20, replicates: 3 },
    { id: "c5", mixId: "M5", name: "LCN1 control 10 uM", category: "chaperone_ctrl", mode: "direct", value: 10, peptideUm: 0, thtUm: 20, replicates: 3 },
    { id: "c6", mixId: "M6", name: "LCN1 control 4 uM", category: "chaperone_ctrl", mode: "direct", value: 4, peptideUm: 0, thtUm: 20, replicates: 3 },
    { id: "c7", mixId: "M7", name: "LCN1 control 2 uM", category: "chaperone_ctrl", mode: "direct", value: 2, peptideUm: 0, thtUm: 20, replicates: 3 },
    { id: "c8", mixId: "M8", name: "PBS + ThT control", category: "blank", mode: "direct", value: 0, peptideUm: 0, thtUm: 20, replicates: 3 },
  ],
  checkedSteps: [],
});

const DEFAULT_SDS_CONFIG = (): SdsConfig => ({
  gelPct: "4-20% Bis-Tris",
  runningBuffer: "MES SDS (1x)",
  voltageTime: "180 V, 40 min",
  loadingDye: "4x",
  boilInfo: "95 °C, 5 min",
  lanes: [
    { lane: 1, sample: "Ladder (PageRuler)", sampleUl: 5, bufferUl: 0, notes: "10-180 kDa" },
    { lane: 2, sample: "Flow-through", sampleUl: 15, bufferUl: 5, notes: "" },
    { lane: 3, sample: "Wash 1", sampleUl: 15, bufferUl: 5, notes: "" },
    { lane: 4, sample: "Elution 1", sampleUl: 15, bufferUl: 5, notes: "" },
    { lane: 5, sample: "Elution 2", sampleUl: 15, bufferUl: 5, notes: "" },
  ],
});

const DEFAULT_PURIF_CONFIG = (): PurifConfig => ({
  construct: "His6-LCN1 (pET28a)",
  host: "E. coli BL21(DE3)",
  media: "TB + Kan (50 ug/mL)",
  od600: "0.7",
  inducer: "0.5 mM IPTG",
  tempTime: "18 °C, 16 h (overnight)",
  lysisBuffer: "50 mM Tris pH 7.5, 300 mM NaCl, 10 mM imidazole, protease inhibitors",
  washElution: "Wash: 25 mM imidazole | Elution: 250 mM imidazole",
  columnResin: "HisTrap HP 5 mL -> Superdex 75 16/600 (PBS)",
  yieldResult: "",
});

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface WellAssignment {
  well: string;
  category: WellCategory;
  mixId: string;
  label: string;
  peptideUm: number;
  chaperoneUm: number;
  thtUm: number;
  read: boolean;
}

function buildPlateLayout(cfg: ThTConfig): Record<string, WellAssignment> {
  const map: Record<string, WellAssignment> = {};
  const cornerWells = new Set(["A1", "A12", "H1", "H12"]);

  if (cfg.edgeBarrier === "corners") {
    cornerWells.forEach((w) => {
      map[w] = {
        well: w,
        category: "water",
        mixId: "H2O",
        label: "Milli-Q Water (200 uL)",
        peptideUm: 0,
        chaperoneUm: 0,
        thtUm: 0,
        read: false,
      };
    });
  } else if (cfg.edgeBarrier === "perimeter") {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 12; c++) {
        if (r === 0 || r === 7 || c === 0 || c === 11) {
          const w = `${ROWS[r]}${COLS[c]}`;
          map[w] = {
            well: w,
            category: "water",
            mixId: "H2O",
            label: "Milli-Q Water (200 uL)",
            peptideUm: 0,
            chaperoneUm: 0,
            thtUm: 0,
            read: false,
          };
        }
      }
    }
  }

  // Group conditions neatly by row when avoiding edges (B2..G11 = 10 cols/row -> fits 3 triplicates = 9 wells + 1 gap cleanly!)
  const startRow = cfg.avoidEdges ? 1 : 0;
  const endRow = cfg.avoidEdges ? 6 : 7;
  const startCol = cfg.avoidEdges ? 1 : 0;
  const endCol = cfg.avoidEdges ? 10 : 11;

  // Smart row-packing: keep triplicates of the same category together if they fit on a row
  let curR = startRow;
  let curC = startCol;
  let prevCat: string | null = null;

  for (const cond of cfg.conditions) {
    const reps = Math.max(1, Math.min(12, cond.replicates || 3));
    const chapUm =
      cond.mode === "ratio" && cond.value > 0 && cond.peptideUm > 0
        ? +(cond.peptideUm / cond.value).toFixed(3)
        : cond.value;

    // Start new row if category switches and current row already has items, or if reps don't fit on current row
    if (prevCat && prevCat !== cond.category && curC > startCol) {
      curR += 1;
      curC = startCol;
    } else if (curC + reps - 1 > endCol) {
      curR += 1;
      curC = startCol;
    }
    prevCat = cond.category;

    for (let i = 0; i < reps; i++) {
      while (curR <= endRow) {
        const w = `${ROWS[curR]}${COLS[curC]}`;
        if (!map[w]) {
          map[w] = {
            well: w,
            category: cond.category,
            mixId: cond.mixId,
            label: cond.name,
            peptideUm: cond.peptideUm,
            chaperoneUm: chapUm,
            thtUm: cond.thtUm,
            read: true,
          };
          curC += 1;
          if (curC > endCol) {
            curR += 1;
            curC = startCol;
          }
          break;
        }
        curC += 1;
        if (curC > endCol) {
          curR += 1;
          curC = startCol;
        }
      }
    }
  }
  return map;
}

const CATEGORY_STYLE: Record<WellCategory, string> = {
  reaction: "bg-[#E8F0FE] dark:bg-[#0842A0]/60 border-[#1A73E8] text-[#0842A0] dark:text-[#D2E3FC]",
  chaperone_ctrl: "bg-[#E6F4EA] dark:bg-[#0D652D]/50 border-[#137333] text-[#0D652D] dark:text-[#CEEAD6]",
  fibril_ctrl: "bg-[#FEF7E0] dark:bg-[#7A4F01]/50 border-[#B06000] text-[#7A4F01] dark:text-[#FDE293]",
  blank: "bg-[#F3E8FD] dark:bg-[#5E2CA5]/45 border-[#8430CE] text-[#5E2CA5] dark:text-[#E9D2FD]",
  water: "bg-[#E0F2FE] dark:bg-[#0369A1]/40 border-[#0284C7]/60 text-[#0369A1] dark:text-[#BAE6FD]",
};

export default function LabJournalTab({ selectedPapers }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");
  const [toast, setToast] = useState("");
  const [hoveredWell, setHoveredWell] = useState<WellAssignment | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [active, setActive] = useState<JournalEntry>({
    entry_date: todayStr,
    exp_type: "tht_96",
    title: "ThT Kinetics: Peptide + LCN1",
    tags: ["ThT", "96-well", "LCN1"],
    notes_md: "",
    payload: DEFAULT_THT_CONFIG(),
    linked_papers: [],
  });

  useEffect(() => {
    apiFetch("/api/journal")
      .then((res) => {
        const list: JournalEntry[] = res.entries || [];
        setEntries(list);
        if (list.length > 0) setActive(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  const thtCfg: ThTConfig = useMemo(() => {
    if (active.exp_type === "tht_96" && active.payload?.conditions) {
      return active.payload as ThTConfig;
    }
    return DEFAULT_THT_CONFIG();
  }, [active]);

  const sdsCfg: SdsConfig = useMemo(() => {
    if (active.exp_type === "sds_page" && active.payload?.lanes) {
      return active.payload as SdsConfig;
    }
    return DEFAULT_SDS_CONFIG();
  }, [active]);

  const purifCfg: PurifConfig = useMemo(() => {
    if (active.exp_type === "purification" && active.payload?.construct !== undefined) {
      return active.payload as PurifConfig;
    }
    return DEFAULT_PURIF_CONFIG();
  }, [active]);

  const plateMap = useMemo(() => buildPlateLayout(thtCfg), [thtCfg]);

  const masterMixRows = useMemo(() => {
    const mult = 1 + (Number(thtCfg.overagePct) || 0) / 100;
    return thtCfg.conditions.map((c) => {
      const reps = Math.max(1, c.replicates || 3);
      const totalUl = +(reps * thtCfg.wellVolumeUl * mult).toFixed(1);
      const chapUm =
        c.mode === "ratio" && c.value > 0 && c.peptideUm > 0
          ? c.peptideUm / c.value
          : c.value;
      const pepUl =
        thtCfg.peptideStockUm > 0 ? +((c.peptideUm / thtCfg.peptideStockUm) * totalUl).toFixed(2) : 0;
      const chapUl =
        thtCfg.chaperoneStockUm > 0 ? +((chapUm / thtCfg.chaperoneStockUm) * totalUl).toFixed(2) : 0;
      const thtUl =
        thtCfg.thtStockUm > 0 ? +((c.thtUm / thtCfg.thtStockUm) * totalUl).toFixed(2) : 0;
      const bufUl = +(totalUl - pepUl - chapUl - thtUl).toFixed(2);
      const wells = Object.values(plateMap)
        .filter((w) => w.mixId === c.mixId && w.read)
        .map((w) => w.well);
      const lowVol =
        (pepUl > 0 && pepUl < 1) || (chapUl > 0 && chapUl < 1) || (thtUl > 0 && thtUl < 1);
      return {
        cond: c,
        wellsRange: wells.length ? `${wells[0]}–${wells[wells.length - 1]}` : "—",
        totalUl,
        chapUm: +chapUm.toFixed(2),
        bufUl,
        thtUl,
        chapUl,
        pepUl,
        lowVol,
      };
    });
  }, [thtCfg, plateMap]);

  const benchAudit = useMemo(() => {
    const warnings: string[] = [];
    const hasBlank = thtCfg.conditions.some((c) => c.category === "blank");
    const hasFibrilCtrl = thtCfg.conditions.some((c) => c.category === "fibril_ctrl");
    const hasChapCtrl = thtCfg.conditions.some((c) => c.category === "chaperone_ctrl");
    if (!hasBlank) warnings.push("Missing Buffer + ThT blank control.");
    if (!hasFibrilCtrl) warnings.push("Missing Peptide-only Fibril control.");
    if (!hasChapCtrl) warnings.push(`Missing ${thtCfg.chaperoneName}-only control (checks self-ThT fluorescence).`);
    if (thtCfg.edgeBarrier === "none") warnings.push("Edge barrier is off — add 200 uL Milli-Q water to corners (A1, A12, H1, H12) for 37 °C runs.");
    if (masterMixRows.some((m) => m.lowVol)) warnings.push("One or more pipetting volumes are < 1.0 uL — prepare a 1:10 working stock for accuracy.");
    if (masterMixRows.some((m) => m.bufUl < 0)) warnings.push("Total stock volumes exceed reaction volume! Increase stock concentrations.");
    return warnings;
  }, [thtCfg, masterMixRows]);

  const handleSave = async () => {
    if (!active.title.trim()) return flash("Add a title first.");
    setSaving(true);
    try {
      if (active.id) {
        const res = await apiFetch(`/api/journal/${active.id}`, {
          method: "PUT",
          body: JSON.stringify(active),
        });
        setEntries((prev) => prev.map((e) => (e.id === active.id ? res.entry : e)));
        setActive(res.entry);
        flash("Journal entry updated.");
      } else {
        const res = await apiFetch("/api/journal", {
          method: "POST",
          body: JSON.stringify(active),
        });
        setEntries((prev) => [res.entry, ...prev]);
        setActive(res.entry);
        flash("Saved to your private Lab Journal.");
      }
    } catch (err: any) {
      flash(err?.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleNewEntry = (type: ExpType) => {
    const defaults: Record<ExpType, { title: string; tags: string[]; payload: any }> = {
      tht_96: { title: "New 96-Well ThT Assay", tags: ["ThT", "96-well"], payload: DEFAULT_THT_CONFIG() },
      sds_page: { title: "SDS-PAGE Gel", tags: ["SDS-PAGE"], payload: DEFAULT_SDS_CONFIG() },
      purification: { title: "Protein Expression & Purification", tags: ["Purification"], payload: DEFAULT_PURIF_CONFIG() },
      note: { title: "Lab Bench Note", tags: ["Note"], payload: {} },
    };
    const d = defaults[type];
    setActive({
      entry_date: new Date().toISOString().slice(0, 10),
      exp_type: type,
      title: d.title,
      tags: d.tags,
      notes_md: "",
      payload: d.payload,
      linked_papers: [],
    });
  };

  const handleCloneActive = () => {
    const clonedPayload = JSON.parse(JSON.stringify(active.payload || {}));
    if (clonedPayload.checkedSteps) clonedPayload.checkedSteps = [];
    setActive({
      ...active,
      id: undefined,
      entry_date: new Date().toISOString().slice(0, 10),
      title: `${active.title} (Copy)`,
      payload: clonedPayload,
    });
    flash("Cloned entry — edit parameters and click Save.");
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await apiFetch(`/api/journal/${id}`, { method: "DELETE" });
      const rest = entries.filter((e) => e.id !== id);
      setEntries(rest);
      if (active.id === id) {
        if (rest.length > 0) setActive(rest[0]);
        else handleNewEntry("tht_96");
      }
      flash("Entry deleted.");
    } catch (err: any) {
      flash(err?.message || "Could not delete.");
    }
  };

  const exportSynergyCsv = () => {
    const header = "Well,SampleName,MasterMix,Category,Peptide_uM,Chaperone_uM,ThT_uM,IncludeInRead\n";
    const lines: string[] = [];
    for (const r of ROWS) {
      for (const c of COLS) {
        const w = `${r}${c}`;
        const a = plateMap[w];
        if (a) {
          lines.push(
            `${w},"${a.label.replace(/"/g, '""')}",${a.mixId},${a.category},${a.peptideUm},${a.chaperoneUm},${a.thtUm},${a.read ? "YES" : "NO"}`
          );
        }
      }
    }
    const blob = new Blob([header + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${active.entry_date}_${active.title.replace(/[^a-z0-9]+/gi, "_")}_SynergyH1.csv`;
    link.click();
    URL.revokeObjectURL(url);
    flash("Exported BioTek Synergy H1 / Prism CSV layout.");
  };

  const toggleCheck = (stepId: string) => {
    const cur = thtCfg.checkedSteps || [];
    const next = cur.includes(stepId) ? cur.filter((s) => s !== stepId) : [...cur, stepId];
    setActive({ ...active, payload: { ...thtCfg, checkedSteps: next } });
  };

  const filteredEntries = entries.filter((e) => {
    if (filterType !== "all" && e.exp_type !== filterType) return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.notes_md || "").toLowerCase().includes(q) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const waterCount = Object.values(plateMap).filter((w) => w.category === "water").length;
  const readCount = Object.values(plateMap).filter((w) => w.read).length;

  const BENCH_STEPS = [
    {
      id: "s1",
      text:
        thtCfg.edgeBarrier === "none"
          ? "Confirm plate orientation (A1 top-left) before pipetting."
          : `Fill ${waterCount} evaporation-barrier wells (${thtCfg.edgeBarrier === "corners" ? "A1, A12, H1, H12" : "entire perimeter"}) with 200 uL Milli-Q water BEFORE adding peptides.`,
    },
    {
      id: "s2",
      text: `Prepare Master Mixes M1–M${thtCfg.conditions.length} in exact order: 1) ${thtCfg.bufferName} buffer -> 2) ThT -> 3) ${thtCfg.chaperoneName} -> 4) ${thtCfg.peptideName} LAST (keeps t=0 synchronized).`,
    },
    { id: "s3", text: "Gently mix each master mix by pipetting up & down 3–5 times (avoid vortexing proteins/fibrils)." },
    { id: "s4", text: "Short 2–3s spin-down in mini-centrifuge ONLY if droplets remain on walls/caps. Do NOT spin long or at high RPM if fibrils/aggregates are already present." },
    { id: "s5", text: `Dispense ${thtCfg.wellVolumeUl} uL per well into ${readCount} experimental wells; check visually for bubbles.` },
    { id: "s6", text: "Seal/cover plate and start BioTek Synergy H1 kinetic read immediately (exclude H2O barrier wells)." },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Sidebar: Private Entries */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#1A73E8]" />
              <span className="font-display font-semibold text-sm">Private Notebook</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8]">
              y-kuz only
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleNewEntry("tht_96")}
              className="px-2.5 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 96-Well ThT
            </button>
            <button
              onClick={() => handleNewEntry("sds_page")}
              className="px-2.5 py-2 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] text-xs font-medium inline-flex items-center justify-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" /> SDS-PAGE
            </button>
            <button
              onClick={() => handleNewEntry("purification")}
              className="px-2.5 py-2 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] text-xs font-medium inline-flex items-center justify-center gap-1"
            >
              <Beaker className="w-3.5 h-3.5" /> Purif / Expr
            </button>
            <button
              onClick={() => handleNewEntry("note")}
              className="px-2.5 py-2 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] text-xs font-medium inline-flex items-center justify-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" /> Lab Note
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#5F6368] absolute left-3 top-2.5" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search experiments..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              ["all", "All"],
              ["tht_96", "ThT"],
              ["sds_page", "SDS"],
              ["purification", "Purif"],
              ["note", "Notes"],
            ].map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setFilterType(k)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  filterType === k
                    ? "bg-[#1A73E8] text-white"
                    : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#5F6368]"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-[#5F6368]">
                <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Loading entries...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#5F6368]">
                No saved entries yet. Edit the template on the right and click Save!
              </div>
            ) : (
              filteredEntries.map((ent) => (
                <div
                  key={ent.id}
                  onClick={() => setActive(ent)}
                  className={`p-2.5 rounded-2xl cursor-pointer border transition flex items-start justify-between gap-2 ${
                    active.id === ent.id
                      ? "bg-[#E8F0FE]/70 dark:bg-[#0842A0]/30 border-[#1A73E8]/50"
                      : "bg-[#F8FAFD] dark:bg-[#242628] border-transparent hover:border-[#DADCE0]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{ent.title}</div>
                    <div className="text-[10px] text-[#5F6368] mt-0.5">
                      {ent.entry_date} · {ent.exp_type.replace("_", " ")}
                    </div>
                  </div>
                  {ent.id && (
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        void handleDelete(ent.id);
                      }}
                      className="p-1 rounded-lg hover:bg-[#FCE8E6] text-[#5F6368] hover:text-[#C5221F]"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="lg:col-span-9 space-y-5">
        {/* Top Entry Header */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] flex flex-wrap items-center gap-2.5">
              <input
                type="date"
                value={active.entry_date}
                onChange={(e) => setActive({ ...active, entry_date: e.target.value })}
                className="px-3 py-1.5 rounded-full text-xs bg-[#F0F4F9] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
              />
              <input
                value={active.title}
                onChange={(e) => setActive({ ...active, title: e.target.value })}
                placeholder="Experiment title..."
                className="flex-1 min-w-[220px] px-4 py-1.5 rounded-full text-sm font-semibold bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCloneActive}
                className="px-3.5 py-2 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Clone & Tweak
              </button>
              {active.exp_type === "tht_96" && (
                <button
                  onClick={exportSynergyCsv}
                  className="px-3.5 py-2 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333] hover:bg-[#CEEAD6] inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Synergy H1 CSV
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {active.id ? "Update Entry" : "Save Entry"}
              </button>
            </div>
          </div>

          {toast && (
            <div className="px-3.5 py-2 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] text-xs font-medium">
              {toast}
            </div>
          )}
        </div>

        {/* 1. 96-WELL THT PLATE & MASTER MIX PLANNER */}
        {active.exp_type === "tht_96" && (
          <>
            {/* Stocks & Plate Parameters */}
            <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1A73E8]" />
                  Stocks & 96-Well Setup (BioTek Synergy H1)
                </h3>
                <span className="text-xs text-[#5F6368]">
                  {readCount} assay wells · {waterCount} H₂O barrier wells · {thtCfg.wellVolumeUl} µL/well
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Peptide Name</label>
                  <input
                    value={thtCfg.peptideName}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, peptideName: e.target.value } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Peptide Stock (µM)</label>
                  <input
                    type="number"
                    value={thtCfg.peptideStockUm}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, peptideStockUm: Number(e.target.value) } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Chaperone / Additive</label>
                  <input
                    value={thtCfg.chaperoneName}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, chaperoneName: e.target.value } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Chaperone Stock (µM)</label>
                  <input
                    type="number"
                    value={thtCfg.chaperoneStockUm}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, chaperoneStockUm: Number(e.target.value) } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">ThT Stock (µM)</label>
                  <input
                    type="number"
                    value={thtCfg.thtStockUm}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, thtStockUm: Number(e.target.value) } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Buffer</label>
                  <input
                    value={thtCfg.bufferName}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, bufferName: e.target.value } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Well Vol (µL)</label>
                  <input
                    type="number"
                    value={thtCfg.wellVolumeUl}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, wellVolumeUl: Number(e.target.value) } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Dead Vol Overage (%)</label>
                  <input
                    type="number"
                    value={thtCfg.overagePct}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, overagePct: Number(e.target.value) } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Edge H₂O Barrier</label>
                  <select
                    value={thtCfg.edgeBarrier}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, edgeBarrier: e.target.value as any } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  >
                    <option value="corners">4 Corners (A1,A12,H1,H12)</option>
                    <option value="perimeter">Full Perimeter (36 wells)</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 pt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={thtCfg.avoidEdges}
                    onChange={(e) => setActive({ ...active, payload: { ...thtCfg, avoidEdges: e.target.checked } })}
                    className="accent-[#1A73E8]"
                  />
                  <span>Keep reactions inside B2–G11</span>
                </label>
              </div>

              {/* Conditions Editor */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                    Conditions & Controls
                  </span>
                  <button
                    onClick={() => {
                      const nextIdx = thtCfg.conditions.length + 1;
                      const next: ThTCondition = {
                        id: `c_${Date.now()}`,
                        mixId: `M${nextIdx}`,
                        name: `Condition ${nextIdx}`,
                        category: "reaction",
                        mode: "ratio",
                        value: 20,
                        peptideUm: 100,
                        thtUm: 20,
                        replicates: 3,
                      };
                      setActive({ ...active, payload: { ...thtCfg, conditions: [...thtCfg.conditions, next] } });
                    }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1A73E8] hover:bg-[#D2E3FC] inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Condition
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="text-left text-[10px] uppercase text-[#5F6368] border-b border-[#E3E8EF] dark:border-[#333537]">
                        <th className="py-1.5 pr-2">Mix</th>
                        <th className="py-1.5 pr-2">Label</th>
                        <th className="py-1.5 pr-2">Type</th>
                        <th className="py-1.5 pr-2">Mode</th>
                        <th className="py-1.5 pr-2">1:X / µM</th>
                        <th className="py-1.5 pr-2">Peptide (µM)</th>
                        <th className="py-1.5 pr-2">ThT (µM)</th>
                        <th className="py-1.5 pr-2">Reps</th>
                        <th className="py-1.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F4F9] dark:divide-[#2C2D2E]">
                      {thtCfg.conditions.map((cond, idx) => (
                        <tr key={cond.id}>
                          <td className="py-1.5 pr-2 w-14">
                            <input
                              value={cond.mixId}
                              onChange={(e) => {
                                const arr = [...thtCfg.conditions];
                                arr[idx] = { ...cond, mixId: e.target.value };
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="w-12 px-2 py-1 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] font-mono"
                            />
                          </td>
                          <td className="py-1.5 pr-2 min-w-[160px]">
                            <input
                              value={cond.name}
                              onChange={(e) => {
                                const arr = [...thtCfg.conditions];
                                arr[idx] = { ...cond, name: e.target.value };
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="w-full px-2 py-1 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <select
                              value={cond.category}
                              onChange={(e) => {
                                const arr = [...thtCfg.conditions];
                                arr[idx] = { ...cond, category: e.target.value as any };
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="px-2 py-1 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                            >
                              <option value="reaction">Reaction</option>
                              <option value="chaperone_ctrl">Chaperone Ctrl</option>
                              <option value="fibril_ctrl">Fibril Ctrl</option>
                              <option value="blank">Blank</option>
                            </select>
                          </td>
                          <td className="py-1.5 pr-2">
                            <select
                              value={cond.mode}
                              onChange={(e) => {
                                const arr = [...thtCfg.conditions];
                                arr[idx] = { ...cond, mode: e.target.value as any };
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="px-2 py-1 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                            >
                              <option value="ratio">Ratio (1:X)</option>
                              <option value="direct">Direct µM</option>
                            </select>
                          </td>
                          <td className="py-1.5 pr-2 w-20">
                            <input
                              type="number"
                              value={cond.value}
                              onChange={(e) => {
                                const arr = [...thtCfg.conditions];
                                arr[idx] = { ...cond, value: Number(e.target.value) };
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="w-16 px-2 py-1 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                            />
                          </td>
                          <td className="py-1.5 pr-2 w-20">
                            <input
                              type="number"
                              value={cond.peptideUm}
                              onChange={(e) => {
                                const arr = [...thtCfg.conditions];
                                arr[idx] = { ...cond, peptideUm: Number(e.target.value) };
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="w-16 px-2 py-1 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                            />
                          </td>
                          <td className="py-1.5 pr-2 w-20">
                            <input
                              type="number"
                              value={cond.thtUm}
                              onChange={(e) => {
                                const arr = [...thtCfg.conditions];
                                arr[idx] = { ...cond, thtUm: Number(e.target.value) };
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="w-16 px-2 py-1 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                            />
                          </td>
                          <td className="py-1.5 pr-2 w-16">
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={cond.replicates}
                              onChange={(e) => {
                                const arr = [...thtCfg.conditions];
                                arr[idx] = { ...cond, replicates: Number(e.target.value) };
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="w-14 px-2 py-1 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                            />
                          </td>
                          <td className="py-1.5">
                            <button
                              onClick={() => {
                                const arr = thtCfg.conditions.filter((_, i) => i !== idx);
                                setActive({ ...active, payload: { ...thtCfg, conditions: arr } });
                              }}
                              className="p-1 text-[#5F6368] hover:text-[#C5221F]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Interactive 96-Well Plate Map */}
            <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display font-semibold text-sm">Virtual 96-Well Plate Map</h3>
                <div className="flex flex-wrap gap-2 text-[10px] font-medium">
                  <span className="px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#0842A0]">Reaction</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#0D652D]">Chaperone Ctrl</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF7E0] text-[#7A4F01]">Fibril Ctrl</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F3E8FD] text-[#5E2CA5]">Blank</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1]">H₂O Barrier (Do Not Read)</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[660px] space-y-1">
                  <div
                    className="grid gap-1 text-[10px] font-semibold text-[#5F6368] text-center"
                    style={{ gridTemplateColumns: "28px repeat(12, minmax(0, 1fr))" }}
                  >
                    <div />
                    {COLS.map((c) => (
                      <div key={c}>{c}</div>
                    ))}
                  </div>
                  {ROWS.map((r) => (
                    <div
                      key={r}
                      className="grid gap-1 items-center"
                      style={{ gridTemplateColumns: "28px repeat(12, minmax(0, 1fr))" }}
                    >
                      <div className="text-[11px] font-semibold text-[#5F6368] text-center">{r}</div>
                      {COLS.map((c) => {
                        const w = `${r}${c}`;
                        const assign = plateMap[w];
                        return (
                          <button
                            key={w}
                            type="button"
                            onMouseEnter={() => setHoveredWell(assign || null)}
                            onClick={() => setHoveredWell(assign || null)}
                            title={assign ? `${w}: ${assign.label}` : `${w}: Empty`}
                            className={`h-9 rounded-xl border text-[10px] font-semibold flex flex-col items-center justify-center transition ${
                              assign
                                ? CATEGORY_STYLE[assign.category]
                                : "bg-[#F8FAFD] dark:bg-[#242628] border-[#E3E8EF] dark:border-[#333537] text-[#9AA0A6]"
                            }`}
                          >
                            <span>{assign ? assign.mixId : "·"}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {hoveredWell && (
                <div className="px-3.5 py-2 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] text-xs flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>{hoveredWell.well}</strong> · {hoveredWell.label} ({hoveredWell.mixId})
                  </span>
                  <span className="text-[#5F6368]">
                    {hoveredWell.read
                      ? `${thtCfg.peptideName}: ${hoveredWell.peptideUm} µM · ${thtCfg.chaperoneName}: ${hoveredWell.chaperoneUm} µM · ThT: ${hoveredWell.thtUm} µM`
                      : "Evaporation barrier (200 µL Milli-Q) — exclude from Synergy H1 read"}
                  </span>
                </div>
              )}
            </div>

            {/* Master Mix Recipe & Pipetting Order */}
            <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display font-semibold text-sm">
                  Master Mix Calculator (Order: 1. Buffer → 2. ThT → 3. {thtCfg.chaperoneName} → 4. {thtCfg.peptideName} LAST)
                </h3>
                <span className="text-[11px] text-[#5F6368]">Includes +{thtCfg.overagePct}% dead-volume overage</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-left text-[10px] uppercase text-[#5F6368] border-b border-[#E3E8EF] dark:border-[#333537]">
                      <th className="py-2 pr-2">Mix</th>
                      <th className="py-2 pr-2">Wells</th>
                      <th className="py-2 pr-2">Condition</th>
                      <th className="py-2 pr-2">Total (µL)</th>
                      <th className="py-2 pr-2">1. {thtCfg.bufferName} (µL)</th>
                      <th className="py-2 pr-2">2. ThT (µL)</th>
                      <th className="py-2 pr-2">3. {thtCfg.chaperoneName} (µL)</th>
                      <th className="py-2 pr-2">4. {thtCfg.peptideName} (µL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F9] dark:divide-[#2C2D2E]">
                    {masterMixRows.map((m) => (
                      <tr key={m.cond.id} className={m.lowVol ? "bg-[#FEF7E0]/45 dark:bg-[#7A4F01]/15" : ""}>
                        <td className="py-2 pr-2 font-mono font-semibold text-[#1A73E8]">{m.cond.mixId}</td>
                        <td className="py-2 pr-2 font-mono">{m.wellsRange}</td>
                        <td className="py-2 pr-2 font-medium">{m.cond.name}</td>
                        <td className="py-2 pr-2 font-semibold">{m.totalUl}</td>
                        <td className="py-2 pr-2">{m.bufUl}</td>
                        <td className="py-2 pr-2">{m.thtUl}</td>
                        <td className="py-2 pr-2">
                          {m.chapUl}{" "}
                          <span className="text-[10px] text-[#5F6368]">({m.chapUm} µM)</span>
                        </td>
                        <td className="py-2 pr-2 font-semibold">{m.pepUl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {benchAudit.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#FEF7E0] dark:bg-[#7A4F01]/30 border border-[#F9AB00]/40 space-y-1">
                  <div className="text-xs font-semibold text-[#B06000] dark:text-[#FDE293] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Plate Audit Warnings
                  </div>
                  {benchAudit.map((w, i) => (
                    <div key={i} className="text-xs text-[#7A4F01] dark:text-[#FDE293]">
                      • {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bench Checklist */}
            <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-2.5">
              <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#137333]" />
                Bench Execution Checklist
              </h3>
              {BENCH_STEPS.map((st) => {
                const done = (thtCfg.checkedSteps || []).includes(st.id);
                return (
                  <label
                    key={st.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-2xl cursor-pointer text-xs transition ${
                      done
                        ? "bg-[#E6F4EA]/60 dark:bg-[#0D652D]/25 line-through text-[#5F6368]"
                        : "bg-[#F8FAFD] dark:bg-[#242628]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleCheck(st.id)}
                      className="mt-0.5 accent-[#137333]"
                    />
                    <span>{st.text}</span>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {/* 2. SDS-PAGE PLANNER */}
        {active.exp_type === "sds_page" && (
          <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-4">
            <h3 className="font-display font-semibold text-sm">SDS-PAGE Gel & Lane Layout</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Gel %</label>
                <input
                  value={sdsCfg.gelPct}
                  onChange={(e) => setActive({ ...active, payload: { ...sdsCfg, gelPct: e.target.value } })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Buffer</label>
                <input
                  value={sdsCfg.runningBuffer}
                  onChange={(e) => setActive({ ...active, payload: { ...sdsCfg, runningBuffer: e.target.value } })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Voltage / Time</label>
                <input
                  value={sdsCfg.voltageTime}
                  onChange={(e) => setActive({ ...active, payload: { ...sdsCfg, voltageTime: e.target.value } })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Loading Dye</label>
                <select
                  value={sdsCfg.loadingDye}
                  onChange={(e) => setActive({ ...active, payload: { ...sdsCfg, loadingDye: e.target.value as any } })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                >
                  <option value="4x">4x Laemmli</option>
                  <option value="5x">5x Laemmli</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">Denaturation</label>
                <input
                  value={sdsCfg.boilInfo}
                  onChange={(e) => setActive({ ...active, payload: { ...sdsCfg, boilInfo: e.target.value } })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase text-[#5F6368]">Gel Lanes</span>
                <button
                  onClick={() =>
                    setActive({
                      ...active,
                      payload: {
                        ...sdsCfg,
                        lanes: [
                          ...sdsCfg.lanes,
                          { lane: sdsCfg.lanes.length + 1, sample: "", sampleUl: 15, bufferUl: 5, notes: "" },
                        ],
                      },
                    })
                  }
                  className="px-3 py-1 rounded-full text-xs bg-[#E8F0FE] text-[#1A73E8] inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Lane
                </button>
              </div>
              {sdsCfg.lanes.map((ln, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-1 font-mono font-semibold text-center">L{ln.lane}</div>
                  <input
                    value={ln.sample}
                    placeholder="Sample"
                    onChange={(e) => {
                      const arr = [...sdsCfg.lanes];
                      arr[idx] = { ...ln, sample: e.target.value };
                      setActive({ ...active, payload: { ...sdsCfg, lanes: arr } });
                    }}
                    className="col-span-5 px-2.5 py-1.5 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                  <input
                    type="number"
                    value={ln.sampleUl}
                    title="Sample uL"
                    onChange={(e) => {
                      const arr = [...sdsCfg.lanes];
                      arr[idx] = { ...ln, sampleUl: Number(e.target.value) };
                      setActive({ ...active, payload: { ...sdsCfg, lanes: arr } });
                    }}
                    className="col-span-2 px-2 py-1.5 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                  <input
                    type="number"
                    value={ln.bufferUl}
                    title="Dye uL"
                    onChange={(e) => {
                      const arr = [...sdsCfg.lanes];
                      arr[idx] = { ...ln, bufferUl: Number(e.target.value) };
                      setActive({ ...active, payload: { ...sdsCfg, lanes: arr } });
                    }}
                    className="col-span-2 px-2 py-1.5 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                  <input
                    value={ln.notes}
                    placeholder="Notes"
                    onChange={(e) => {
                      const arr = [...sdsCfg.lanes];
                      arr[idx] = { ...ln, notes: e.target.value };
                      setActive({ ...active, payload: { ...sdsCfg, lanes: arr } });
                    }}
                    className="col-span-2 px-2 py-1.5 rounded-lg bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. EXPRESSION & PURIFICATION */}
        {active.exp_type === "purification" && (
          <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-3">
            <h3 className="font-display font-semibold text-sm">Protein Expression & Purification Record</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                ["construct", "Construct / Plasmid"],
                ["host", "Host Strain"],
                ["media", "Media & Antibiotic"],
                ["od600", "OD600 at Induction"],
                ["inducer", "Inducer (IPTG / Arabinose)"],
                ["tempTime", "Expression Temp & Time"],
                ["lysisBuffer", "Lysis Buffer"],
                ["washElution", "Wash / Elution Buffers"],
                ["columnResin", "Columns / SEC"],
                ["yieldResult", "Final Yield (mg/L) & A280"],
              ].map(([k, lbl]) => (
                <div key={k}>
                  <label className="block text-[10px] font-semibold uppercase text-[#5F6368] mb-1">{lbl}</label>
                  <input
                    value={(purifCfg as any)[k] || ""}
                    onChange={(e) => setActive({ ...active, payload: { ...purifCfg, [k]: e.target.value } })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Linked Papers */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5F6368] mb-1.5">
              Bench Observations, Bubbles, t₁/₂ & Next Steps
            </label>
            <textarea
              rows={4}
              value={active.notes_md}
              onChange={(e) => setActive({ ...active, notes_md: e.target.value })}
              placeholder="e.g., B6 had a micro-bubble; LCN1 1:10 extended lag phase ~2x on Synergy H1..."
              className="w-full p-3.5 rounded-2xl text-xs sm:text-sm bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
                Linked Literature ({active.linked_papers.length})
              </span>
              {selectedPapers.length > 0 && (
                <button
                  onClick={() => {
                    const existing = new Set(active.linked_papers.map((p) => p.url));
                    const merged = [...active.linked_papers];
                    selectedPapers.forEach((p) => {
                      if (!existing.has(p.url)) merged.push(p);
                    });
                    setActive({ ...active, linked_papers: merged });
                    flash(`Attached ${selectedPapers.length} selected paper(s).`);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1A73E8] hover:bg-[#D2E3FC] inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Attach {selectedPapers.length} Selected Paper(s)
                </button>
              )}
            </div>
            {active.linked_papers.length > 0 && (
              <div className="space-y-1.5">
                {active.linked_papers.map((p, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-xl bg-[#F8FAFD] dark:bg-[#242628] flex items-center justify-between gap-2 text-xs"
                  >
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#1A73E8] hover:underline truncate inline-flex items-center gap-1"
                    >
                      {p.title} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <button
                      onClick={() =>
                        setActive({
                          ...active,
                          linked_papers: active.linked_papers.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-[#5F6368] hover:text-[#C5221F]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
