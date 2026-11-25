export interface UserPreferences {
  personal_interests: string;
  lab_interests: string;
  scoring_mode: "personal" | "lab";
  summary_language: "en" | "ru" | "bilingual";
  summary_detail: "concise" | "quantitative";
  default_source_mode: string;
  default_max_results: number;
  auto_draft_omni: boolean;
  hide_seen_default: boolean;
  default_zotero_destination: string;
  tracked_pis: string;
  openathens_proxy: string;
}

export interface UserBundle {
  account_id: number;
  username: string;
  display_name: string;
  email: string;
  is_admin: boolean;
  linked_telegram_id: number | null;
  effective_user_id: number;
  delivery_time: string;
  timezone: string;
  research_fields: string[];
  projects_count: number;
  zotero_connected: boolean;
  zotero_library_type: string;
  zotero_library_id: string;
  zotero_collection_id: string;
  synced_tags_count: number;
  bot_username: string;
  preferences?: UserPreferences;
}

export interface PaperItem {
  title: string;
  url: string;
  doi?: string;
  source?: string;
  venue?: string;
  authors?: string;
  date?: string;
  year?: number | string;
  domain?: string;
  badge?: string;
  score3?: number;
  tags?: string[];
  summary?: string;
  relevance?: string;
  caveat?: string;
  abstract?: string;
  snippet?: string;
  pdf_url?: string;
  pdf_label?: string;
  ntu_openathens_url?: string;
  pubpeer_url?: string;
  has_retraction?: boolean;
  has_erratum?: boolean;
  integrity_warning?: string;
  citation_count?: number;
  vip_labs?: string[];
  revision?: string;
  structure_id?: string;
  is_seen?: boolean;
  project?: string;
}

export interface MatrixRow {
  paper_label: string;
  title: string;
  url: string;
  target_construct: string;
  methods: string;
  quantitative_metrics: string;
  conditions: string;
  core_finding: string;
  caveat: string;
}

export interface ComparisonMatrixResult {
  rows: MatrixRow[];
  consensus_synthesis: string;
  recommended_bench_action: string;
  csv: string;
  markdown: string;
  bibtex: string;
}

export interface GraphNode {
  id: string;
  label: string;
  title: string;
  authors: string;
  year: number | string;
  citations: number;
  venue: string;
  doi: string;
  url: string;
  pdf_url?: string;
  abstract?: string;
  role: "seed" | "citing" | "reference";
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "cites" | "references" | "related";
}

export interface CitationGraphResult {
  seed: GraphNode | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  provider: string;
  error?: string;
}

export interface StructurePreset {
  id: string;
  type: "pdb" | "alphafold";
  label: string;
  target: string;
}

export interface StructureDetails {
  id?: string;
  kind?: "pdb" | "alphafold";
  title?: string;
  method?: string;
  resolution?: string;
  release_date?: string;
  journal?: string;
  doi?: string;
  atom_count?: number;
  cif_url?: string;
  pdb_url?: string;
  rcsb_web_url?: string;
  molstar_embed_url?: string;
  pymol_cmd?: string;
  chimerax_cmd?: string;
  presets?: StructurePreset[];
  error?: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  keywords: string;
  target_authors: string;
  priority_hubs: string;
  focus: string;
  created_at?: string;
}

const STORAGE_TOKEN_KEY = "bq_jwt_token";
const STORAGE_API_KEY = "bq_api_base_url";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const custom = window.localStorage.getItem(STORAGE_API_KEY);
    if (
      custom &&
      custom.trim() &&
      custom.trim() !== "http://localhost:8000"
    ) {
      return custom.trim().replace(/\/+$/, "");
    }
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://127.0.0.1:8765";
    }
  }
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://127.0.0.1:8765"
  );
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== "undefined") {
    if (!url.trim()) {
      window.localStorage.removeItem(STORAGE_API_KEY);
    } else {
      window.localStorage.setItem(STORAGE_API_KEY, url.trim().replace(/\/+$/, ""));
    }
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(STORAGE_TOKEN_KEY);
  } else {
    window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errDetail = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      errDetail = data.detail || data.error || errDetail;
    } catch {
      // ignore json parse error
    }
    throw new Error(errDetail);
  }
  return res.json();
}

export function mediaUrl(filename: string): string {
  return `${getApiBaseUrl()}/api/media/${encodeURIComponent(filename)}`;
}
