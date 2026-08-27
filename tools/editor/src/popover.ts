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
import type { BindingMark, BoundRange, Computed } from "./marks.ts";

/** An open popover: the passage it sits on, the binding it shows, and which claim is up. */
export interface Popover { from: number; to: number; binding: BindingMark; index: number }

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
 * What a click does: on a bound passage it opens the popover there (a second
 * click on the same passage closes it); anywhere else it closes whatever is
 * open. The first claim shows when a passage opens.
 */
export function popoverAfterClick(open: Popover | null, hit: BoundRange | null): Popover | null {
  if (!hit) return null;
  if (open && open.from === hit.from && open.to === hit.to) return null;
  return { from: hit.from, to: hit.to, binding: hit.binding, index: 0 };
}

/** The next or previous claim, wrapping at either end. */
export function step(p: Popover, d: 1 | -1): Popover {
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
