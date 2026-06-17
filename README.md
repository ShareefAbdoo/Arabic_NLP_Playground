# Arabic NLP Playground — أداة تحليل النص العربي

A browser-based tool that analyses Arabic text in real time across three NLP tasks: **sentiment**, **dialect detection**, and **named entity recognition (NER)**.

Live demo: deploy to GitHub Pages using the included workflow (see [Deploy](#deploy)).

---

## Features

| Task | Model | Notes |
|------|-------|-------|
| Sentiment | `CAMeL-Lab/bert-base-arabic-camelbert-mix-sentiment` | Positive / Negative / Neutral with confidence bar |
| Dialect | `meta-llama/Llama-3.1-8B-Instruct` (via HF router) | 9 dialects — MSA, Saudi, Gulf, Iraqi, Levantine, Egyptian, Sudanese, Yemeni, Maghrebi |
| NER | `CAMeL-Lab/bert-base-arabic-camelbert-mix-ner` | Highlights persons, locations, organisations |

- RTL layout, Arabic UI strings throughout
- Voice input via Web Speech API
- 300 ms debounce — analysis fires automatically as you type
- Token counter with overage warning
- Works in two modes: direct HuggingFace (dev) or Cloudflare Worker proxy (prod)

---

## Getting started

### Prerequisites

- Node 20+
- A free [HuggingFace read token](https://huggingface.co/settings/tokens)

### Install and run

```bash
npm install
```

Create `.env.local`:

```
VITE_HF_TOKEN=hf_your_token_here
```

```bash
npm run dev
```

The app calls HuggingFace Inference directly from the browser using your token. This is fine for local development; **do not expose a token with write permissions**.

---

## Production setup (Cloudflare Worker proxy)

For a public deployment you should keep your HF token server-side. The `worker/` directory contains a Cloudflare Worker that proxies requests and holds the token as an encrypted secret.

```bash
cd worker
npm install

# Store your HF token (prompts you — never committed to git)
npx wrangler secret put HF_TOKEN

# Deploy the worker
npx wrangler deploy
```

Then set `VITE_WORKER_URL` to your worker's URL (e.g. `https://arabic-nlp-proxy.<you>.workers.dev`) — either in `.env.local` for local testing or as a GitHub Actions secret for CI.

---

## Deploy

Push to `main` and GitHub Actions builds and deploys to GitHub Pages automatically via `.github/workflows/deploy.yml`.

Required GitHub secret: `VITE_WORKER_URL` — the URL of your deployed Cloudflare Worker.

To enable GitHub Pages: go to **Settings → Pages → Source** and select the `gh-pages` branch.

---

## Project structure

```
src/
  App.tsx               # Root layout, textarea, example buttons
  hooks/useNLP.ts       # Core hook — debounce, fetch, parse, abort
  components/
    ResultPanel.tsx     # Wrapper for each NLP task result
    NERHighlighter.tsx  # Inline entity highlighting
    ConfidenceBar.tsx   # Score bar
    AudioInput.tsx      # Microphone / Web Speech
    TokenCounter.tsx    # Character / token count
    ErrorBanner.tsx     # Rate-limit, model-loading, network errors
  strings.ts            # All UI strings (Arabic) + example texts
worker/
  src/index.ts          # Cloudflare Worker proxy
.github/workflows/
  deploy.yml            # Build → GitHub Pages on push to main
```

---

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite 8](https://vitejs.dev)
- [Framer Motion](https://www.framer.com/motion/) — result panel animations
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference)
- [Cloudflare Workers](https://workers.cloudflare.com) (optional proxy)
- [GitHub Pages](https://pages.github.com) (hosting)
