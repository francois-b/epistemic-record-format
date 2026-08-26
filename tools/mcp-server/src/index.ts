#!/usr/bin/env -S npx tsx
/**
 * erf-mcp: the Epistemic Record Format as a local MCP server over stdio.
 *
 *     npx tsx src/index.ts <root-dir> [<root-dir> ...] [--agent agent/<name>] [--fetch] [--no-commit]
 *
 * The roots are folders that hold corpora (a root may itself be one).
 * Corpora are found by their declarations; the session works on one at a
 * time (erf_corpus_use), and any tool can name another with `corpus`. The
 * server is the only writer; the reference validator is the oracle for
 * every reading. Design: DESIGN.md beside this file.
 */
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { openCorpus, Refusal, recordFiles } from "./corpus.ts";
import { openWorkspace, resolveCorpus, useCorpus, newCorpusDir, describe, discover, type Workspace } from "./workspace.ts";
import * as T from "./tools.ts";
import { readFileSync } from "node:fs";

const INSTRUCTIONS = `This server holds Epistemic Record Format corpora: research recorded so it can be checked later. One corpus is active at a time (erf_corpus_list, erf_corpus_use); every write names the corpus it went to, so check it. Discover with any search you like, but read every page you might cite through erf_source_add: it holds the bytes, digests them and registers the source, and nothing can be cited that was not captured this way. Log each search with erf_search_log at the moment you run it, not afterwards. Mint atoms only with verbatim quotes; the server checks each one against the held text and refuses paraphrase. Claims are typed by what would settle them: observation (data or research), argument (reasoning over premises), commitment (the author's decision), bet (the world will settle it). Propose; the user rules; never write a record the user has not confirmed. Run erf_corpus_check when asked where things stand.`;

function args(): { roots: string[]; agent: string; fetch: boolean; commit: boolean } {
  const a = process.argv.slice(2);
  const roots: string[] = [];
  let agent = process.env["ERF_AGENT"] ?? "agent/erf-mcp";
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    if (x === "--agent") { agent = a[++i] ?? agent; continue; }
    if (x.startsWith("--")) continue;
    roots.push(x);
  }
  if (!roots.length) { console.error("usage: erf-mcp <root-dir> [<root-dir> ...] [--agent agent/<name>] [--fetch] [--no-commit]"); process.exit(2); }
  return { roots, agent, fetch: a.includes("--fetch") || process.env["ERF_FETCH"] === "1", commit: !a.includes("--no-commit") };
}

