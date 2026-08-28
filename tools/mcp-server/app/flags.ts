/**
 * The flag queue as a gesture: which open flags a single request would name,
 * and the line it sends. Pure, so the rule that decides whether the control is
 * on the head bar at all can be tested without a DOM or a host.
 *
 * A flag's own request line is one flag per gesture, placed at the selection.
 * This is the other shape: several flags are open, nobody is on them, and the
 * person wants the queue worked. One message names them all and says to work
 * them in parallel, which the LLM can do where the host runs sub-agents and
 * cannot where it does not; either way each flag ends on its own ruling card.
 */

/** As much of a flag as the rule reads. The editor's `FlagMark` is one of these. */
export interface QueuedFlag {
  id: number;
  status: string;
  /** What the flag asks for: `mint` proposes claims and stops, so it needs no request. */
  research?: string;
  taken_by?: string;
  /** The server's word that the take has aged out: held, but not by anyone working now. */
  take_stale?: boolean;
}

/**
 * The flags one request would name: open, asking for research, and nobody
 * working them now. Fewer than two is not a queue, so the control does not
 * appear and the answer is empty.
 */
export function flagsToWork(flags: QueuedFlag[]): number[] {
  const free = flags.filter((f) => f.status === "open" && !!f.research && f.research !== "mint" && (!f.taken_by || f.take_stale));
  return free.length >= 2 ? free.map((f) => f.id) : [];
}

/** The one line the control puts in the conversation. */
export function workTheFlagsLine(ids: number[]): string {
  return `Work the open flags: ${ids.map((i) => `#${i}`).join(", ")}. In parallel where you can; one ruling card per flag.`;
}
