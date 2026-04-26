# ⚡ ScoutAI

**AI-powered talent scouting that finds candidates who fit the role — and actually want to hear from you.**

[Live Demo](https://scoutai.vercel.app) · [Demo Video](#) · [Catalyst Hackathon Submission](#)

---

## The Problem

Every recruiting tool ranks candidates by skill match. But skill match alone misses half the picture.

A **95% match** who's happy at their current job and ignores your message is worth less than a **75% match** who's actively looking, asks three specific questions about your tech stack, and follows up the next day.

ScoutAI surfaces both signals — **fit** and **genuine interest** — and lets you weight them yourself.

---

## How It Works

Paste a job description. ScoutAI runs a 5-stage autonomous pipeline and returns a ranked shortlist in under 90 seconds.

```mermaid
graph LR
    JD[Job Description] --> Parse[1. Parse JD\nSonnet]
    Parse --> Discover[2. Discover\nKeyword · Top 20]
    Discover --> Match[3. Match Score\nSonnet · Batches of 5]
    Match --> Engage[4. Engage\nHaiku · Top 10 · Parallel]
    Engage --> Interest[5. Interest Score\nSonnet · Batches of 5]
    Interest --> UI[Ranked Table\nWeight Slider · Client-side]
```

### Stage Breakdown

| # | Stage | Model | What happens |
|---|-------|-------|--------------|
| 1 | **Parse** | Sonnet | Extracts role, skills, seniority, domain from raw JD text |
| 2 | **Discover** | — | Keyword scoring narrows 60 candidates → top 20, zero API cost |
| 3 | **Match** | Sonnet | Scores each candidate on skill fit (0–100) with strengths & gaps |
| 4 | **Engage** | Haiku | Simulates a recruiter outreach conversation per candidate, driven by their life state |
| 5 | **Interest** | Sonnet | Reads each transcript, scores genuine interest (0–100) with engagement signals |

The **weight slider** re-ranks candidates instantly in your browser — no API call, no reload.

---

## Two Scores, Not One

Most tools give you one score. ScoutAI gives you two — because hiring has two problems:

- **Match Score** — Can this person do the job?
- **Interest Score** — Do they actually want to?

Drag the slider to weight what matters more for your role. High-urgency hire? Weight interest. Niche technical role? Weight match.

---

## Candidate Life States

ScoutAI models each candidate's current situation, which directly shapes how they respond to outreach:

| State | Behavior |
|-------|----------|
| 🟢 Actively Looking | Enthusiastic, fast responses, asks about timeline |
| 🟡 Passive / Open | Cautious but curious, asks about comp and culture |
| 🔴 Happy / Not Looking | Polite decline, vague responses |
| 🟠 Just Laid Off | High interest, asks about stability |
| 🟣 Counter-offer Zone | Negotiating, mentions competing offers |

---

## Setup

```bash
git clone https://github.com/Nova6278/ScoutAI.git
cd ScoutAI
pnpm install
```

Create `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
USE_MOCK=true
```

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), paste a JD, click **Start Scouting**.

---

## Cost & Credits

| Mode | Cost per run |
|------|-------------|
| `USE_MOCK=true` | $0.00 — instant, pre-canned responses |
| `USE_MOCK=false` | ~$0.80 — real Claude pipeline |

Every real API response is cached to `.cache/` keyed by request hash. Running the same JD twice costs $0 after the first time.

---

## Sample JDs to Try

Paste either of these to see the pipeline in action:

**Senior Backend Engineer**
```
Senior Backend Engineer — Fintech startup, Series B
5+ years backend experience. Strong Python or Go. PostgreSQL, Redis, AWS.
Experience with microservices and REST APIs. Kubernetes a plus.
Remote-friendly, SF timezone preferred.
```

**ML Engineer**
```
ML Engineer — AI-first product company
3+ years ML engineering. PyTorch, LLMs, RAG pipelines.
Experience fine-tuning and deploying models in production.
Familiarity with vector databases (Pinecone, Weaviate). Remote OK.
```

---

## Tech Stack

- **Framework** — Next.js 14 App Router + TypeScript
- **Styling** — Tailwind CSS + shadcn/ui
- **AI** — `@anthropic-ai/sdk` — Sonnet for reasoning, Haiku for conversations
- **Validation** — Zod for all structured LLM outputs
- **Cache** — File-based response cache (`.cache/`)
- **Deploy** — Vercel

---

## Key Design Decisions

**Why two scores?**
Match score answers "can they do the job?" Interest score answers "will they respond?" Combining them avoids spending recruiter time chasing top-matches who never reply.

**Why Haiku for conversations?**
Simulating 4-turn conversations with Sonnet costs ~5× more with no meaningful quality difference for engagement signal extraction. Haiku handles persona roleplay well at a fraction of the cost.

**Why keyword discovery over embeddings?**
Embeddings require a vector DB or embedding API call. Pure keyword overlap gets 80% of the signal for 0% of the infrastructure cost — the right trade for a demo-scale dataset.

**Why file cache?**
Every Claude call is cached by MD5 hash of the full request. Iterating on UI is free. Running the same JD twice costs $0.

---

## Known Limitations

- Discovery uses keyword matching, not semantic search — "ML Engineer" won't surface "Research Scientist" unless skills overlap
- Conversations are simulated, not real outreach — interest scores reflect persona fidelity, not actual candidate behavior
- No persistent storage — results live in browser memory until page refresh
- 60 candidates is a demo dataset; production would connect to a real talent database (LinkedIn, Wellfound, Naukri)

---

## Development Notes

Built in one weekend for the Catalyst Hackathon. Architecture, scoring logic, persona design, and prompt engineering are original work. Claude Code assisted with scaffolding and boilerplate.

---

## Submission

- 🌐 **Live URL** — [ScoutAI](scout-ai-flax.vercel.app)
- 💻 **GitHub** — [GitHub](https://github.com/Nova6278/ScoutAI)
- 🎥 **Demo Video** — [Loom](https://www.loom.com/share/3cce20cc134e4a6aaf6b714c52925805)