function text(prefix: string | null, r: T.Result) { return { content: [{ type: "text" as const, text: prefix ? `[${prefix}] ${r.text}` : r.text }] }; }
function refused(e: unknown) {
  const msg = e instanceof Refusal ? `REFUSED: ${e.message}` : `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}
/** One stderr line per call, which the MCP host keeps in its per-server log: the session's audit trail. */
function trace(tool: string, corpus: string | null, started: number, outcome: string): void {
  console.error(`erf-mcp ${new Date().toISOString()} ${tool}${corpus ? ` [${corpus}]` : ""} ${outcome} ${Date.now() - started}ms`);
}
function outcomeOf(r: { isError?: boolean; content: { type: string; text?: string }[] }): string {
  const t = r.content[0]?.text ?? "";
  return r.isError ? (t.startsWith("REFUSED") ? "refused: " + t.slice(9, 109).replace(/\n/g, " ") : "error: " + t.slice(7, 107)) : "ok: " + t.split("\n")[0]!.slice(0, 100);
}

export function buildServer(ws: Workspace): McpServer {
  const server = new McpServer({ name: "erf-mcp", version: "0.2.0" }, { instructions: INSTRUCTIONS });
  const corpusArg = z.string().optional().describe("corpus id; defaults to the active corpus");
  const ids = z.array(z.string()).optional();
  const edges = z.array(z.object({ to: z.string(), relation: z.enum(["supports", "assumes", "decomposes-into", "conflicts-with"]) })).optional();

  /** Run a tool on the corpus a call addresses; the result is prefixed with the corpus id. */
  const on = <A extends { corpus?: string }>(tool: string, fn: (c: ReturnType<typeof resolveCorpus>, a: A) => T.Result | Promise<T.Result>) =>
    async (a: A) => {
      const started = Date.now(); let corpus: string | null = null;
      let r; try { const c = resolveCorpus(ws, a.corpus); corpus = c.id; r = text(c.id, await fn(c, a)); } catch (e) { r = refused(e); }
      trace(tool, corpus, started, outcomeOf(r)); return r;
    };

  server.registerTool("erf_corpus_list", { title: "List corpora", description: "Every corpus under the workspace roots, by id, with the active one marked.", inputSchema: {} }, async () => { try { return text(null, { text: describe(ws) }); } catch (e) { return refused(e); } });
  server.registerTool("erf_corpus_use", { title: "Choose the active corpus", description: "Make one corpus the target of every following call. Echoes what is now active.", inputSchema: { id: z.string() } }, async ({ id }) => { try { const f = useCorpus(ws, id); return text(null, { text: `active corpus: ${f.id} "${f.decl.title}" at ${f.dir}` }); } catch (e) { return refused(e); } });
  server.registerTool("erf_corpus_init", { title: "Create a corpus", description: "Declare a new corpus in a folder under a workspace root (relative to the first root, or absolute inside one) and make it active.", inputSchema: { folder: z.string(), id: z.string(), title: z.string(), owner: z.string().describe("human:<name>; the person who takes stances"), classification: z.string().optional() } }, async (a) => {
    try { const dir = newCorpusDir(ws, a.folder); const c = openCorpus({ dir, ...ws.options }); const r = T.corpusInit(c, a); ws.active = a.id; return text(a.id, { text: `${r.text}\nactive corpus: ${a.id}` }); } catch (e) { return refused(e); }
  });
  server.registerTool("erf_corpus_check", { title: "Check the corpus", description: "Load and validate: violations by requirement, the quote check over every atom, dispositions, unbacked claims, captured-but-uncited sources, broken anchors. Use when asked where things stand.", inputSchema: { corpus: corpusArg } }, on("erf_corpus_check", (c) => T.corpusCheck(c)));
  server.registerTool("erf_source_add", { title: "Capture a source", description: "Register a source and hold its text: fetch a URL (only when fetching is enabled) or take a file already inside the corpus folder; raw bytes and normalized text are held and digested. Use this for every page you might cite; nothing uncaptured can be cited.", inputSchema: { corpus: corpusArg, id: z.string().describe("lowercase slug, e.g. fowler-ci"), citation_text: z.string().describe("who, what, where, when; never a URL"), url: z.string().optional(), path: z.string().optional().describe("path inside the corpus folder"), licence: z.string().optional().describe("SPDX id if the work may be redistributed"), licence_name: z.string().optional(), not_redistributable: z.boolean().optional() } }, on("erf_source_add", (c, a) => T.sourceAdd(c, a)));
  server.registerTool("erf_search_log", { title: "Log a search act", description: "Record one search you just ran: the tool, the query, and the hits as the instrument reported them. Do this at the moment of the search; surveys are compiled from this log.", inputSchema: { corpus: corpusArg, tool: z.string(), query: z.string(), hits_reported: z.string(), scope: z.string().optional() } }, on("erf_search_log", (c, a) => T.searchLog(c, a)));
  server.registerTool("erf_atom_mint", { title: "Mint an atom", description: "One piece of evidence: a verbatim quote from a captured source plus the finding it supports. The quote is checked against the held text and refused if not found; the nearest passage is returned.", inputSchema: { corpus: corpusArg, source: z.string(), quote: z.string().describe("verbatim; use [...] to elide"), finding: z.string(), source_quality: z.enum(["high", "medium", "low"]), as_of_date: z.string().optional().describe("YYYY, YYYY-MM or YYYY-MM-DD, at the source's precision"), limitations: z.string().optional() } }, on("erf_atom_mint", (c, a) => T.atomMint(c, a)));
  server.registerTool("erf_claim_mint", { title: "Mint a claim", description: "A claim typed by what would settle it, with its evidence for and against, surveys, and edges to other claims. Every referenced id must exist.", inputSchema: { corpus: corpusArg, id: z.string(), title: z.string().describe("the claim as one sentence"), epistemic_kind: z.enum(["observation", "argument", "bet", "commitment"]), atoms_for: ids, atoms_against: ids, surveys: ids, edges, families: ids, notes: z.string().optional(), short_name: z.string().optional() } }, on("erf_claim_mint", (c, a) => T.claimMint(c, a)));
  server.registerTool("erf_claim_update", { title: "Update a claim", description: "Rewrite a claim's title, evidence, surveys, edges, families or notes; stamps last_modified, which makes narrative bindings to it stale until rebound. Standings cannot be edited here.", inputSchema: { corpus: corpusArg, id: z.string(), title: z.string().optional(), atoms_for: ids, atoms_against: ids, surveys: ids, edges, families: ids, notes: z.string().optional() } }, on("erf_claim_update", (c, a) => T.claimUpdate(c, a)));
  server.registerTool("erf_claim_stand", { title: "Take a stance", description: "Append a standing (for / against / withdrawn, with why) under the corpus owner, at this instant. Append-only. Returns the computed disposition.", inputSchema: { corpus: corpusArg, id: z.string(), stance: z.enum(["for", "against", "withdrawn"]), why: z.string() } }, on("erf_claim_stand", (c, a) => T.claimStand(c, a)));
  server.registerTool("erf_survey_record", { title: "Record a survey", description: "What was sought and how: search acts (from the research log for a day via from_log, or given), notable results, and the coverage bounds. A gap claim lists the survey in its surveys.", inputSchema: { corpus: corpusArg, id: z.string().describe("slug ending with the date, e.g. x-tools-2026-08-26"), title: z.string().describe("what was sought"), coverage_bounds: z.string(), summary: z.string().optional(), from_log: z.string().optional().describe("YYYY-MM-DD: take the search acts logged that day"), searches: z.array(z.object({ tool: z.string(), query: z.string(), hits_reported: z.string(), scope: z.string().optional() })).optional(), notable_results: z.array(z.object({ what: z.string(), note: z.string(), atoms: ids })).optional(), prior_survey: z.string().optional() } }, on("erf_survey_record", (c, a) => T.surveyRecord(c, a)));
  server.registerTool("erf_narrative_bind", { title: "Bind a passage to claims", description: "Insert the binding marker after the passage that contains the anchor words (exact, unique), bound at this instant. Pass replace=true to rewrite a passage's existing binding.", inputSchema: { corpus: corpusArg, narrative: z.string().describe("narrative id or filename"), anchor: z.string().describe("a few exact words from the passage"), claims: z.array(z.string()), replace: z.boolean().optional() } }, on("erf_narrative_bind", (c, a) => T.narrativeBind(c, a)));
  server.registerTool("erf_narrative_check", { title: "Check a narrative", description: "Bindings that name missing claims, bindings gone stale since the claim changed, anchors no longer in their passage, candidates that fail the grammar.", inputSchema: { corpus: corpusArg, narrative: z.string().optional() } }, on("erf_narrative_check", (c, a) => T.narrativeCheck(c, a)));
  server.registerTool("erf_source_read", { title: "Read a held source", description: "A source's entry and its held normalized text, so a verbatim quote can be chosen from the text the quote check folds. Give find to see windows around a phrase; without it, the opening of the text.", inputSchema: { corpus: corpusArg, id: z.string(), find: z.string().optional(), window: z.number().optional() } }, on("erf_source_read", (c, a) => T.sourceRead(c, a)));
  server.registerTool("erf_record_read", { title: "Read a record", description: "The record file for an id, as it stands.", inputSchema: { corpus: corpusArg, id: z.string() } }, on("erf_record_read", (c, a) => T.recordRead(c, a)));
  server.registerTool("erf_record_list", { title: "List records", description: "Ids, kinds, dispositions and titles; optionally one type: claim, atom, survey, source, narrative.", inputSchema: { corpus: corpusArg, type: z.string().optional() } }, on("erf_record_list", (c, a) => T.recordList(c, a)));

  // prompts: judgment scaffolds, read-only
  server.registerPrompt("decompose-passage", { title: "Decompose a passage into claims", description: "Every checkable assertion in a passage, typed by what would settle it.", argsSchema: { passage: z.string() } }, ({ passage }) => ({ messages: [{ role: "user", content: { type: "text", text: `Read this passage and list every assertion a reader could check. For each: a proposed id (lowercase slug), the epistemic kind (observation: data or research would settle it; argument: reasoning over premises; commitment: the author's decision is the backing; bet: the world will settle it), the claim as one sentence stated no stronger than the passage does, what would settle it, and three to six exact words from the passage to anchor on. Merge assertions that are one claim. Do not write anything; present the table for ruling.\n\nPassage:\n${passage}` } }] }));
  server.registerPrompt("search-for-the-opposite", { title: "Search for the opposite", description: "The strongest case against a claim and where its evidence would be found.", argsSchema: { claim: z.string() } }, ({ claim }) => ({ messages: [{ role: "user", content: { type: "text", text: `Take the claim ${claim} (read it with erf_record_read). State the strongest case against it as a reader who wants it to be false would: which premise is weakest, what evidence would refute it, and where that evidence would be found (name the kind of source, not an invented one). Then propose the searches to run, and run none without saying so. If the claim would survive only narrowed, propose the narrower title.` } }] }));
  server.registerPrompt("meaning-check", { title: "Meaning check", description: "Reading only these quotes, would you accept this claim?", argsSchema: { claim: z.string() } }, ({ claim }) => ({ messages: [{ role: "user", content: { type: "text", text: `Read claim ${claim} and each atom it lists in atoms_for (erf_record_read). Using only the verbatim quotes, not the findings and not what you know, say whether the quotes support the claim as titled: yes, only a narrower claim (state it), or no. Name any span of the title no quote covers.` } }] }));

  // resources: erf://<corpus>/<type>/<id>
  for (const t of ["claims", "atoms", "surveys"] as const) {
    server.registerResource(t, new ResourceTemplate(`erf://{corpus}/${t}/{id}`, { list: undefined }), { title: `ERF ${t}`, description: `A ${t.slice(0, -1)} record by corpus and id`, mimeType: "text/markdown" }, async (uri, vars) => {
      const c = resolveCorpus(ws, String(vars["corpus"] ?? "") || undefined);
      const id = String(vars["id"] ?? "");
      const p = recordFiles(c, t.slice(0, -1)).get(id);
      if (!p) throw new Error(`no ${t.slice(0, -1)} ${id} in ${c.id}`);
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: readFileSync(p, "utf8") }] };
    });
  }
  return server;
}

const isMain = process.argv[1] && /index\.ts$|erf-mcp$/.test(process.argv[1]);
if (isMain) {
  const a = args();
  const ws = openWorkspace(a.roots, { agent: a.agent, fetchEnabled: a.fetch, commit: a.commit });
  const server = buildServer(ws);
  await server.connect(new StdioServerTransport());
  const n = discover(ws).size;
  console.error(`erf-mcp: ${n} corpus/corpora under ${ws.roots.join(", ")}${ws.active ? `; active ${ws.active}` : ""}; fetch ${a.fetch ? "on" : "off"}; commits ${a.commit ? "on" : "off"}; agent ${a.agent}`);
}
