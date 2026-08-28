/**
 * What the preview script renders: the structured content a tool would hand
 * the app for a page, computed in-process from the corpus, with no MCP
 * transport in the way; and the read-only tools the previewed app may call
 * back into. Writes are refused here: a preview never touches a corpus.
 */
import { openCorpus, readDeclaration, type Corpus } from "./corpus.ts";
import * as T from "./tools.ts";

export type PreviewCorpus = Corpus & { id: string };

export function openPreviewCorpus(dir: string): PreviewCorpus {
  const c = openCorpus({ dir, agent: "agent/preview", fetchEnabled: false, commit: false });
  return { ...c, id: String(readDeclaration(c).id) };
}

export interface PreviewContent { tool: string; content: { type: "text"; text: string }[]; structuredContent: Record<string, unknown> }

/** The result the app would receive for a page: `proposals[:flag]` is erf_proposals, anything else erf_view. */
export function previewContent(c: PreviewCorpus, page: string): PreviewContent {
  const m = /^proposals(?::(\d+))?$/.exec(page);
  if (m) {
    const r = T.proposals(c, m[1] ? { flag: Number(m[1]) } : {});
    if (!r.data) throw new Error(`no proposal set for ${page}`);
    return { tool: "erf_proposals", content: [{ type: "text", text: r.text }], structuredContent: r.data };
  }
  const p = T.viewPage(c, { page });
  const plain = p.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500);
  return { tool: "erf_view", content: [{ type: "text", text: `[${c.id}] ${p.title}\n${plain}` }], structuredContent: { ...p, served_at: new Date().toISOString() } };
}

type Args = Record<string, unknown>;
/** The tools the app calls that only read; each mapped to the tools module. */
const READ_ONLY: Record<string, (c: PreviewCorpus, a: Args) => T.Result> = {
  erf_view: (c, a) => { const p = T.viewPage(c, { page: a["page"] as string | undefined }); return { text: p.title, data: { ...p, served_at: new Date().toISOString() } }; },
  erf_proposals: (c, a) => T.proposals(c, { flag: a["flag"] as number | undefined }),
  erf_narrative_read: (c, a) => T.narrativeRead(c, { narrative: String(a["narrative"] ?? "") }),
  erf_narrative_status: (c, a) => T.narrativeStatus(c, { narrative: String(a["narrative"] ?? ""), since: a["since"] as string | undefined }),
  erf_record_read: (c, a) => T.recordRead(c, { id: String(a["id"] ?? "") }),
  erf_flags: (c, a) => T.flags(c, { narrative: a["narrative"] as string | undefined, all: a["all"] as boolean | undefined }),
};

export interface PreviewToolResult { content: { type: "text"; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean }

/** A tool call from the previewed app: read-only tools answer from the corpus; anything else is refused, visibly. */
export function callPreviewTool(c: PreviewCorpus, name: string, args: Args): PreviewToolResult {
  const f = READ_ONLY[name];
  if (!f) return { isError: true, content: [{ type: "text", text: `preview: ${name} would write to the corpus; the preview refuses writes` }] };
  try {
    const r = f(c, args);
    return r.data ? { content: [{ type: "text", text: r.text }], structuredContent: r.data } : { content: [{ type: "text", text: r.text }] };
  } catch (e) {
    return { isError: true, content: [{ type: "text", text: `REFUSED: ${e instanceof Error ? e.message : String(e)}` }] };
  }
}
