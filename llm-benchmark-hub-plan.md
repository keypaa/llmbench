# llmbench.dev — Implementation Plan v1.0

> Community-driven LLM inference speed database — llmbench.dev · Next.js 15 · Supabase · Vercel

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Technical Stack](#2-technical-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication](#5-authentication-better-auth)
6. [Pages & Features](#6-pages--features)
7. [Reputation System](#7-reputation-system)
8. [Theoretical Tok/s Estimator](#8-theoretical-toks-estimator)
9. [Data Seeding & HuggingFace Sync](#9-data-seeding--huggingface-sync)
10. [Moderation & Data Quality](#10-moderation--data-quality)
11. [API Routes](#11-api-routes)
12. [SEO Strategy](#12-seo-strategy)
13. [Supabase Row Level Security](#13-supabase-row-level-security)
14. [Deployment (Vercel)](#14-deployment-vercel)
15. [Sprint Plan](#15-sprint-plan)
16. [Post-MVP Roadmap](#16-post-mvp-roadmap)

---

## 1. Vision & Goals

llmbench.dev is an open-source, community-driven platform that answers the most common question in the LocalLLaMA community:

> *"How fast will model X run on my hardware?"*

It provides real, empirical benchmark data contributed by users — filterable by hardware, model, quantization, and inference engine — alongside theoretical performance estimates.

### Target audience

- Reddit/LocalLLaMA users wondering about performance on consumer GPUs (RTX 3070, 4090...)
- Researchers and ML engineers benchmarking server hardware (T4, L4, L40S, A100, H100...)
- Anyone choosing between quantization levels or inference engines

### Core principles

- **Data quality over quantity** — moderation and reputation system ensure trustworthy results
- **Community first** — contributors are empowered, not just consumers
- **Beginner-friendly** — smart defaults, tooltips, and contextual help throughout
- **Open source** — public GitHub repo, free to use, community-governed

---

## 2. Technical Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | Server components, ISR, SEO-friendly |
| Styling | Tailwind CSS + shadcn/ui | Fast iteration, consistent design system |
| Authentication | better-auth (self-hosted) | GitHub, Google, Discord OAuth out of the box |
| Database | Supabase (PostgreSQL) | Managed Postgres, RLS, realtime, free tier |
| ORM | Drizzle ORM | Type-safe, compatible with Supabase + better-auth |
| Validation | Zod | Shared schemas client + server |
| Charts | Recharts | React-native, no canvas issues on SSR |
| Deployment | Vercel | Zero-config Next.js, ISR, edge functions |
| CI/CD | GitHub Actions | Lint, type-check, deploy preview on PR |

---

## 3. Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/                  # Login page (GitHub, Google, Discord)
│   │   └── callback/               # OAuth callback handler
│   ├── (app)/
│   │   ├── page.tsx                # Homepage with Quick Lookup hero
│   │   ├── benchmarks/             # List view with filters
│   │   ├── benchmarks/[id]/        # Single benchmark detail page
│   │   ├── benchmarks/[hw]/[model] # SEO canonical page per hw+model combo
│   │   ├── submit/                 # Multi-step submission form
│   │   ├── submit/import/          # Batch import wizard (llama-bench)
│   │   ├── compare/                # Side-by-side comparison
│   │   ├── leaderboard/            # Hardware ranking
│   │   └── profile/[userId]/       # User profile + reputation
│   └── api/
│       ├── auth/[...all]/          # better-auth handler
│       ├── benchmarks/             # GET list, POST create
│       ├── benchmarks/[id]/        # GET detail, PATCH, DELETE
│       ├── benchmarks/[id]/upvote/ # POST upvote/unvote
│       ├── benchmarks/[id]/notes/  # GET/POST community notes
│       ├── benchmarks/import/      # POST batch import (llama-bench JSON)
│       ├── hardware/               # GET list, POST propose
│       ├── models/                 # GET list, POST propose
│       ├── estimate/               # GET theoretical tok/s
│       └── cron/hf-sync/           # GET cron — sync HuggingFace metadata
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── benchmark/                  # BenchmarkCard, BenchmarkTable, FilterPanel
│   ├── submit/                     # StepIndicator, HardwareStep, ModelStep...
│   ├── charts/                     # ToksPerSecChart, QuantCompareChart
│   └── layout/                     # Navbar, Footer, ThemeToggle
├── lib/
│   ├── auth.ts                     # better-auth config
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema (all tables)
│   │   └── index.ts                # DB client
│   ├── validators/                 # Zod schemas
│   ├── estimator.ts                # Theoretical tok/s calculator
│   └── hf-api.ts                   # HuggingFace API client
└── hooks/                          # useFilters, useBenchmarks, useDebounce
```

---

## 4. Database Schema

All tables use UUID primary keys. Drizzle ORM manages schema and migrations. Row Level Security (RLS) is enabled on all tables in Supabase.

### 4.1 `hardware`

Catalogue of all supported hardware. Supports GPU, CPU, APU, and Apple Silicon through the `architecture_type` flag.

```
hardware
├── id                      UUID PRIMARY KEY
├── type                    TEXT  -- 'GPU' | 'CPU' | 'APU'
├── architecture_type       TEXT  -- 'discrete_gpu' | 'integrated_gpu' | 'cpu_only' | 'apple_silicon'
├── brand                   TEXT  -- NVIDIA, AMD, Intel, Apple, Qualcomm...
├── name                    TEXT  -- RTX 3070, M3 Max, Ryzen 9 7950X...
├── vram_gb                 INT   -- null for cpu_only; equals ram_gb for apple_silicon
├── ram_gb                  INT   -- system RAM (relevant for CPU/APU/offload)
├── memory_bandwidth_gbps   REAL  -- GB/s — used for theoretical estimate
├── tdp_watts               INT
├── release_year            INT
├── status                  TEXT  DEFAULT 'pending'  -- 'pending' | 'approved'
└── created_at              TIMESTAMP
```

> **Multi-GPU note (post-MVP):** A future `hardware_configs` table will link multiple hardware rows with a config type (NVLink / PCIe gen). The `benchmarks` table will reference `hardware_config_id` instead of `hardware_id` when applicable. The schema is designed to support this migration without breaking changes.

### 4.2 `models`

```
models
├── id                  UUID PRIMARY KEY
├── name                TEXT  -- Qwen3-7B, Llama-3.1-8B...
├── family              TEXT  -- Qwen, Llama, Mistral, Gemma...
├── params_billion      REAL  -- 0.5, 7, 8, 70, 405...
├── context_length      INT   -- 32768, 128000...
├── hf_id               TEXT  -- e.g. Qwen/Qwen3-7B
├── hf_downloads        INT   -- synced via cron every 24h
├── hf_likes            INT
├── hf_tags             TEXT[]
├── hf_pipeline_tag     TEXT  -- 'text-generation'
├── status              TEXT  DEFAULT 'pending'
└── created_at          TIMESTAMP
```

### 4.3 `benchmarks` (central table)

```
benchmarks
├── id                          UUID PRIMARY KEY
├── user_id                     TEXT  REFERENCES users(id)
│
│   -- Hardware
├── hardware_id                 UUID  REFERENCES hardware(id)  NOT NULL
├── system_ram_gb               INT   -- system RAM during test
├── hardware_notes              TEXT  -- overclocking, cooling notes...
│
│   -- Model
├── model_id                    UUID  REFERENCES models(id)  NOT NULL
├── quantization                TEXT  -- 'none' | 'Q4_K_M' | 'Q8_0' | 'AWQ' | 'GPTQ'...
├── quant_bits                  REAL  -- 4, 5, 6, 8, 16, null
├── quant_format                TEXT  -- 'GGUF' | 'GPTQ' | 'AWQ' | 'EXL2' | 'BitsAndBytes' | 'none'
│
│   -- Engine
├── engine                      TEXT  NOT NULL  -- 'llama.cpp' | 'ollama' | 'vLLM' | 'SGLang'...
├── engine_version              TEXT  -- b3800, 0.4.0...
├── engine_params               JSONB -- { n_gpu_layers: 99, ctx_size: 4096, flash_attn: true... }
│
│   -- Results
├── tokens_per_second           REAL  NOT NULL  -- generation tok/s
├── prompt_tokens_per_second    REAL            -- prefill pp/s
├── time_to_first_token_ms      REAL            -- TTFT
├── parallel_requests           INT   DEFAULT 1
├── context_size                INT
├── os                          TEXT  -- 'Windows' | 'Linux' | 'macOS'
├── driver_version              TEXT  -- CUDA 12.4, ROCm 6.0...
│
│   -- Meta
├── status                      TEXT  DEFAULT 'pending'  -- 'pending' | 'verified' | 'rejected' | 'flagged'
├── upvotes                     INT   DEFAULT 0
├── source_url                  TEXT  -- screenshot or log link
├── notes                       TEXT  -- free text from contributor
├── import_source               TEXT  -- 'manual' | 'llama-bench' | 'vllm'
└── created_at                  TIMESTAMP
```

### 4.4 Supporting tables

```
benchmark_upvotes
├── user_id         TEXT  REFERENCES users(id)
├── benchmark_id    UUID  REFERENCES benchmarks(id)
└── PRIMARY KEY (user_id, benchmark_id)

community_notes
├── id              UUID PRIMARY KEY
├── benchmark_id    UUID  REFERENCES benchmarks(id)
├── user_id         TEXT  REFERENCES users(id)
├── content         TEXT  NOT NULL  -- max 280 chars
├── upvotes         INT   DEFAULT 0
├── pinned          BOOL  DEFAULT false  -- max 3 pinned per benchmark
└── created_at      TIMESTAMP

reputation_events
├── id              UUID PRIMARY KEY
├── user_id         TEXT  REFERENCES users(id)
├── event_type      TEXT  -- 'benchmark_verified' | 'upvote_received' | 'benchmark_rejected' | 'proof_bonus'
├── points          INT   -- +10, +2, -20, +5...
├── reference_id    UUID  -- benchmark or note that triggered the event
└── created_at      TIMESTAMP
```

---

## 5. Authentication (better-auth)

### 5.1 Supported providers

- **GitHub OAuth** — primary, most coherent with the developer audience
- **Google OAuth** — for broader accessibility
- **Discord OAuth** — natural fit for the LocalLLaMA/AI community

### 5.2 OAuth callback URLs

Configure these URLs in each provider's developer console.

**Development (localhost)**
```
http://localhost:3000/api/auth/callback/github
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/discord
```

**Staging / Dev deploy (Vercel)**
```
https://llmbench.vercel.app/api/auth/callback/github
https://llmbench.vercel.app/api/auth/callback/google
https://llmbench.vercel.app/api/auth/callback/discord
```

> ⚠️ The exact Vercel URL (`llmbench.vercel.app`) will be confirmed after first deploy. Update these accordingly. Each provider requires both localhost and Vercel URLs to be registered during development.

**Production (post-launch)**
```
https://llmbench.dev/api/auth/callback/github
https://llmbench.dev/api/auth/callback/google
https://llmbench.dev/api/auth/callback/discord
```

### 5.3 Configuration

```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  socialProviders: {
    github:  { clientId: process.env.GITHUB_CLIENT_ID!,  clientSecret: process.env.GITHUB_CLIENT_SECRET! },
    google:  { clientId: process.env.GOOGLE_CLIENT_ID!,  clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
    discord: { clientId: process.env.DISCORD_CLIENT_ID!, clientSecret: process.env.DISCORD_CLIENT_SECRET! },
  },
})

// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
export const { GET, POST } = toNextJsHandler(auth)
```

### 5.4 Environment variables

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://llmbench.dev

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

---

## 6. Pages & Features

### 6.1 Homepage `/`

The hero section answers the canonical question immediately with a **Quick Lookup** widget:

```
┌──────────────────────────────────────────────────────────────┐
│  How fast will  [Qwen3 7B ▾]  run on  [RTX 3070 8GB ▾] ?   │
│  with  [llama.cpp ▾]   [Q4_K_M ▾]                          │
│                  [ Find Benchmarks → ]                       │
└──────────────────────────────────────────────────────────────┘
```

Below the hero: live stats (total benchmarks, GPUs covered, models covered), then the 10 most recent verified benchmarks.

### 6.2 Benchmarks list `/benchmarks`

Filters via a collapsible panel:
- Hardware: type (GPU/CPU/APU), brand, VRAM range slider
- Model: family multi-select, parameter size slider
- Quantization: format and bits
- Engine: multi-select checkbox
- OS: Windows / Linux / macOS
- Parallel requests: 1 / 2–4 / 8+
- Sort: tok/s desc, date desc, upvotes desc

Results table columns: `Hardware · Model · Quant · Engine · tok/s · pp/s · TTFT · Parallel · OS · Votes · Date`

Each row links to the detail page. A "Compare" checkbox allows selecting up to 4 rows for side-by-side comparison.

### 6.3 Benchmark detail `/benchmarks/[id]`

- Full configuration details (engine params, driver, notes)
- Community notes (max 3 pinned, voted by community)
- Theoretical tok/s estimate shown alongside (if model fits in VRAM)
- Link to contributor profile + their reputation score
- Upvote button (authenticated users only)

### 6.4 SEO canonical pages `/benchmarks/[hw-slug]/[model-slug]`

Pre-generated static pages for popular hardware+model combinations (ISR with revalidation every hour). These target Google searches like "RTX 3070 Qwen3 7B performance". Dynamic Open Graph tags and JSON-LD structured data on every page.

### 6.5 Submit `/submit` — multi-step form

| Step | Fields | Notes |
|---|---|---|
| 1 — Hardware | Autocomplete GPU/CPU search, system RAM | Propose new hardware if not found (admin-validated) |
| 2 — Model | Autocomplete model search, HF metadata shown | Propose new model if not found (admin-validated) |
| 3 — Quantization | Format (GGUF/GPTQ/AWQ/EXL2/BF16/None), level | Tooltip explains each level for beginners |
| 4 — Engine & Config | Engine select, version, conditional params per engine | llama.cpp: n_gpu_layers, ctx; vLLM: tensor_parallel... |
| 5 — Results | tok/s (required), pp/s, TTFT, parallel reqs, ctx size, OS, driver | Theoretical estimate shown for comparison |
| 6 — Review & Submit | Full summary before submission | `status = pending` on save |

> **Beginner-friendly defaults:** When a user selects a GPU and model, the form pre-fills sensible defaults (`n_gpu_layers: 99`, `ctx_size: 4096`, quant: `Q4_K_M`). A VRAM fit indicator shows whether the selected model+quant fits in the GPU's VRAM.

### 6.6 Batch import `/submit/import`

Supports importing multiple benchmarks from **llama-bench JSON** (MVP). Three-step wizard:

1. User pastes JSON output or uploads a file
2. Auto-detection of format. Fields not present in the export (OS, driver, notes) are prompted manually
3. Review mapped results before submitting all

```json
// Expected llama-bench JSON format
{
  "model": "Qwen3-7B-Q4_K_M.gguf",
  "n_gpu_layers": 99,
  "n_threads": 8,
  "n_prompt": 512,
  "n_gen": 128,
  "test": "tg128",
  "avg_ts": 104.2,
  "t_pp_ms": 812
}
```

vLLM import support will be added post-MVP once the output format is stabilized.

### 6.7 Compare `/compare`

Select 2–4 benchmarks and compare side by side with grouped bar charts (Recharts) for tok/s, pp/s, and TTFT. Shareable via URL (benchmark IDs encoded in query params).

### 6.8 Leaderboard `/leaderboard`

Hardware ranked by average tok/s on a reference model (default: Llama 3.1 8B Q4_K_M). Filterable by VRAM category: ≤8 GB, ≤16 GB, ≤24 GB, 24 GB+.

### 6.9 Profile `/profile/[userId]`

- Reputation score + rank (Regular / Trusted Contributor / Admin)
- All submitted benchmarks with their status (pending / verified / rejected)
- Reputation event history

---

## 7. Reputation System

Reputation quantifies the trustworthiness of a contributor's benchmarks. It is calculated from `reputation_events` and displayed publicly on user profiles.

| Event | Points | Trigger |
|---|---|---|
| Benchmark verified | +10 | Admin marks benchmark as verified |
| Upvote received | +2 | Another user upvotes your benchmark |
| Proof link bonus | +5 | Verified benchmark includes a `source_url` |
| Benchmark rejected | -20 | Admin rejects a submitted benchmark |
| **Trusted Contributor threshold** | **100 pts** | Unlocks ability to validate hardware/model proposals |

> **Future — peer verification:** Once the user base grows, trusted contributors (100+ pts) will be able to verify benchmarks, replacing the admin-only workflow. A benchmark will auto-verify after 3 upvotes from trusted contributors who have themselves submitted at least one verified benchmark.

---

## 8. Theoretical Tok/s Estimator

For hardware+model+quant combinations with no empirical data yet, the site shows a theoretical estimate based on memory bandwidth.

### 8.1 Formula

```typescript
// lib/estimator.ts

const BYTES_PER_PARAM: Record<string, number> = {
  'none':   2,       // BF16/FP16
  'Q8_0':   1,
  'Q6_K':   0.75,
  'Q5_K_M': 0.625,
  'Q4_K_M': 0.5,
  'Q3_K_M': 0.375,
  'Q2_K':   0.25,
}

export function theoreticalToksPerSecond(
  memoryBandwidthGbps: number,  // e.g. 448 for RTX 3070
  paramsBillion: number,         // e.g. 7 for Qwen3-7B
  quantFormat: string            // e.g. 'Q4_K_M'
): number | null {
  const bpp = BYTES_PER_PARAM[quantFormat]
  if (!bpp) return null
  const modelSizeGb = paramsBillion * bpp
  // Only called when model fits in VRAM (checked by caller)
  return (memoryBandwidthGbps / modelSizeGb) * 0.85  // 85% efficiency factor
}
```

### 8.2 Display rules

- Estimate shown **only** when `modelSizeGb < vram_gb`
- If the model doesn't fit: `"Model may not fit in VRAM — estimate unavailable"` + VRAM required
- Estimate is clearly labeled as theoretical (dashed border, info icon)
- CPU-only, APU, Apple Silicon: **no estimate for MVP** (insufficient correlation data)

---

## 9. Data Seeding & HuggingFace Sync

### 9.1 Initial seed strategy

The database will **not** be empty at launch. The author will pre-populate it with real benchmarks run on server hardware (T4, L4, L40S). Consumer GPU benchmarks will be added progressively.

A seed script will pre-populate hardware and model catalogues:

- **GPUs:** RTX 3060/3070/3080/3090, RTX 4070/4080/4090, RTX 5080/5090, T4, L4, L40S, A100, H100, RX 7900 XTX
- **CPUs:** Ryzen 9 7950X, Core i9-13900K (cpu_only configs)
- **Apple Silicon:** M2 Pro, M3 Max, M4 Ultra
- **Models:** Top 20 HuggingFace models by downloads in `text-generation`

### 9.2 HuggingFace sync cron

A Vercel cron job runs daily at 03:00 UTC via `/api/cron/hf-sync`:

- Syncs `downloads`, `likes`, `tags` from HF `/api/models/{hf_id}`
- Attempts to retrieve file sizes from `siblings[].size` (best-effort, may be null)
- Adds new popular models automatically if downloads exceed a threshold

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/hf-sync", "schedule": "0 3 * * *" }
  ]
}
```

---

## 10. Moderation & Data Quality

### 10.1 Three-layer validation

| Layer | Mechanism | What it catches |
|---|---|---|
| 1 — Client-side | Zod schema + React form validation | Missing fields, invalid ranges, type errors |
| 2 — Server-side | Zod + plausibility checks in API route | Outliers: tok/s > 5000, VRAM mismatch, impossible TTFT |
| 3 — Human | Admin review + community upvotes | Context errors, fake results, suspicious outliers |

### 10.2 Automatic outlier detection

When a new benchmark is submitted, the API computes the median tok/s for the same hardware+model+quant combination. If the new result is more than **3× the median** (or less than 0.3×), it is automatically flagged (`status = 'flagged'`) and queued for admin review.

### 10.3 Community notes

Each benchmark supports up to **3 pinned community notes** (max 280 chars each). Notes are upvotable and can only be pinned by admins or trusted contributors. This surfaces context ("measured with thermal throttling", "flash_attn enabled") without the noise of a comment section.

### 10.4 Anti-abuse

- Rate limiting: max **10 submissions/user/hour** (Vercel edge middleware)
- IP-based rate limiting on submit API for unauthenticated requests
- Admin can ban a user and cascade-reject all their pending benchmarks
- `source_url` (screenshot, terminal log) contributes to the proof bonus (+5 reputation)

---

## 11. API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/benchmarks` | GET | Public | List with query params: hardware, model, engine, quant, status, sort, page |
| `/api/benchmarks` | POST | Required | Submit benchmark — validated against Zod schema |
| `/api/benchmarks/[id]` | GET | Public | Detail with hardware, model, user reputation |
| `/api/benchmarks/[id]/upvote` | POST | Required | Toggle upvote — updates count + creates reputation_event |
| `/api/benchmarks/[id]/notes` | GET / POST | GET public / POST required | Community notes for a benchmark |
| `/api/benchmarks/import` | POST | Required | Batch import — accepts llama-bench JSON array |
| `/api/hardware` | GET | Public | Hardware catalogue with search + filter |
| `/api/hardware` | POST | Required | Propose new hardware — `status: pending`, admin validates |
| `/api/models` | GET | Public | Model catalogue — includes HF metadata |
| `/api/models` | POST | Required | Propose new model — `status: pending`, admin validates |
| `/api/estimate` | GET | Public | Theoretical tok/s for `hardware_id` + `model_id` + `quant` |
| `/api/cron/hf-sync` | GET | Cron secret | Sync HuggingFace model metadata (Vercel cron) |

---

## 12. SEO Strategy

SEO is a primary acquisition channel. The typical Google query is *"RTX 3070 llama 8B performance"* or *"Qwen3 7B 8GB VRAM speed"*.

- Each hardware+model combination has a canonical static URL: `/benchmarks/rtx-3070-8gb/qwen3-7b`
- Pages are statically generated with `generateStaticParams` for the top 500 combinations and revalidated hourly (ISR)
- Dynamic Open Graph images generated per page showing the top tok/s result
- Structured data (JSON-LD) on every benchmark page for rich snippets
- `sitemap.xml` auto-generated and submitted to Google Search Console
- Page titles follow the pattern: `RTX 3070 + Qwen3 7B — 104 tok/s | llmbench.dev`

---

## 13. Supabase Row Level Security

```sql
-- Public read on verified benchmarks only
CREATE POLICY "public_read_verified"
ON benchmarks FOR SELECT
USING (status = 'verified');

-- Authenticated users can read their own pending benchmarks
CREATE POLICY "user_read_own"
ON benchmarks FOR SELECT
USING (auth.uid()::text = user_id);

-- Authenticated users can insert benchmarks
CREATE POLICY "user_insert"
ON benchmarks FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- One upvote per user per benchmark
CREATE POLICY "one_upvote_per_user"
ON benchmark_upvotes FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Hardware and models: public read approved, authenticated propose
CREATE POLICY "public_read_hardware"
ON hardware FOR SELECT USING (status = 'approved');

CREATE POLICY "user_propose_hardware"
ON hardware FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 14. Deployment (Vercel)

### 14.1 `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/hf-sync", "schedule": "0 3 * * *" }
  ],
  "functions": {
    "app/api/**": { "maxDuration": 10 }
  }
}
```

### 14.2 Pre-launch checklist

- [ ] All env variables set in Vercel Dashboard (prod + preview)
- [ ] OAuth callback URLs updated on GitHub/Google/Discord for prod domain
- [ ] Supabase RLS policies enabled and tested
- [ ] `drizzle-kit push` run on prod database
- [ ] Seed script executed (hardware, models, initial benchmarks)
- [ ] Vercel cron job verified (call `/api/cron/hf-sync` manually)
- [ ] Google Search Console: sitemap submitted
- [ ] Rate limiting tested (submit form spam)
- [ ] Admin panel accessible and functional
- [ ] Ultrawide layout tested (2560px+)

---

## 15. Sprint Plan

| Sprint | Duration | Deliverables |
|---|---|---|
| **Sprint 1 — Foundations** | 3–4 days | Repo setup, Drizzle schema, Supabase connection, better-auth (GitHub/Google/Discord), basic layout + dark mode |
| **Sprint 2 — Data layer** | 3–4 days | Hardware + model catalogues, seed script, HF sync cron, `/api/benchmarks` GET with filters, `/benchmarks` list page |
| **Sprint 3 — Submission** | 4–5 days | Multi-step submit form, Zod validation, outlier detection, `/api/benchmarks` POST, VRAM fit indicator, theoretical estimator |
| **Sprint 4 — Community** | 3–4 days | Upvotes, reputation system, community notes, user profile page, admin moderation queue |
| **Sprint 5 — Discovery** | 3–4 days | Compare page, Leaderboard, Quick Lookup homepage, SEO canonical pages (ISR), Open Graph |
| **Sprint 6 — Import & Polish** | 2–3 days | llama-bench import wizard, ultrawide layout polish, rate limiting, pre-launch checklist |
| **Sprint 7 — Launch** | 1–2 days | Production deploy, seed initial data, Search Console, announcement post |

**Total estimated time: 4–6 weeks for a complete, production-ready MVP.**

---

## 16. Post-MVP Roadmap

| Feature | Priority | Notes |
|---|---|---|
| Multi-GPU support (NVLink / PCIe) | High | `hardware_configs` table + schema migration (already planned) |
| vLLM batch import | High | Once vLLM standardizes benchmark output format |
| CPU-only + APU estimation | Medium | Needs more empirical data for bandwidth→tok/s correlation |
| Apple Silicon estimation | Medium | Unified memory architecture needs separate modelling |
| Embed widget / README badge | Low | iframe or SVG badge showing best tok/s for a combination |
| Public REST API | Low | Read-only API for third-party tools |
| French translation | Low | i18n infrastructure needed first |
| Mobile layout | Low | Responsive foundation already in place |

---

*llmbench.dev · Open Source · Deploy on Vercel · Powered by Supabase + Next.js*
