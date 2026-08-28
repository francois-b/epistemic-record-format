/**
 * The binding popover's state, without a DOM: which bound passage is open,
 * which of its claims is showing, and what a click or a key does to that.
 * Pure, so it can be unit-tested; the view in `index.ts` turns the state into
 * a CodeMirror tooltip and the buttons into these transitions.
 *
 * It opens on a click, not on hover: a hover card cannot be reached by the
 * pointer, and this one has buttons and links in it. It shows one claim at a
 * time, stepped through with arrows, the way the evidence cards in the DAA
 * claims-tree web bundle cycle through their atoms.
 */
import type { BindingMark, BoundRange, Computed, FlagMark, FlagRange } from "./marks.ts";
import { trailLines, type FlagTrail, type TrailLine } from "./trail.ts";

/**
 * An open popover: on a bound passage, the binding it shows and which claim
 * is up; on a flagged span, the flag. A span can be both; the flag wins the
 * click, because the flag is the newer question about it.
 */
export type Popover =
  | { kind: "binding"; from: number; to: number; binding: BindingMark; index: number }
  | { kind: "flag"; from: number; to: number; flag: FlagMark };
export type BindingPopover = Extract<Popover, { kind: "binding" }>;
export type FlagPopover = Extract<Popover, { kind: "flag" }>;

/** The flagged span under a position, or null on prose nobody flagged. */
export function hitFlag(c: Computed, pos: number): FlagRange | null {
  return c.flags.find((f) => pos >= f.from && pos <= f.to) ?? null;
}

/** What a click at a position lands on: a flag before a binding, since a span can carry both. */
export function hitAt(c: Computed, pos: number): FlagRange | BoundRange | null {
  return hitFlag(c, pos) ?? hitBinding(c, pos);
}

/**
 * The bound passage under a position: the passage itself, or the marker that
 * ends it (a marker names the same claims as its passage). Null when the
 * position is on plain prose.
 */
export function hitBinding(c: Computed, pos: number): BoundRange | null {
  const direct = c.bound.find((b) => pos >= b.from && pos <= b.to);
  if (direct) return direct;
  const m = c.markers.find((x) => pos >= x.from && pos <= x.to);
  if (!m) return null;
  return c.bound.find((b) => b.binding.claims.join(" ") === m.claims.join(" ")) ?? null;
}

/**
 * What a click does: on a bound passage or a flagged span it opens the card
 * there (a second click on the same one closes it); anywhere else it closes
 * whatever is open. The first claim shows when a passage opens.
 */
export function popoverAfterClick(open: Popover | null, hit: BoundRange | FlagRange | null): Popover | null {
  if (!hit) return null;
  const next: Popover = "flag" in hit
    ? { kind: "flag", from: hit.from, to: hit.to, flag: hit.flag }
    : { kind: "binding", from: hit.from, to: hit.to, binding: hit.binding, index: 0 };
  if (open && open.kind === next.kind && open.from === next.from && open.to === next.to) return null;
  return next;
}

/** The next or previous claim, wrapping at either end. A flag card has nothing to step through. */
export function step(p: Popover, d: 1 | -1): Popover {
  if (p.kind !== "binding") return p;
  const n = p.binding.claims.length;
  if (n === 0) return p;
  return { ...p, index: (p.index + d + n) % n };
}

/**
 * The popover after the document changed: its passage follows the text, and
 * it closes when the passage collapsed to nothing. `mapPos` is the change
 * set's mapping; the sides are those of a mark decoration, so typing at
 * either edge grows the passage rather than escaping it.
 */
export function mapPopover(p: Popover | null, mapPos: (pos: number, assoc: -1 | 1) => number): Popover | null {
  if (!p) return null;
  const from = mapPos(p.from, 1), to = mapPos(p.to, -1);
  return to > from ? { ...p, from, to } : null;
}

/** One atom as the popover lists it: which side it is on, its finding, and where it came from. */
export interface AtomLine { id: string; side: "for" | "against"; finding: string; source: string; citation?: string; url?: string }

/** The claim the popover shows now, with everything the binding knows of it. */
export interface ClaimCard {
  id: string;
  title: string;
  kind: string;
  disposition: string;
  atoms: AtomLine[];
  /** 1-based position among the passage's claims, and how many there are. */
  at: number;
  of: number;
}

export function claimCard(p: Popover): ClaimCard | null {
  if (p.kind !== "binding") return null;
  const id = p.binding.claims[p.index];
  if (id === undefined) return null;
  const info = p.binding.claimInfo?.[id];
  return {
    id,
    title: info?.title ?? id,
    kind: info?.kind ?? "",
    disposition: info?.disposition ?? "",
    atoms: info?.atoms ?? [],
    at: p.index + 1,
    of: p.binding.claims.length,
  };
}

/** Where a source link goes: the page the source was captured from, else the atom's own page in the viewer. */
export function sourceHref(a: AtomLine): string {
  return a.url ?? `atom-${encodeURIComponent(a.id)}.html`;
}

/** The flag card: what was asked, where it stands, and the research behind it so far. */
export interface FlagCard {
  id: number;
  research: string;
  /** The flagged passage (the whole selection), cut to one line when long. */
  span?: string;
  note?: string;
  /** One line: open and not being worked, taken by whom (fresh or stale), or done and bound to what. */
  status: string;
  /** The claims a resolved flag was bound to. */
  claims: string[];
  /** The trail's lines, or one line saying why there are none. */
  lines: TrailLine[];
}

/**
 * The flag as its card reads it. The take's freshness is the server's word
 * (`take_stale`), never recomputed here; the trail is the one the app last
 * received for this flag, if any.
 */
export function flagCard(p: FlagPopover, trails: FlagTrail[] = []): FlagCard {
  const f = p.flag;
  const claims = f.claims ?? [];
  const status = f.status === "done"
    ? `done · bound to ${claims.length ? claims.join(", ") : "nothing"}`
    : f.taken_by
      ? (f.take_stale ? `taken by ${f.taken_by} · the take went stale` : `taken by ${f.taken_by} · working now`)
      : "open · not being worked";
  const trail = trails.find((t) => t.flag === f.id);
  const research = f.research ?? "mint";
  const lines: TrailLine[] = trail
    ? trailLines(trail)
    : [{ kind: "empty", text: research === "mint" ? "proposals are made in the chat; nothing is logged for a mint flag" : "no research logged yet" }];
  return { id: f.id, research, ...(f.span ? { span: oneLine(f.span) } : {}), ...(f.note ? { note: f.note } : {}), status, claims, lines };
}

/** A flagged passage as the card shows it: whole when short, else its first words and an ellipsis. */
export function oneLine(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
