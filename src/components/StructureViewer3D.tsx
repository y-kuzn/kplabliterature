"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Copy,
  Check,
  Download,
  ExternalLink,
  Loader2,
  RotateCcw,
  Sparkles,
  Play,
  Pause,
} from "lucide-react";
import { apiFetch, StructureDetails, StructurePreset } from "@/lib/api";

declare global {
  interface Window {
    $3Dmol?: any;
  }
}

interface Props {
  initialId?: string;
  compact?: boolean;
}

export default function StructureViewer3D({ initialId = "6XYO", compact = false }: Props) {
  const [queryId, setQueryId] = useState(initialId);
  const [activeId, setActiveId] = useState(initialId);
  const [details, setDetails] = useState<StructureDetails | null>(null);
  const [presets, setPresets] = useState<StructurePreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [repr, setRepr] = useState<"cartoon" | "stick" | "surface">("cartoon");
  const [coloring, setColoring] = useState<"spectrum" | "chain" | "bfactor">("spectrum");
  const [spinning, setSpinning] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  // Load 3Dmol.js WebGL library once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.$3Dmol) {
      setScriptReady(true);
      return;
    }
    const existing = document.getElementById("3dmol-script");
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true));
      return;
    }
    const s = document.createElement("script");
    s.id = "3dmol-script";
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.4.2/3Dmol-min.js";
    s.async = true;
    s.onload = () => setScriptReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (initialId && initialId !== activeId) {
      setQueryId(initialId);
      setActiveId(initialId);
    }
  }, [initialId]);

  // Fetch metadata from our unified FastAPI backend
  useEffect(() => {
    let cancelled = false;
    async function loadMeta() {
      setLoading(true);
      try {
        const res = await apiFetch<StructureDetails>(
          `/api/methods/structure/${encodeURIComponent(activeId)}`
        );
        if (!cancelled) {
          setDetails(res);
          if (res.presets) setPresets(res.presets);
          if (res.kind === "alphafold") {
            setColoring("bfactor");
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setDetails({ error: e.message || "Failed to fetch structure metadata" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Render 3D coordinates into WebGL canvas
  useEffect(() => {
    if (!scriptReady || !containerRef.current || !details || details.error) return;
    const coordUrl = details.pdb_url || details.cif_url;
    const format = details.pdb_url ? "pdb" : "cif";
    if (!coordUrl || !window.$3Dmol) return;

    let cancelled = false;
    async function renderModel() {
      try {
        const r = await fetch(coordUrl!);
        if (!r.ok) throw new Error("Coordinate fetch failed");
        const dataText = await r.text();
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        const viewer = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: document.documentElement.classList.contains("dark")
            ? "#1E1F20"
            : "#F8FAFD",
          antialias: true,
        });
        viewerRef.current = viewer;
        viewer.addModel(dataText, format);
        applyStyle(viewer, repr, coloring);
        viewer.zoomTo();
        viewer.render();
        if (spinning) viewer.spin("y", 0.7);
      } catch {
        // Fallback if .pdb wasn't available (large Cryo-EM structures only have .cif!)
        if (details?.cif_url && coordUrl !== details.cif_url) {
          try {
            const rCif = await fetch(details.cif_url);
            const cifText = await rCif.text();
            if (cancelled || !containerRef.current) return;
            containerRef.current.innerHTML = "";
            const viewer = window.$3Dmol.createViewer(containerRef.current, {
              backgroundColor: document.documentElement.classList.contains("dark")
                ? "#1E1F20"
                : "#F8FAFD",
              antialias: true,
            });
            viewerRef.current = viewer;
            viewer.addModel(cifText, "cif");
            applyStyle(viewer, repr, coloring);
            viewer.zoomTo();
            viewer.render();
            if (spinning) viewer.spin("y", 0.7);
          } catch {
            // ignore
          }
        }
      }
    }
    renderModel();
    return () => {
      cancelled = true;
    };
  }, [scriptReady, details]);

  function applyStyle(
    viewer: any,
    styleMode: "cartoon" | "stick" | "surface",
    colorMode: "spectrum" | "chain" | "bfactor"
  ) {
    if (!viewer) return;
    viewer.removeAllSurfaces();
    let colorSpec: any = { color: "spectrum" };
    if (colorMode === "chain") {
      colorSpec = { colorscheme: "chainHetatm" };
    } else if (colorMode === "bfactor") {
      colorSpec = {
        colorscheme: {
          prop: "b",
          gradient: "roygb",
          min: 50,
          max: 95,
        },
      };
    }

    if (styleMode === "cartoon") {
      viewer.setStyle({}, { cartoon: { ...colorSpec, thickness: 0.35 } });
    } else if (styleMode === "stick") {
      viewer.setStyle({}, { stick: { radius: 0.16, ...colorSpec }, cartoon: { opacity: 0.35, ...colorSpec } });
    } else if (styleMode === "surface") {
      viewer.setStyle({}, { cartoon: { ...colorSpec } });
      viewer.addSurface(window.$3Dmol.SurfaceType.VDW, {
        opacity: 0.78,
        ...colorSpec,
      });
    }
    viewer.render();
  }

  useEffect(() => {
    if (viewerRef.current) {
      applyStyle(viewerRef.current, repr, coloring);
    }
  }, [repr, coloring]);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.spin(spinning ? "y" : false, 0.7);
    }
  }, [spinning]);

  const handleCopyPymol = () => {
    if (!details?.pymol_cmd) return;
    navigator.clipboard.writeText(details.pymol_cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card overflow-hidden">
      {/* Top Search & Lab Presets Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E3E8EF] dark:border-[#333537] bg-[#F8FAFD] dark:bg-[#18191A]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#E8F0FE] dark:bg-[#0842A0]/40 text-[#1A73E8] dark:text-[#A8C7FA] flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm sm:text-base text-[#1F1F1F] dark:text-[#E3E3E3]">
                Interactive 3D Structure Viewer (RCSB PDB & AlphaFold)
              </h3>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Inspect Cryo-EM fibril polymorphs, NMR ensembles & pLDDT confidence in real-time WebGL
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (queryId.trim()) setActiveId(queryId.trim().toUpperCase());
            }}
            className="flex items-center gap-2"
          >
            <input
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder="PDB (6XYO) or UniProt (P05090)"
              className="px-3.5 py-1.5 text-sm font-mono rounded-full bg-white dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8] w-56"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white transition"
            >
              Load 3D
            </button>
          </form>
        </div>

        {/* Preset Pills */}
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setQueryId(p.id);
                  setActiveId(p.id);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeId.toUpperCase() === p.id
                    ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD]"
                    : "bg-white dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] border border-[#E3E8EF] dark:border-[#3C4043] hover:bg-[#F0F4F9]"
                }`}
              >
                <span className="font-mono font-semibold mr-1">{p.id}</span> · {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metadata & Toolbar */}
      {details?.error ? (
        <div className="p-6 text-sm text-[#D93025] bg-[#FCE8E6]/60 dark:bg-[#5C1A16]/30">
          {details.error}
        </div>
      ) : (
        <>
          <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#E3E8EF] dark:border-[#333537]">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#E8F0FE] text-[#1967D2] dark:bg-[#0842A0]/50 dark:text-[#A8C7FA]">
                  {details?.id || activeId}
                </span>
                {details?.resolution && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333] dark:bg-[#0D5226]/50 dark:text-[#81C995]">
                    {details.resolution}
                  </span>
                )}
                {details?.method && (
                  <span className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                    {details.method}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate mt-1">
                {loading ? "Loading coordinates..." : details?.title}
              </p>
            </div>

            {/* Interactive Representation Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["cartoon", "stick", "surface"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRepr(mode)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
                    repr === mode
                      ? "bg-[#1A73E8] text-white"
                      : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E3E8EF]"
                  }`}
                >
                  {mode}
                </button>
              ))}
              <span className="text-[#DADCE0] dark:text-[#444746] mx-0.5">|</span>
              {(
                [
                  ["spectrum", "Rainbow"],
                  ["chain", "Chains"],
                  ["bfactor", "pLDDT / B-factor"],
                ] as const
              ).map(([cKey, cLabel]) => (
                <button
                  key={cKey}
                  onClick={() => setColoring(cKey)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    coloring === cKey
                      ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD]"
                      : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]"
                  }`}
                >
                  {cLabel}
                </button>
              ))}
              <button
                onClick={() => setSpinning((s) => !s)}
                className={`p-1.5 rounded-full text-xs transition ${
                  spinning
                    ? "bg-[#E8F0FE] text-[#1A73E8]"
                    : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]"
                }`}
                title="Toggle Spin"
              >
                {spinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  viewerRef.current?.zoomTo();
                  viewerRef.current?.render();
                }}
                className="p-1.5 rounded-full bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]"
                title="Reset Camera"
                aria-label="Reset 3D camera"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3D WebGL Stage */}
          <div className="relative w-full" style={{ height: compact ? 320 : 440 }}>
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F8FAFD]/80 dark:bg-[#1E1F20]/80">
                <Loader2 className="w-7 h-7 animate-spin text-[#1A73E8]" />
              </div>
            )}
            <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />
          </div>

          {/* Bottom Coordinate & PyMOL Action Strip */}
          <div className="px-4 sm:px-5 py-3 bg-[#F8FAFD] dark:bg-[#18191A] border-t border-[#E3E8EF] dark:border-[#333537] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-mono text-[#444746] dark:text-[#C4C7C5] bg-white dark:bg-[#282A2C] px-3 py-1.5 rounded-full border border-[#E3E8EF] dark:border-[#3C4043]">
              <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span className="truncate max-w-xs sm:max-w-md">{details?.pymol_cmd || `fetch ${activeId}`}</span>
              <button
                onClick={handleCopyPymol}
                className="ml-1 text-[#1A73E8] hover:underline inline-flex items-center gap-1"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCmd ? "Copied" : "PyMOL"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {details?.cif_url && (
                <a
                  href={details.cif_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#3C4043] hover:bg-[#F0F4F9] inline-flex items-center gap-1.5 font-medium"
                >
                  <Download className="w-3.5 h-3.5 text-[#1A73E8]" />
                  Download .cif
                </a>
              )}
              {details?.molstar_embed_url && (
                <a
                  href={details.molstar_embed_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-full bg-[#E8F0FE] dark:bg-[#0842A0]/50 text-[#1967D2] dark:text-[#A8C7FA] hover:opacity-90 inline-flex items-center gap-1.5 font-medium"
                >
                  Open Mol* <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
