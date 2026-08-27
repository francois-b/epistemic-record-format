/**
 * The research trail as the editor shows it: one flag's work, line by line,
 * as it lands. Pure: the shape the server sends in `erf_narrative_status`
 * (`trail`) becomes lines a panel can draw, nothing else. The app decides
 * where the panel is and when it opens.
 */

export interface TrailSearchMark { ts: string; for?: string; tool: string; query: string; hits: string }
export interface TrailCaptureMark { ts: string; source: string; url?: string; held: boolean; refused?: string; citation?: string; search: number | null }
export interface FlagTrail {
  flag: number;
  research: string;
  /** the instant the window opened: the take, else the flag itself */
  since: string;
  /** set once the flag is resolved */
  until?: string;
  taken_by?: string;
  searches: TrailSearchMark[];
  captures: TrailCaptureMark[];
  atoms: { id: string; source: string }[];
  claims: { id: string; title: string }[];
}

export type TrailLineKind = "search" | "capture" | "refused" | "atom" | "claim" | "empty";
export interface TrailLine { kind: TrailLineKind; text: string; href?: string; ts?: string }

/** A short form of an instant: the clock time, since the trail is a day's work. */
export function clock(ts: string): string {
  const m = /T(\d{2}:\d{2})/.exec(ts);
  return m ? m[1]! : ts;
}

/** Cut a line at `n` characters with an ellipsis, on a word where one is near. */
export function short(s: string, n = 90): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.lastIndexOf(" ", n - 1);
  return t.slice(0, cut > n * 0.6 ? cut : n - 1).trimEnd() + "…";
}

/**
 * The lines of one flag's trail, in the order the work happened: each search,
 * then the captures it led to (held or refused) indented under it, then the
 * atoms and claims the window produced. An empty window is one line saying so.
 */
export function trailLines(t: FlagTrail): TrailLine[] {
  const out: TrailLine[] = [];
  const bySearch = new Map<number | null, TrailCaptureMark[]>();
  for (const c of t.captures) {
    const k = c.search;
    if (!bySearch.has(k)) bySearch.set(k, []);
    bySearch.get(k)!.push(c);
  }
  const captureLine = (c: TrailCaptureMark): TrailLine => c.held
    ? { kind: "capture", text: `  held ${c.source}${c.citation ? `: ${short(c.citation, 70)}` : ""}`, ts: c.ts, ...(c.url ? { href: c.url } : {}) }
    : { kind: "refused", text: `  refused ${c.source}: ${short(c.refused ?? "", 70)}`, ts: c.ts, ...(c.url ? { href: c.url } : {}) };
  t.searches.forEach((s, i) => {
    out.push({ kind: "search", text: `${clock(s.ts)} ${s.tool}: “${short(s.query, 80)}” · ${short(s.hits, 60)}`, ts: s.ts });
    for (const c of bySearch.get(i) ?? []) out.push(captureLine(c));
  });
  for (const c of bySearch.get(null) ?? []) out.push(captureLine(c));
  if (t.atoms.length) out.push({ kind: "atom", text: `atoms: ${t.atoms.map((a) => `${a.id} (${a.source})`).join(", ")}` });
  for (const cl of t.claims) out.push({ kind: "claim", text: `claim ${cl.id}: ${short(cl.title, 80)}`, href: `claim-${cl.id}.html` });
  if (!out.length) out.push({ kind: "empty", text: t.until ? "nothing was logged for this flag" : "waiting for the first search…" });
  return out;
}

/** The one-line summary the status bar shows for a set of trails. */
export function trailSummary(trails: FlagTrail[]): string {
  const n = (k: keyof Pick<FlagTrail, "searches" | "captures" | "atoms" | "claims">) => trails.reduce((s, t) => s + t[k].length, 0);
  const parts = [`${n("searches")} search${n("searches") === 1 ? "" : "es"}`, `${n("captures")} capture${n("captures") === 1 ? "" : "s"}`];
  if (n("atoms")) parts.push(`${n("atoms")} atom${n("atoms") === 1 ? "" : "s"}`);
  if (n("claims")) parts.push(`${n("claims")} claim${n("claims") === 1 ? "" : "s"}`);
  return parts.join(" · ");
}
