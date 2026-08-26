------------------------------------------------------------------------

## What It Does

[](#what-it-does)

Agent Blame tracks AI-generated code in your Git history:

- **CLI** - See which lines were written by AI in any file
- **Browser Extension** - View AI markers directly on GitHub PRs (Chrome & Firefox)
- **Automatic** - Works silently with Cursor, Claude Code, and OpenCode
- **Squash-Safe** - Attribution survives squash and rebase merges

------------------------------------------------------------------------

## Prerequisites

[](#prerequisites)

- [Bun](https://bun.sh/) runtime (required for hooks)
- Git 2.25+
- Cursor, Claude Code, or OpenCode

    # Install Bun if you haven't already
    curl -fsSL https://bun.sh/install | bash

------------------------------------------------------------------------

## Quick Start

[](#quick-start)

### 1. One-Time Machine Setup

[](#1-one-time-machine-setup)

Run this once on your machine to create the local database and the `ab` shorthand:

    bunx @mesadev/agentblame@latest setup

> After setup, restart your terminal. You can now use `ab` instead of `bunx @mesadev/agentblame@latest` for all commands.

### 2. Repository Setup

[](#2-repository-setup)

In each git repository you want to track:

    ab init

This sets up everything automatically for your repository:

- Editor hooks for Cursor, Claude Code, and OpenCode
- Git post-commit hook for attribution capture
- GitHub Actions workflow for squash/merge support

> **Important:** Restart your editor after running `ab init`.

[](/mesa-dot-dev/agentblame/blob/main/docs/agentblame-install.gif)

------------------------------------------------------------------------

### 3. Commit the Config Files

[](#3-commit-the-config-files)

Commit the generated config files so your team gets the hooks:

    git add .cursor/ .claude/ .opencode/ .github/
    git commit -m "Add Agent Blame hooks and workflow"
    git push

------------------------------------------------------------------------

### 4. Install Browser Extension

[](#4-install-browser-extension)

See AI attribution directly on GitHub Pull Requests.

- **Chrome** - [Chrome Web Store](https://chromewebstore.google.com/detail/agent-blame/ofldnnppeiicgpmpgkbmipbcnhnbgccp)
- **Firefox** - [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/agentblame/)

After installing, click the extension icon and add your GitHub token.

**GitHub Token**

You can use either Fine Grained Tokens (recommended) or Classic Tokens:

| Token Type | Where to Create | Required Scope |
|----|----|----|
| Fine Grained (recommended) | [Settings → Fine-grained tokens](https://github.com/settings/tokens?type=beta) | `contents: read` for your repo |
| Classic | [Settings → Tokens (classic)](https://github.com/settings/tokens) | `repo` scope |

[](/mesa-dot-dev/agentblame/blob/main/docs/token-permissions.png)

[](/mesa-dot-dev/agentblame/blob/main/docs/chrome-install.gif)

------------------------------------------------------------------------

### 5. View Attribution

[](#5-view-attribution)

Make AI edits, commit, then view attribution in CLI or GitHub PRs:

    ab blame src/auth.ts

[](/mesa-dot-dev/agentblame/blob/main/docs/agentblame-attribution.gif)

------------------------------------------------------------------------

## Browser Extensions

[](#browser-extensions)

### PR Attribution

[](#pr-attribution)

[](/mesa-dot-dev/agentblame/blob/main/docs/pr-attribution.png)

- **PR summary** at the top of every PR showing AI-generated vs human-written line counts and overall AI percentage
- **File-level badges** in the diff header for each file
- **Line-level gutter markers** that highlight AI-generated lines in orange
- **Hover details** on any gutter marker showing the tool, model, and prompt used to generate that code

### Analytics Dashboard

[](#analytics-dashboard)

Full repository-wide analytics, accessible from the **Insights** sidebar on any GitHub repository.

[](/mesa-dot-dev/agentblame/blob/main/docs/analytics-dashboard.png)

- **Summary stats** showing AI vs human percentages, total lines tracked, and commit-to-prompt ratio
- **Tool breakdown** showing which AI tools (Cursor, Claude Code, OpenCode, etc.) generated the most code
- **Model breakdown** with the top models used across the repository
- **Trend charts** for AI code percentage, prompt efficiency, tool usage, and model usage over time
- **Time period filtering** to slice all metrics by past 24 hours, 3 days, week, month, or all time
- **Per-contributor stats** with AI usage percentage, commit-to-prompt ratio, and line counts
- **Recent PR activity** listing the latest PRs with AI attribution badges and diff stats

------------------------------------------------------------------------
