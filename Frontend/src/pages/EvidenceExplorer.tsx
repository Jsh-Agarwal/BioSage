import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Search,
  Filter,
  Network,
  FileText,
  ExternalLink,
  Calendar as CalendarIcon,
  Star,
  TrendingUp,
  Eye,
  Download,
  Share2,
} from "lucide-react";

/** =========================================================
 *                   GRAPH VIEW: types + hooks
 * ========================================================= */
type UINode = { id: string; label: string; x?: number; y?: number; degree?: number };
type UIEdge = { id: string; source: string; target: string };
type UIGraph = { nodes: UINode[]; edges: UIEdge[]; meta?: { nodeCount?: number; edgeCount?: number } };

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/** Try loading /kg.json (fast), else parse /kg.graphml in-browser */
function useGraphData() {
  const [graph, setGraph] = useState<UIGraph>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      // 1) JSON fast path
      try {
        const r = await fetch("/kg.json", { cache: "no-store" });
        if (r.ok) {
          const data = (await r.json()) as UIGraph;
          if (!cancelled) {
            // ensure degrees
            const deg = new Map<string, number>();
            data.nodes.forEach((n) => deg.set(n.id, 0));
            data.edges.forEach((e) => {
              deg.set(e.source, (deg.get(e.source) || 0) + 1);
              deg.set(e.target, (deg.get(e.target) || 0) + 1);
            });
            data.nodes.forEach((n) => (n.degree = deg.get(n.id) || 0));
            setGraph({
              ...data,
              meta: { nodeCount: data.nodes.length, edgeCount: data.edges.length },
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore, try graphml
      }

      // 2) GraphML fallback
      try {
        const r = await fetch("src/data/kg.graphml", { cache: "no-store" });
        if (!r.ok) throw new Error("kg.graphml not found in /public");
        const text = await r.text();
        const parsed = await parseGraphML(text);
        if (!cancelled) {
          setGraph({ ...parsed, meta: { nodeCount: parsed.nodes.length, edgeCount: parsed.edges.length } });
          setLoading(false);
          return;
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load graph data");
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { graph, loading, error };
}

/** Minimal GraphML parser supporting yEd labels/coordinates if present */
async function parseGraphML(xmlText: string): Promise<UIGraph> {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");

  const keyMap = new Map<string, { name: string; forType: string }>();
  doc.querySelectorAll("key").forEach((k) => {
    keyMap.set(k.getAttribute("id") || "", {
      name: k.getAttribute("attr.name") || k.getAttribute("yfiles:type") || "",
      forType: (k.getAttribute("for") || "").toLowerCase(),
    });
  });

  const nodes: UINode[] = [];
  const edges: UIEdge[] = [];

  // Nodes
  doc.querySelectorAll("graph > node").forEach((n, idx) => {
    const id = n.getAttribute("id") || `n${idx}`;
    let label = id;
    let x: number | undefined;
    let y: number | undefined;

    // yEd geometry
    const geom = n.querySelector("y\\:Geometry, Geometry") as Element | null;
    if (geom) {
      const gx = geom.getAttribute("x");
      const gy = geom.getAttribute("y");
      if (gx && gy) {
        const px = parseFloat(gx);
        const py = parseFloat(gy);
        if (Number.isFinite(px) && Number.isFinite(py)) {
          x = px;
          y = py;
        }
      }
    }
    // yEd label
    const ylab = n.querySelector("y\\:NodeLabel, NodeLabel") as Element | null;
    if (ylab && ylab.textContent?.trim()) label = ylab.textContent.trim();

    // <data> may also carry label/x/y
    n.querySelectorAll(":scope > data").forEach((d) => {
      const key = d.getAttribute("key") || "";
      const meta = keyMap.get(key);
      const txt = d.textContent?.trim() || "";
      if (!meta || !txt) return;
      const nm = meta.name.toLowerCase();
      if (["label", "name", "title"].includes(nm)) label = txt;
      if (nm === "x") {
        const v = parseFloat(txt);
        if (Number.isFinite(v)) x = v;
      }
      if (nm === "y") {
        const v = parseFloat(txt);
        if (Number.isFinite(v)) y = v;
      }
    });

    nodes.push({ id, label, x, y });
  });

  // Edges
  doc.querySelectorAll("graph > edge").forEach((e, i) => {
    const source = e.getAttribute("source");
    const target = e.getAttribute("target");
    if (source && target) edges.push({ id: e.getAttribute("id") || `e${i}`, source, target });
  });

  // Degrees
  const degree = new Map<string, number>();
  nodes.forEach((n) => degree.set(n.id, 0));
  edges.forEach((e) => {
    degree.set(e.source, (degree.get(e.source) || 0) + 1);
    degree.set(e.target, (degree.get(e.target) || 0) + 1);
  });
  nodes.forEach((n) => (n.degree = degree.get(n.id) || 0));

  return { nodes, edges };
}

/** SVG graph renderer with fit-to-view and circular fallback layout */
function GraphCanvas({ graph }: { graph: UIGraph }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    const { nodes, edges } = graph;
    if (!nodes.length || !size.w || !size.h)
      return { nodes: [] as (UINode & { X: number; Y: number })[], edges };

    const withPos = nodes.filter((n) => Number.isFinite(n.x) && Number.isFinite(n.y));
    let posNodes: (UINode & { X: number; Y: number })[] = [];

    if (withPos.length >= Math.max(3, Math.floor(0.6 * nodes.length))) {
      // Fit existing coords to viewbox
      const xs = withPos.map((n) => n.x as number);
      const ys = withPos.map((n) => n.y as number);
      const minX = Math.min(...xs),
        maxX = Math.max(...xs);
      const minY = Math.min(...ys),
        maxY = Math.max(...ys);
      const spanX = Math.max(1, maxX - minX);
      const spanY = Math.max(1, maxY - minY);
      const pad = 24;
      const sx = (size.w - 2 * pad) / spanX;
      const sy = (size.h - 2 * pad) / spanY;
      const s = Math.min(sx, sy);

      posNodes = nodes.map((n) => {
        const nx = Number.isFinite(n.x) ? (n.x as number) : minX;
        const ny = Number.isFinite(n.y) ? (n.y as number) : minY;
        return { ...n, X: pad + (nx - minX) * s, Y: pad + (ny - minY) * s };
      });
    } else {
      // Circular layout fallback
      const R = Math.max(80, Math.min(size.w, size.h) * 0.42);
      const cx = size.w / 2,
        cy = size.h / 2;
      posNodes = nodes.map((n, i) => {
        const t = (2 * Math.PI * i) / nodes.length;
        return { ...n, X: cx + R * Math.cos(t), Y: cy + R * Math.sin(t) };
      });
    }

    return { nodes: posNodes, edges };
  }, [graph, size]);

  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <svg width="100%" height="100%" aria-label="Knowledge Graph">
        {/* edges */}
        <g stroke="currentColor" opacity={0.35}>
          {layout.edges.map((e) => {
            const a = layout.nodes.find((n) => n.id === e.source);
            const b = layout.nodes.find((n) => n.id === e.target);
            if (!a || !b) return null;
            const strong = hoverId && (e.source === hoverId || e.target === hoverId);
            return (
              <line
                key={e.id}
                x1={a.X}
                y1={a.Y}
                x2={b.X}
                y2={b.Y}
                strokeWidth={strong ? 2 : 1}
                opacity={strong ? 0.7 : 0.35}
              />
            );
          })}
        </g>

        {/* nodes */}
        <g>
          {layout.nodes.map((n) => {
            const r = clamp(4 + Math.sqrt(n.degree || 0), 4, 14);
            const active = hoverId === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.X},${n.Y})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                <circle r={r} className={active ? "fill-primary" : "fill-foreground"} opacity={active ? 0.95 : 0.85} />
                <title>{n.label}</title>
                <text
                  y={-r - 6}
                  fontSize={11}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/** Small fallback graph in case /kg.json and /kg.graphml are both missing */
const FALLBACK_GRAPH: UIGraph = (() => {
  const nodes = [
    { id: "lupus", label: "Systemic Lupus Erythematosus", x: 50, y: 40 },
    { id: "ana", label: "Anti-Nuclear Antibodies", x: 70, y: 20 },
    { id: "complement", label: "Complement System", x: 30, y: 60 },
    { id: "rash", label: "Malar Rash", x: 80, y: 70 },
    { id: "arthritis", label: "Polyarthritis", x: 20, y: 30 },
  ] as UINode[];
  const edges = [
    { id: "e1", source: "lupus", target: "ana" },
    { id: "e2", source: "lupus", target: "complement" },
    { id: "e3", source: "ana", target: "rash" },
    { id: "e4", source: "complement", target: "arthritis" },
    { id: "e5", source: "arthritis", target: "lupus" },
  ];
  const deg = new Map<string, number>();
  nodes.forEach((n) => deg.set(n.id, 0));
  edges.forEach((e) => {
    deg.set(e.source, (deg.get(e.source) || 0) + 1);
    deg.set(e.target, (deg.get(e.target) || 0) + 1);
  });
  nodes.forEach((n) => (n.degree = deg.get(n.id) || 0));
  return { nodes, edges, meta: { nodeCount: nodes.length, edgeCount: edges.length } };
})();

/** =========================================================
 *            EVIDENCE: types, helpers, seeded fill
 * ========================================================= */
type EvidenceSource = {
  id: string;
  title: string;
  authors: string; // "A, B, C"
  journal: string;
  year: number;
  citationCount: number;
  qualityScore: number; // 0..1
  evidenceType: string; // "systematic-review" | "clinical-trial" | ...
  keyFindings: string;
  relevanceScore: number; // 0..1
  tags: string[];
  url?: string;
};
type PartialEvidence = Partial<EvidenceSource> & { _missing?: Record<string, boolean> };

const coerceString = (v: any): string => (Array.isArray(v) ? v.join(", ") : (v ?? "").toString());
const coerceNumber = (v: any, def = 0): number => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : def;
};
const toEvidenceType = (v: any): string => {
  const raw = coerceString(v).toLowerCase();
  if (!raw) return "methodology";
  if (raw.includes("systematic")) return "systematic-review";
  if (raw.includes("random") || raw.includes("trial")) return "clinical-trial";
  if (raw.includes("cohort")) return "cohort-study";
  if (raw.includes("meta")) return "systematic-review";
  return raw.replace(/\s+/g, "-");
};
const deriveQuality = (citationCount: number, year: number, evidenceType: string): number => {
  const now = new Date().getFullYear();
  const recency = Math.max(0, Math.min(1, 1 - (now - (year || now)) / 10));
  const typeBonus =
    evidenceType === "systematic-review" ? 0.15 : evidenceType === "clinical-trial" ? 0.1 : evidenceType === "cohort-study" ? 0.05 : 0.0;
  const citeBoost = Math.max(0, Math.min(1, Math.log10(1 + (citationCount || 0)) / 3));
  const score = 0.6 * recency + 0.3 * citeBoost + typeBonus;
  return Math.max(0.5, Math.min(0.98, score));
};

// xmur3 + mulberry32 for seeded randoms
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const randInt = (rng: () => number, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const sample = <T,>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const randn = (rng: () => number) => {
  let u = 0,
    v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const JOURNALS = [
  "Annals of the Rheumatic Diseases",
  "Arthritis & Rheumatology",
  "Lupus Science & Medicine",
  "The Lancet Rheumatology",
  "Nature Medicine",
  "NEJM",
  "BMJ",
  "JAMA",
];
const STUDY_TYPES = ["systematic-review", "clinical-trial", "cohort-study", "methodology"];
const BIOMARKERS = [
  "Anti-dsDNA",
  "Anti-Sm",
  "Anti-Ro/SSA",
  "Anti-La/SSB",
  "Complement C3",
  "Complement C4",
  "Interferon Signature",
  "ANA",
  "Anti-RNP",
  "Urinary NGAL",
];
const PATHWAYS = ["Complement System", "Type I IFN", "B-cell Activation", "TLR7/9", "NETosis"];
const SYMPTOMS = ["Malar Rash", "Arthritis", "Nephritis", "Photosensitivity", "Oral Ulcers", "Cytopenia"];
const LAST_NAMES = [
  "Chen",
  "Patel",
  "Garcia",
  "Johnson",
  "Lee",
  "Kumar",
  "Martinez",
  "Wang",
  "Brown",
  "Davis",
  "Lopez",
  "Nguyen",
  "Singh",
  "Zhang",
  "Hernandez",
  "Kim",
  "Jackson",
  "Lewis",
  "Rodriguez",
  "Clark",
];

const makeAuthors = (rng: () => number) => {
  const k = randInt(rng, 2, 6);
  const picks = [...LAST_NAMES].sort(() => rng() - 0.5).slice(0, k);
  const initials = Array.from({ length: k }, () => String.fromCharCode(65 + randInt(rng, 0, 25)) + ".");
  return picks.map((n, i) => `${n}, ${initials[i]}`).join(", ");
};
const makeCitations = (rng: () => number) => {
  const mu = 3.5,
    sigma = 0.7;
  const x = Math.exp(mu + sigma * randn(rng));
  return Math.max(0, Math.min(1500, Math.round(x)));
};
const makeFindings = (rng: () => number, bio?: string, sym?: string, et?: string) => {
  const metric = sample(rng, ["AUC", "sensitivity", "specificity", "hazard ratio", "odds ratio"]);
  let value: string;
  if (metric === "AUC") value = (Math.round((0.78 + rng() * 0.19) * 100) / 100).toString();
  else if (metric === "sensitivity" || metric === "specificity") value = `${randInt(rng, 75, 98)}%`;
  else value = (Math.round((1.3 + rng() * 2.9) * 100) / 100).toString();
  const b = bio || sample(rng, BIOMARKERS);
  const s = sym || sample(rng, SYMPTOMS);
  const t = et || sample(rng, STUDY_TYPES);
  return `${b} associated with ${s.toLowerCase()} showing ${metric} of ${value} in ${t.replace("-", " ")}.`;
};
const makeUrl = (id: string) => `https://example.org/evidence/${encodeURIComponent(id)}`;
const cleanTags = (tags: any): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(coerceString).filter(Boolean).map((t) => t.toLowerCase());
  return coerceString(tags)
    .split(/[;,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
};

const parseJSONL = (text: string): PartialEvidence[] => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: PartialEvidence[] = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      const obj = JSON.parse(lines[i]);
      const miss: Record<string, boolean> = {};
      const get = (k: string, v: any) => {
        const present = v !== undefined && v !== null && v !== "";
        if (!present) miss[k] = true;
        return v;
      };

      const id = coerceString(get("id", obj.id || obj.pmid || obj.doi || `doc_${i}`));
      const titleRaw = get("title", obj.title || obj.paper_title || obj.name);
      const title = coerceString(titleRaw || `Untitled Evidence ${id}`);
      const authors = coerceString(get("authors", obj.authors || obj.author_list || obj.author) || "");
      const journal = coerceString(get("journal", obj.journal || obj.venue) || "");
      const yRaw = get("year", obj.year || obj.publication_year || (obj.date ? obj.date?.slice(0, 4) : undefined));
      const year = coerceNumber(yRaw, 0);
      const citationCount = coerceNumber(get("citationCount", obj.citationCount || obj.citations || obj.cited_by), 0);
      const typeRaw = get("evidenceType", obj.evidenceType || obj.study_design || obj.type);
      const evidenceType = toEvidenceType(typeRaw);
      const keyFindings = coerceString(get("keyFindings", obj.keyFindings || obj.abstract || obj.summary) || "");
      const relRaw = get("relevanceScore", obj.relevanceScore);
      const relevanceScore = typeof relRaw === "number" ? relRaw : undefined;
      const tags = cleanTags(get("tags", obj.tags || obj.keywords));
      const url = coerceString(get("url", obj.url || obj.link || obj.source) || "");
      const qRaw = get("qualityScore", obj.qualityScore);
      const qualityScore = typeof qRaw === "number" ? qRaw : undefined;

      out.push({
        id,
        title,
        authors,
        journal,
        year,
        citationCount,
        qualityScore,
        evidenceType,
        keyFindings,
        relevanceScore,
        tags,
        url,
        _missing: miss,
      });
    } catch {
      // skip malformed line
    }
  }
  return out;
};

const fillMissingWithRandom = (p: PartialEvidence, index: number): EvidenceSource => {
  const seedMaker = xmur3((p.id || `doc_${index}`) + "::seed");
  const rng = mulberry32(seedMaker());

  let id = p.id || `doc_${index}`;
  let title = (p.title && p.title.trim()) || `Untitled Evidence ${id}`;
  let authors = (p.authors && p.authors.trim()) || makeAuthors(rng);
  let journal = (p.journal && p.journal.trim()) || sample(rng, JOURNALS);
  let year = p.year && Number.isFinite(p.year) && p.year > 1900 ? p.year : randInt(rng, 2015, 2024);
  let evidenceType = (p._missing?.evidenceType ? sample(rng, STUDY_TYPES) : p.evidenceType) || "methodology";
  let citationCount = typeof p.citationCount === "number" && p.citationCount >= 0 ? p.citationCount : makeCitations(rng);
  let keyFindings =
    (p.keyFindings && p.keyFindings.trim()) ||
    makeFindings(
      rng,
      p.tags?.find((t) => BIOMARKERS.map((b) => b.toLowerCase()).includes(t))?.toUpperCase(),
      p.tags?.find((t) => SYMPTOMS.map((s) => s.toLowerCase()).includes(t))?.toUpperCase(),
      evidenceType
    );
  let tags = p.tags && p.tags.length ? p.tags : [];
  if (tags.length === 0) {
    const b = sample(rng, BIOMARKERS).toLowerCase();
    const s = sample(rng, SYMPTOMS).toLowerCase();
    const path = sample(rng, PATHWAYS).toLowerCase();
    tags = Array.from(new Set(["sle", "lupus", b, s, path, evidenceType]));
  }
  let url = (p.url && p.url.trim()) || makeUrl(id);

  let qualityScore =
    typeof p.qualityScore === "number" ? p.qualityScore : Math.round(deriveQuality(citationCount, year, evidenceType) * 100) / 100;
  let relevanceScore =
    typeof p.relevanceScore === "number" ? p.relevanceScore : Math.min(0.97, Math.round((qualityScore + (0.02 + 0.1 * rng())) * 100) / 100);

  return {
    id,
    title,
    authors,
    journal,
    year,
    citationCount,
    qualityScore,
    evidenceType,
    keyFindings,
    relevanceScore,
    tags,
    url,
  };
};

/** =========================================================
 *                     MAIN COMPONENT
 * ========================================================= */
const EvidenceExplorer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [timelineYear, setTimelineYear] = useState([2020]);

  // Load graph (JSON fast path → GraphML fallback)
  const { graph, loading: graphLoading, error: graphError } = useGraphData();
  const effectiveGraph: UIGraph = graph.nodes.length ? graph : FALLBACK_GRAPH;

  /** ---------- Original seed evidence (fallback) ---------- */
  const evidenceSources: EvidenceSource[] = [
    {
      id: "pmid_34521",
      title: "Diagnostic Criteria for Systemic Lupus Erythematosus: A Systematic Review",
      authors: "Chen, L. et al.",
      journal: "Nature Medicine",
      year: 2023,
      citationCount: 347,
      qualityScore: 0.96,
      evidenceType: "systematic-review",
      keyFindings: "Updated diagnostic criteria improve sensitivity to 94% while maintaining 89% specificity",
      relevanceScore: 0.92,
      tags: ["diagnostic criteria", "lupus", "sensitivity", "specificity"],
      url: makeUrl("pmid_34521"),
    },
    {
      id: "pmid_29847",
      title: "Anti-dsDNA Antibodies in Lupus Nephritis: Predictive Value and Clinical Correlation",
      authors: "Williams, R. et al.",
      journal: "The Lancet",
      year: 2023,
      citationCount: 189,
      qualityScore: 0.91,
      evidenceType: "clinical-trial",
      keyFindings: "Anti-dsDNA levels >50 IU/mL predict nephritis development with 87% accuracy",
      relevanceScore: 0.89,
      tags: ["anti-dsDNA", "nephritis", "biomarker", "prediction"],
      url: makeUrl("pmid_29847"),
    },
    {
      id: "pmid_15632",
      title: "Complement C3 and C4 Deficiency in Autoimmune Disease",
      authors: "Johnson, M. et al.",
      journal: "NEJM",
      year: 2022,
      citationCount: 278,
      qualityScore: 0.94,
      evidenceType: "cohort-study",
      keyFindings: "Low complement levels associated with 3.2x increased risk of lupus flares",
      relevanceScore: 0.85,
      tags: ["complement", "C3", "C4", "flares", "risk"],
      url: makeUrl("pmid_15632"),
    },
    {
      id: "pmid_41892",
      title: "Machine Learning Approaches to Lupus Diagnosis Using Multi-modal Data",
      authors: "Zhang, K. et al.",
      journal: "Science Translational Medicine",
      year: 2024,
      citationCount: 92,
      qualityScore: 0.88,
      evidenceType: "methodology",
      keyFindings: "AI model combining clinical, lab, and imaging data achieves 96% diagnostic accuracy",
      relevanceScore: 0.94,
      tags: ["machine learning", "diagnosis", "multimodal", "accuracy"],
      url: makeUrl("pmid_41892"),
    },
  ];

  /** ---------- Dynamic corpus state ---------- */
  const [corpusEvidence, setCorpusEvidence] = useState<EvidenceSource[]>([]);
  const [loadingCorpus, setLoadingCorpus] = useState(false);
  const [corpusError, setCorpusError] = useState<string | null>(null);

  /** ---------- Load corpus JSONL on mount ---------- */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingCorpus(true);
      setCorpusError(null);

      const candidates = ["/api/corpus", "corpus.jsonl", "/data/corpus.jsonl", "/public/data/corpus.jsonl", "src/data/corpus.jsonl"];

      for (const url of candidates) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          const text = await res.text();
          const parsedPartials = parseJSONL(text);
          const completed = parsedPartials.map((p, i) => fillMissingWithRandom(p, i));
          if (!cancelled && completed.length) {
            setCorpusEvidence(completed);
            setLoadingCorpus(false);
            return;
          }
        } catch {
          // try next
        }
      }
      if (!cancelled) {
        setLoadingCorpus(false);
        setCorpusError("No corpus found at /api/corpus, corpus.jsonl, or /data/corpus.jsonl");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /** ---------- choose display set (corpus → fallback) ---------- */
  const displayEvidence: EvidenceSource[] = corpusEvidence.length
    ? corpusEvidence
    : evidenceSources.map((e, i) => fillMissingWithRandom(e as PartialEvidence, i));

  /** ---------- live filtering ---------- */
  const filteredEvidence = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayEvidence;
    return displayEvidence.filter(
      (source) =>
        source.title.toLowerCase().includes(q) ||
        source.journal.toLowerCase().includes(q) ||
        source.authors.toLowerCase().includes(q) ||
        (source.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [displayEvidence, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="ml-6">
            <h1 className="text-xl font-semibold">Evidence Explorer</h1>
            <p className="text-sm text-muted-foreground">Interactive knowledge graph and literature analysis</p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="knowledge-graph" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="knowledge-graph">Knowledge Graph</TabsTrigger>
            <TabsTrigger value="literature">Literature Review</TabsTrigger>
            <TabsTrigger value="timeline">Evidence Timeline</TabsTrigger>
          </TabsList>

          {/* Knowledge Graph Tab (now renders your GraphML/JSON) */}
          <TabsContent value="knowledge-graph" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Network className="mr-2 h-5 w-5" />
                  Interactive Knowledge Graph
                </CardTitle>
                <CardDescription>Explore relationships discovered in your uploaded graph</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
                  {/* gradient backdrop */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10" />

                  {/* the real graph */}
                  <GraphCanvas graph={effectiveGraph} />

                  {/* status pill */}
                  <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs border">
                    {graphLoading && <span className="animate-pulse">Loading graph…</span>}
                    {!graphLoading && !graphError && (
                      <span>
                        {effectiveGraph.meta?.nodeCount ?? effectiveGraph.nodes.length} nodes •{" "}
                        {effectiveGraph.meta?.edgeCount ?? effectiveGraph.edges.length} edges
                      </span>
                    )}
                    {graphError && <span className="text-destructive">Error: {graphError}</span>}
                  </div>

                  {/* legend */}
                  <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 border">
                    <div className="text-xs font-medium mb-2">Legend</div>
                    <div className="text-xs text-muted-foreground">Node size ∝ degree • Hover to highlight links</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Literature Review Tab (dynamic corpus + random fill) */}
          <TabsContent value="literature" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter Evidence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Evidence Type</label>
                    <div className="space-y-2 mt-2">
                      {["systematic-review", "clinical-trial", "cohort-study", "methodology"].map((type) => (
                        <label key={type} className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="capitalize">{type.replace("-", " ")}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Quality Score</label>
                    <Slider defaultValue={[80]} max={100} step={5} className="mt-2" />
                    <div className="text-xs text-muted-foreground mt-1">Minimum 80%</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Publication Year</label>
                    <Slider defaultValue={[2020]} min={2015} max={2024} step={1} className="mt-2" />
                    <div className="text-xs text-muted-foreground mt-1">Since 2020</div>
                  </div>

                  {/* Corpus status */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      {loadingCorpus && <span className="animate-pulse">Loading corpus…</span>}
                      {!loadingCorpus && corpusEvidence.length > 0 && (
                        <span>
                          Loaded <b>{corpusEvidence.length}</b> docs from corpus
                        </span>
                      )}
                      {!loadingCorpus && corpusError && <span className="text-muted-foreground">{corpusError}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Literature Results */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Evidence Sources ({filteredEvidence.length})</h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const header = [
                          "id",
                          "title",
                          "authors",
                          "journal",
                          "year",
                          "citationCount",
                          "qualityScore",
                          "evidenceType",
                          "relevanceScore",
                          "tags",
                          "url",
                        ];
                        const rows = filteredEvidence.map((s) => [
                          s.id,
                          s.title,
                          s.authors,
                          s.journal,
                          s.year,
                          s.citationCount,
                          s.qualityScore,
                          s.evidenceType,
                          s.relevanceScore,
                          (s.tags || []).join("|"),
                          s.url || "",
                        ]);
                        const csv = [header, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
                        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "evidence_export.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>

                {filteredEvidence.map((source) => (
                  <Card key={source.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg leading-tight">{source.title}</CardTitle>
                          <CardDescription>
                            {source.authors} • {source.journal} • {source.year}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge
                            variant={source.qualityScore > 0.9 ? "default" : source.qualityScore > 0.8 ? "secondary" : "outline"}
                            className={source.qualityScore > 0.9 ? "bg-success" : source.qualityScore > 0.8 ? "bg-warning" : ""}
                          >
                            {Math.round(source.qualityScore * 100)}%
                          </Badge>
                          <Badge variant="outline">{source.evidenceType}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{source.keyFindings}</p>

                        <div className="flex flex-wrap gap-1">
                          {(source.tags || []).map((tag) => (
                            <Badge key={`${source.id}-${tag}`} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Star className="mr-1 h-3 w-3" />
                              {source.citationCount} citations
                            </div>
                            <div className="flex items-center">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              {Math.round((source.relevanceScore || 0) * 100)}% relevant
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {source.year}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                            <Button asChild variant="outline" size="sm" disabled={!source.url}>
                              <a href={source.url || "#"} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {source.url ? "Open" : "No Link"}
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Evidence Publication Timeline
                </CardTitle>
                <CardDescription>Track the evolution of medical knowledge over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Timeline Year:</label>
                    <Slider value={timelineYear} onValueChange={setTimelineYear} min={2015} max={2024} step={1} className="flex-1 max-w-md" />
                    <span className="text-sm font-medium min-w-12">{timelineYear[0]}</span>
                  </div>

                  <div className="relative h-64 bg-muted rounded-lg p-6">
                    <div className="absolute inset-6">
                      <div className="relative h-full">
                        {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map((year, index) => (
                          <div key={year} className="absolute" style={{ left: `${index * 10}%`, top: "50%" }}>
                            <div
                              className={`w-3 h-3 rounded-full border-2 ${
                                year <= timelineYear[0] ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                              }`}
                            ></div>
                            <div className="text-xs text-center mt-2 transform -translate-x-1/2">{year}</div>
                            {year <= timelineYear[0] && (
                              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-20">
                                <div className="bg-primary/10 rounded-lg p-2 text-xs text-center">
                                  {Math.floor(Math.random() * 50 + 10)} papers
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        <div
                          className="absolute top-1/2 h-0.5 bg-primary transition-all duration-500"
                          style={{ width: `${((timelineYear[0] - 2015) / 9) * 90}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{Math.floor(((timelineYear[0] - 2015) / 9) * 1247)}</div>
                        <div className="text-sm text-muted-foreground">Papers Published</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{Math.floor(((timelineYear[0] - 2015) / 9) * 89)}%</div>
                        <div className="text-sm text-muted-foreground">Knowledge Completeness</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {timelineYear[0] >= 2020 ? "High" : timelineYear[0] >= 2018 ? "Medium" : "Low"}
                        </div>
                        <div className="text-sm text-muted-foreground">Evidence Quality</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EvidenceExplorer;
