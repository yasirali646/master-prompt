<div align="center">

# Master Prompt

**Turn one-line ideas into structured, state-machine master prompts for AI agents.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![NextAuth](https://img.shields.io/badge/NextAuth-v5-000?style=for-the-badge&logo=auth0&logoColor=white)](https://authjs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

![Master Prompt banner — dark UI with generate flow](docs/images/readme-banner.png)

[Quick Start](#quick-start) · [Features](#features) · [Configuration](#configuration) · [Architecture](#architecture)

</div>

---

## Overview

Master Prompt is a **Next.js 15** web app that transforms short ideas into production-ready **state-machine system prompts** — with streaming generation, multi-provider AI, quality scoring, refine loops, exports, and share links.

| | |
|---|---|
| **Generate** | One-line idea → full structured prompt |
| **Providers** | OpenAI, Anthropic, Google Gemini, Groq |
| **Privacy** | API keys stay in your browser — never in MySQL |
| **Auth** | Optional Google / GitHub sign-in |

---

## Screenshots

### Generate from an idea

![Generate flow — idea input, templates, and provider selection](docs/images/generate-flow.svg)

### Structured output & quality score

![Output panel with structured preview, quality score, and export actions](docs/images/output-preview.svg)

---

## Quick Start

```bash
git clone <your-repo-url>
cd master-prompt
npm install
cp .env.example .env.local
```

Configure `AUTH_SECRET`, OAuth credentials, and `DATABASE_URL` in `.env.local`, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and add LLM API keys under **Settings → API Keys**.

### MySQL (signed-in users)

```bash
mysql -e "CREATE DATABASE master_prompt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Set in `.env.local`:

```env
DATABASE_URL=mysql://user:password@localhost:3306/master_prompt
```

Tables are created automatically on first use.

---

## Architecture

![Data architecture — browser local storage, Next.js API, MySQL](docs/images/architecture.svg)

| Signed in? | Settings, history, templates, usage | API keys |
|------------|-------------------------------------|----------|
| No | Browser `localStorage` | Browser only (encrypted) |
| Yes | MySQL (per account) | Browser only — **never in MySQL** |

When you sign in after using the app as a guest, local data syncs once to your account via `/api/sync`.

---

## Features

### Core
- **Generate** — one-line idea → full state-machine master prompt
- **Import** — paste an existing prompt and restructure it
- **Streaming** — live token output with stop button
- **Refine loop** — iterate with natural-language instructions
- **A/B compare** — OpenAI vs Anthropic side-by-side

### Output
- **Structured preview** — navigable sections with table of contents
- **Quality score** — 0–100 checklist (sections, states, STOP rules, etc.)
- **Export** — `.txt`, `.md`, `.docx`, `.json`
- **Test sandbox** — preview STATE 1 behavior
- **Share links** — public read-only pages at `/p/[id]`

### Productivity
- **Prompt history** — `/history`
- **Example templates** — 8 built-in starters + custom templates
- **Auto-save draft** — idea persisted locally
- **Cmd+Enter** — keyboard shortcut to generate

### Platform
- **Google & GitHub OAuth** — NextAuth v5
- **Rate limiting** — `RATE_LIMIT_PER_MINUTE`
- **Dark / light theme**
- **SEO** — Open Graph, sitemap, robots.txt, JSON-LD

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

---

## Configuration

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Session secret (`openssl rand -base64 32`) |
| `AUTH_URL` | App URL (`http://localhost:3000` in dev) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `DATABASE_URL` | MySQL connection URL |
| `NEXT_PUBLIC_SITE_URL` | Public URL for SEO (defaults to `AUTH_URL`) |
| `RATE_LIMIT_PER_MINUTE` | API rate limit (default `20`) |

LLM API keys are configured in the app under **Settings → API Keys**, not in `.env`.

### OAuth redirect URIs

| Provider | Callback URL |
|----------|--------------|
| Google | `http://localhost:3000/api/auth/callback/google` |
| GitHub | `http://localhost:3000/api/auth/callback/github` |

---

## Project Structure

```
app/              # Pages, API routes, SEO (sitemap, robots, OG)
components/       # React UI
hooks/            # useStream and client hooks
lib/              # Generator, providers, MySQL stores, SEO
docs/images/      # README screenshots and diagrams
```

---

## Tech Stack

<p>
  <img src="https://img.shields.io/badge/AI_SDK-Vercel-black?style=flat-square" alt="Vercel AI SDK"/>
  <img src="https://img.shields.io/badge/docx-export-2B579A?style=flat-square" alt="DOCX export"/>
  <img src="https://img.shields.io/badge/mysql2-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="mysql2"/>
  <img src="https://img.shields.io/badge/Edge_OG_Image-000?style=flat-square" alt="Dynamic OG"/>
  <img src="https://img.shields.io/badge/LocalStorage-AES--GCM-22c55e?style=flat-square" alt="Encrypted keys"/>
</p>

---

<div align="center">

**MIT License** — see [LICENSE](LICENSE)

Made for builders who care about prompt structure, not prompt chaos.

</div>
