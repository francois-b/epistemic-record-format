/**
 * The host side of the preview page, bundled by preview-app.ts: a real
 * AppBridge over a postMessage transport to an iframe that holds the real app
 * bundle, so the app runs the code it runs in Claude Desktop. The host
 * answers what a host answers; tool calls go to the preview server when one
 * is serving, and writes are refused either way.
 */
import { AppBridge } from "@modelcontextprotocol/ext-apps/app-bridge";
import { PostMessageTransport } from "@modelcontextprotocol/ext-apps";

interface Preview {
  app: string; page: string; mode: "inline" | "fullscreen"; theme: "dark" | "light"; serve: boolean;
  content: { content: { type: "text"; text: string }[]; structuredContent: Record<string, unknown> };
}
const P = (window as unknown as { __ERF_PREVIEW__: Preview }).__ERF_PREVIEW__;

const logEl = document.getElementById("log") as HTMLElement;
function log(line: string): void { console.log(`[preview] ${line}`); const d = document.createElement("div"); d.textContent = line; logEl.appendChild(d); }
const textOf = (p: { content?: { type: string; text?: string }[] }): string => (p.content ?? []).map((c) => c.text ?? `<${c.type}>`).join(" ");

// the design guide's style tokens, so the frame around the app looks like the host's
const TOKENS: Record<Preview["theme"], Record<string, string>> = {
  light: { "--color-background-primary": "#FFFFFF", "--color-background-secondary": "#F5F4ED", "--color-background-tertiary": "#FAF9F5", "--color-text-primary": "#141413", "--color-text-secondary": "#3D3D3A", "--color-text-tertiary": "#73726C", "--color-border-primary": "rgba(31,30,29,.4)", "--color-border-tertiary": "rgba(31,30,29,.15)" },
  dark: { "--color-background-primary": "#30302E", "--color-background-secondary": "#262624", "--color-background-tertiary": "#141413", "--color-text-primary": "#FAF9F5", "--color-text-secondary": "#C2C0B6", "--color-text-tertiary": "#9C9A92", "--color-border-primary": "rgba(222,220,209,.4)", "--color-border-tertiary": "rgba(222,220,209,.15)" },
};
for (const [k, v] of Object.entries(TOKENS[P.theme])) document.documentElement.style.setProperty(k, v);

const frame = document.getElementById("frame") as HTMLElement;
const iframe = document.getElementById("app") as HTMLIFrameElement;
let mode = P.mode;
function setMode(m: string): void {
  mode = m === "fullscreen" ? "fullscreen" : "inline";
  document.body.classList.toggle("fullscreen", mode === "fullscreen");
  if (mode === "fullscreen") iframe.style.height = "";
  log(`display mode: ${mode}`);
}

const hostContext = {
  theme: P.theme, displayMode: P.mode, availableDisplayModes: ["inline", "fullscreen"] as ("inline" | "fullscreen")[],
  safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }, platform: "desktop" as const, locale: "en",
  // no `styles`: the app validates the initialize result against the spec, whose style block requires every token
  // (76 of them); the guide's tokens go on the frame instead, which is where the app's own variables come from
};
const bridge = new AppBridge(null, { name: "erf-preview", version: "0" }, { openLinks: {}, serverTools: {}, updateModelContext: {}, message: {}, logging: {} }, { hostContext });

bridge.oncalltool = async (params) => {
  log(`callServerTool ${params.name} ${JSON.stringify(params.arguments ?? {})}`);
  if (!P.serve) return { isError: true, content: [{ type: "text", text: `preview: no server behind this page; run with --serve to answer ${params.name}` }] };
  const r = await fetch("/tool", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(params) });
  return (await r.json()) as { content: { type: "text"; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };
};
bridge.onmessage = async (p) => { log(`sendMessage: ${textOf(p)}`); return {}; };
bridge.onupdatemodelcontext = async (p) => { log(`updateModelContext: ${textOf(p)}`); return {}; };
bridge.onopenlink = async (p) => { log(`openLink: ${p.url}`); window.open(p.url, "_blank", "noopener"); return {}; };
bridge.onrequestdisplaymode = async (p) => { setMode(p.mode); return { mode }; };
bridge.onsizechange = (p) => { log(`size-changed ${JSON.stringify(p)}`); if (mode !== "fullscreen" && typeof p.height === "number") iframe.style.height = `${Math.ceil(p.height)}px`; };
// inline, the host sizes the frame to the app's content; the app reports it, and the frame also measures the
// document itself (same-origin srcdoc) so a missed report never leaves the card clipped
setInterval(() => {
  if (mode === "fullscreen") return;
  const h = iframe.contentDocument?.documentElement?.scrollHeight;
  if (h && Math.abs(h - iframe.clientHeight) > 2) iframe.style.height = `${h}px`;
}, 400);
bridge.onloggingmessage = (p) => log(`server log ${p.level}: ${String(p.data)}`);
bridge.oninitialized = () => {
  log(`initialized · page ${P.page} · ${P.content.structuredContent["kind"] === "proposals" ? "erf_proposals" : "erf_view"} result delivered`);
  void bridge.sendToolInput({ arguments: { page: P.page } });
  void bridge.sendToolResult({ content: P.content.content, structuredContent: P.content.structuredContent });
};

// connect before the app loads: the WindowProxy is stable across the srcdoc navigation, so the transport bound now
// hears the app's ui/initialize the moment its script runs
setMode(P.mode);
const transport = new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!);
await bridge.connect(transport);
iframe.srcdoc = P.app;
frame.dataset["ready"] = "1";
