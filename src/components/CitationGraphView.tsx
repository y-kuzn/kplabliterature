"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  ExternalLink,
  GitFork,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { apiFetch, CitationGraphResult, GraphNode, PaperItem } from "@/lib/api";

interface Props {
  identifier: string;
  title: string;
  onSavePaper?: (paper: PaperItem) => void;
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  r: number;
}

export default function CitationGraphView({ identifier, title, onSavePaper }: Props) {
  const [seedQuery, setSeedQuery] = useState({ identifier, title });
  const [graph, setGraph] = useState<CitationGraphResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    setSeedQuery({ identifier, title });
  }, [identifier, title]);

  useEffect(() => {
    let cancelled = false;
    async function loadGraph() {
      if (!seedQuery.identifier && !seedQuery.title) return;
      setLoading(true);
      try {
        const res = await apiFetch<CitationGraphResult>("/api/methods/citation-graph", {
          method: "POST",
          body: JSON.stringify(seedQuery),
        });
        if (!cancelled) {
          setGraph(res);
          setSelectedNode(res.seed || res.nodes[0] || null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setGraph({ seed: null, nodes: [], edges: [], provider: "Graph", error: e.message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGraph();
    return () => {
      cancelled = true;
    };
  }, [seedQuery]);

  const positioned = useMemo(() => {
    if (!graph || !graph.nodes.length) return { nodes: [] as PositionedNode[], map: new Map<string, PositionedNode>() };
    const W = 760;
    const H = 420;
    const cx = W / 2;
    const cy = H / 2;

    const refs = graph.nodes.filter((n) => n.role === "reference");
    const citing = graph.nodes.filter((n) => n.role === "citing");
    const out: PositionedNode[] = [];

    for (const n of graph.nodes) {
      if (n.role === "seed") {
        out.push({ ...n, x: cx, y: cy, r: 24 });
      }
    }

    // Left arc: foundational references
    refs.forEach((n, idx) => {
      const count = Math.max(1, refs.length);
      const angle = Math.PI * 0.62 + (idx / Math.max(1, count - 1 || 1)) * Math.PI * 0.76;
      const radX = 245 + (idx % 2) * 38;
      const radY = 155;
      const r = Math.min(20, Math.max(11, 10 + Math.log10((n.citations || 1) + 1) * 3.2));
      out.push({
        ...n,
        x: cx + Math.cos(angle) * radX,
        y: cy + Math.sin(angle) * radY,
        r,
      });
    });

    // Right arc: newer forward citing papers
    citing.forEach((n, idx) => {
      const count = Math.max(1, citing.length);
      const angle = -Math.PI * 0.38 + (idx / Math.max(1, count - 1 || 1)) * Math.PI * 0.76;
      const radX = 245 + (idx % 2) * 38;
      const radY = 155;
      const r = Math.min(20, Math.max(11, 10 + Math.log10((n.citations || 1) + 1) * 3.2));
      out.push({
        ...n,
        x: cx + Math.cos(angle) * radX,
        y: cy + Math.sin(angle) * radY,
        r,
      });
    });

    const map = new Map<string, PositionedNode>();
    out.forEach((p) => map.set(p.id, p));
    return { nodes: out, map };
  }, [graph]);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-3 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
        <Loader2 className="w-7 h-7 animate-spin text-[#1A73E8]" />
        <span>Mapping foundational references & forward citations...</span>
      </div>
    );
  }

  if (!graph || graph.error || positioned.nodes.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] text-sm text-[#444746] dark:text-[#C4C7C5]">
        {graph?.error || "No citation graph available for this item yet."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
            <span className="w-3 h-3 rounded-full bg-[#1A73E8] inline-block" /> Seed Paper
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#444746] dark:text-[#C4C7C5]">
            <span className="w-3 h-3 rounded-full bg-[#7C3AED] inline-block" /> Prior References
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#444746] dark:text-[#C4C7C5]">
            <span className="w-3 h-3 rounded-full bg-[#188038] inline-block" /> Citing Studies
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#F0F4F9] dark:bg-[#282A2C] text-[#5F6368] dark:text-[#9AA0A6]">
          {graph.provider} · {positioned.nodes.length} nodes
        </span>
      </div>

      {/* Interactive SVG Connected-Papers Canvas */}
      <div className="rounded-2xl border border-[#E3E8EF] dark:border-[#333537] bg-[#F8FAFD] dark:bg-[#18191A] overflow-hidden">
        <svg viewBox="0 0 760 420" className="w-full h-auto select-none">
          <defs>
            <radialGradient id="seedGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1A73E8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#1A73E8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle column hints */}
          <text x="84" y="26" className="fill-[#747775] text-[11px] font-medium">
            ← Foundational References
          </text>
          <text x="565" y="26" className="fill-[#747775] text-[11px] font-medium">
            Forward Citations →
          </text>

          {/* Edges */}
          {graph.edges.map((e, i) => {
            const s = positioned.map.get(e.source);
            const t = positioned.map.get(e.target);
            if (!s || !t) return null;
            const isActive =
              selectedNode && (selectedNode.id === s.id || selectedNode.id === t.id);
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2 - (e.type === "related" ? 24 : 10);
            return (
              <path
                key={i}
                d={`M ${s.x} ${s.y} Q ${mx} ${my} ${t.x} ${t.y}`}
                fill="none"
                stroke={
                  isActive
                    ? "#1A73E8"
                    : e.type === "related"
                    ? "#CBD5E1"
                    : "#94A3B8"
                }
                strokeWidth={isActive ? 2.2 : 1.2}
                strokeDasharray={e.type === "related" ? "4 4" : undefined}
                opacity={isActive ? 0.95 : 0.45}
              />
            );
          })}

          {/* Nodes */}
          {positioned.nodes.map((n) => {
            const isSelected = selectedNode?.id === n.id;
            const fill =
              n.role === "seed"
                ? "#1A73E8"
                : n.role === "citing"
                ? "#188038"
                : "#7C3AED";
            return (
              <g
                key={n.id}
                onClick={() => setSelectedNode(n)}
                className="cursor-pointer transition-transform"
              >
                {n.role === "seed" && (
                  <circle cx={n.x} cy={n.y} r={n.r + 18} fill="url(#seedGlow)" />
                )}
                {isSelected && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + 5}
                    fill="none"
                    stroke={fill}
                    strokeWidth={2.5}
                    opacity={0.7}
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill={fill}
                  fillOpacity={n.role === "seed" ? 1 : 0.88}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <text
                  x={n.x}
                  y={n.y + n.r + 13}
                  textAnchor="middle"
                  className="fill-[#1F1F1F] dark:fill-[#E3E3E3] text-[10.5px] font-medium"
                >
                  {n.label.slice(0, 18)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Inspector Card */}
      {selectedNode && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedNode.role === "seed"
                  ? "bg-[#E8F0FE] text-[#1967D2]"
                  : selectedNode.role === "citing"
                  ? "bg-[#E6F4EA] text-[#137333]"
                  : "bg-[#F3E8FD] text-[#7C3AED]"
              }`}
            >
              {selectedNode.role === "seed"
                ? "Seed Paper"
                : selectedNode.role === "citing"
                ? "Cites Seed Paper"
                : "Referenced by Seed"}
            </span>
            <span className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
              {selectedNode.venue} {selectedNode.year ? `· ${selectedNode.year}` : ""} · Cited by{" "}
              <strong>{selectedNode.citations}</strong>
            </span>
          </div>

          <h4 className="font-display font-semibold text-sm text-[#1F1F1F] dark:text-[#E3E3E3]">
            {selectedNode.title}
          </h4>
          {selectedNode.authors && (
            <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">{selectedNode.authors}</p>
          )}
          {selectedNode.abstract && (
            <p className="text-xs text-[#444746] dark:text-[#C4C7C5] line-clamp-3 leading-relaxed">
              {selectedNode.abstract}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-2">
            {selectedNode.url && (
              <a
                href={selectedNode.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E3E8EF] inline-flex items-center gap-1"
              >
                Open Source <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {selectedNode.role !== "seed" && (
              <button
                onClick={() =>
                  setSeedQuery({
                    identifier: selectedNode.doi || selectedNode.url || "",
                    title: selectedNode.title,
                  })
                }
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1967D2] hover:opacity-90 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recenter Graph Here
              </button>
            )}
            {onSavePaper && (
              <button
                onClick={() =>
                  onSavePaper({
                    title: selectedNode.title,
                    url: selectedNode.url,
                    doi: selectedNode.doi,
                    authors: selectedNode.authors,
                    source: selectedNode.venue,
                    year: selectedNode.year,
                    summary: selectedNode.abstract || `Discovered via Citation Graph (${selectedNode.citations} citations).`,
                    score3: 2,
                  })
                }
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1A73E8] text-white hover:bg-[#1557B0] inline-flex items-center gap-1"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Save to Zotero
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
