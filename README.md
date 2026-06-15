# ⚖ PakLaw Assistant

**An AI-powered chatbot and searchable law library for the Constitution and legal Acts of Pakistan.**

Ask a legal question in plain language and get a clear, **grounded answer with citations** drawn straight from the source law — or browse the full library of provisions yourself. PakLaw Assistant runs on a **local language model**, so there are no accounts, no API bills, and nothing leaves your machine.

> **Disclaimer:** PakLaw Assistant provides general legal information for educational and research purposes only. It is **not legal advice**. Laws change over time — always verify against the official *Gazette of Pakistan* and consult a qualified lawyer before acting on any information.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works (architecture)](#how-it-works-architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Running with a local model (Ollama)](#running-with-a-local-model-ollama)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [The legal corpus](#the-legal-corpus)
- [Build timeline](#build-timeline-october--december-2025)
- [Roadmap](#roadmap)
- [Limitations &amp; legal disclaimer](#limitations--legal-disclaimer)
- [License](#license)

---

## Overview

Legal text is dense, cross-referenced, and intimidating for non-lawyers. PakLaw Assistant makes it approachable. It pairs a curated knowledge base of Pakistani law with a **Retrieval-Augmented Generation (RAG)** pipeline:

1. Your question is matched against every Article and Section in the library.
2. The most relevant provisions are handed to a language model with strict instructions to answer **only** from that text.
3. The reply comes back in plain English with **citations to the exact Article or Section**, each one clickable so you can read the source in full.

Because retrieval is grounded in the actual statutes, the assistant doesn't invent law — and when the library doesn't cover a question, it says so instead of guessing.

## Features

- 💬 **Conversational legal Q&A** — ask in everyday language, get structured answers.
- 🔗 **Real citations** — every answer links to the precise provision it relied on.
- 🧠 **Hybrid retrieval** — BM25 keyword ranking + exact reference detection (`"Article 25"`, `"Section 489-F"`), with an optional local-embeddings semantic layer.
- 📚 **Browsable law library** — read the Constitution and Acts organised by Part, Chapter, Article and Section.
- 🔍 **Full-text search** — instant, debounced search across the entire corpus.
- 🛟 **Always answers** — if the local model is offline, an *extractive fallback* quotes the most relevant provisions verbatim, so the app never dead-ends.
- 🔒 **Private by design** — no login, no tracking, no third-party API; runs entirely on your machine.
- 🎨 **Polished, responsive UI** — built with React and Tailwind CSS.

## Tech stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, Axios, react-markdown, react-hot-toast |
| **Backend** | Node.js, Express, Zod (validation), Helmet, CORS, rate limiting, compression |
| **Retrieval** | Custom BM25 index + exact-reference boosting; optional sentence embeddings via Transformers.js (`all-MiniLM-L6-v2`) |
| **Language model** | Local LLM served by [Ollama](https://ollama.com) (e.g. `llama3.1`) |
| **Data** | Structured JSON corpus of the Constitution and core Acts |
| **Tooling** | npm workspaces-style monorepo, `concurrently`, nodemon |

> **No database required.** The corpus is static, so it is stored as JSON in the repo and the search index is built in memory at startup. This keeps setup to a single `npm install` with nothing else to provision.

## How it works (architecture)

```
                ┌──────────────────────────────────────────────────────────┐
   "What does   │                      Express API                          │
  Article 25    │                                                           │
   say about    │   POST /api/chat                                          │
   equality?"   │        │                                                  │
        ───────▶│        ▼                                                  │
                │   ┌─────────────┐   top-K passages   ┌────────────────┐   │
                │   │  Retriever  │ ─────────────────▶ │  LLM (Ollama)  │   │
                │   │  (hybrid)   │                    │  grounded +    │   │
                │   │             │                    │  cited answer  │   │
                │   │ • BM25      │                    └────────┬───────┘   │
                │   │ • exact ref │                             │           │
                │   │ • embeddings│        if model offline     ▼           │
                │   │  (optional) │ ───────────────────▶ extractive         │
                │   └─────────────┘                     fallback (quotes)   │
                │                                             │             │
                └─────────────────────────────────────────────┼────────────┘
                                                               ▼
                                                  { answer, citations, sources }
```

**Retrieval is the reliability backbone.** Lexical BM25 ranking is always available and needs no downloads. A regex pass detects explicit references like *Article 25* or *Section 302* and hard-boosts the matching provision to the top. When semantic embeddings are enabled, cosine similarity is blended in for fuzzier, meaning-based matches. If the embedding model can't load, the retriever silently continues on BM25 alone.

**Generation is grounded and guarded.** The model receives only the retrieved passages and a system prompt that forbids outside knowledge, requires `[Document — Reference]` citations, and instructs it to admit when the sources don't answer the question. If Ollama is unreachable, the extractive fallback stitches the top passages into a cited summary — the user still gets a useful, sourced response.

## Project structure

```
PakLaw Assistant/
├─ package.json                 # root scripts: dev, install-all, validate, build
├─ README.md
├─ server/
│  ├─ .env.example
│  ├─ src/
│  │  ├─ index.js               # app bootstrap: load corpus → build index → listen
│  │  ├─ config/env.js
│  │  ├─ data/
│  │  │  ├─ constitution.json   # Constitution of Pakistan 1973 (Parts → Articles)
│  │  │  └─ acts/               # ppc.json, crpc.json, contract-act.json, peca.json
│  │  ├─ services/
│  │  │  ├─ corpus.service.js   # load + normalise JSON into searchable chunks
│  │  │  ├─ retrieval.service.js# BM25 + exact-ref boost + optional embeddings
│  │  │  ├─ embeddings.service.js
│  │  │  └─ llm.service.js      # Ollama client + extractive fallback
│  │  ├─ controllers/           # chat, laws, search, health
│  │  ├─ routes/                # /api/* router
│  │  ├─ middleware/            # validation, error handling
│  │  └─ utils/                 # tokeniser, reference parsing, helpers
│  └─ scripts/
│     ├─ validateCorpus.js      # corpus integrity check
│     └─ buildIndex.js          # precompute the embeddings cache (optional)
└─ client/
   ├─ index.html  vite.config.js  tailwind.config.js
   └─ src/
      ├─ App.jsx  main.jsx  index.css
      ├─ services/api.js
      ├─ hooks/                 # useChat, useDebounce
      ├─ components/            # common, layout, chat, library
      └─ pages/                 # Home, Chat, Library, DocumentView, ArticleView, SearchResults, About, NotFound
```

## Getting started

### Prerequisites

- **Node.js 18+** (uses the built-in `fetch` and `AbortController`).
- *(Optional but recommended)* **[Ollama](https://ollama.com)** for AI-generated answers. Without it, the app falls back to quoting the source law.

### Install &amp; run

```bash
# 1. Install dependencies for the root, server and client
npm run install-all

# 2. Start the API and the web app together
npm run dev
```

Then open **http://localhost:5173**. The API runs on **http://localhost:5000** and the Vite dev server proxies `/api` to it automatically.

> Other handy scripts: `npm run validate` (check the corpus), `npm run build` (build the client for production), `npm run server` / `npm run client` (run one half).

## Running with a local model

The assistant produces its best answers with a local language model. There are two ways to set one up — the app tries them in order and falls back gracefully.

### Option A — Direct GGUF file (no separate server needed)

If you already have a `.gguf` quantized model (e.g. `Llama-3.2-3B-Instruct-Q4_K_M.gguf`), point the server straight at it:

```bash
# In server/.env, set:
LLAMA_MODEL_PATH=C:\path\to\your\model.gguf
```

The server loads the file at startup using `node-llama-cpp` (a Node.js binding to llama.cpp). No separate process is needed. Any GGUF-format model works — 3B to 8B parameter instruction-tuned models are ideal for this task.

### Option B — Ollama server

```bash
# 1. Install Ollama from https://ollama.com, then pull a model:
ollama pull llama3.1

# 2. Make sure Ollama is running (it serves on http://localhost:11434 by default),
#    then start PakLaw Assistant as usual:
npm run dev
```

### Checking model status

```bash
curl http://localhost:5000/api/health
# { "localModel": true, "ollama": false, "model": "local-llama", ... }
```

If no model is available, `usedFallback` will be `true` in chat responses and answers will quote the retrieved provisions directly. The app remains fully usable — you just don't get the conversational summary.

## Configuration

Copy `server/.env.example` to `server/.env` to override any defaults (all are optional):

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.1` | Model used for generation |
| `OLLAMA_TIMEOUT_MS` | `45000` | Max wait for a model response before falling back |
| `EMBEDDINGS` | `off` | Set to `on` to enable the semantic retrieval layer |
| `RETRIEVAL_TOP_K` | `6` | Number of source passages fed to the model |
| `LLAMA_MODEL_PATH` | *(empty)* | Absolute path to a local `.gguf` file — enables direct GGUF inference without Ollama |
| `LLAMA_CONTEXT_SIZE` | `2048` | Token context window for the local GGUF model |
| `LLAMA_TIMEOUT_MS` | `120000` | Max wait (ms) for a local model response before falling back |

**Enabling semantic search:** set `EMBEDDINGS=on`. On first use the server downloads a small (~90 MB) embedding model and caches sentence vectors to `server/.cache/`. Subsequent starts are instant. You can pre-build the cache with `npm --prefix server run build-index`.

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service status: corpus size, retrieval mode, model availability |
| `POST` | `/api/chat` | Body `{ "question": "…" }` → `{ answer, citations, sources, usedFallback }` |
| `GET` | `/api/laws` | List all documents with provision counts and groupings |
| `GET` | `/api/laws/:slug` | A document with its provisions grouped by Part/Chapter |
| `GET` | `/api/laws/:slug/:refKey` | A single Article/Section with prev/next navigation |
| `GET` | `/api/search?q=&limit=` | Ranked provisions matching the query |

Example:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the punishment under Section 489-F for a bounced cheque?"}'
```

## The legal corpus

The knowledge base is a **curated, representative selection** of widely-cited provisions — not the complete text of every law. It currently includes:

| Document | Coverage |
| --- | --- |
| **Constitution of Pakistan 1973** | Introductory articles, the full chapter of Fundamental Rights (Articles 8–28), selected Principles of Policy, parliamentary qualifications, and the Judicature |
| **Pakistan Penal Code 1860** | General exceptions, offences affecting the body (e.g. 302, 324, 376), offences against property (e.g. 379, 392, 420), 489-F, defamation, criminal intimidation |
| **Code of Criminal Procedure 1898** | Arrest, FIR (154), investigation, confessions (164), challan (173), bail (497/498), inherent powers (561-A) |
| **Contract Act 1872** | Formation, competence, free consent, lawful consideration, frustration (56), damages (73), indemnity |
| **Prevention of Electronic Crimes Act 2016** | Unauthorised access, electronic fraud and forgery, offences against dignity/modesty, cyber stalking, spamming |

Each provision is stored with its document, Part/Chapter grouping, reference, title and text. Adding more is as simple as dropping another JSON file into `server/src/data/acts/` and restarting — the loader, index and library pick it up automatically. Run `npm run validate` to check integrity after editing.

## Build timeline (October – December 2025)

The project was delivered over a focused three-month cycle.

| Phase | Dates | Focus | Key outcomes |
| --- | --- | --- | --- |
| **1 · Research &amp; scoping** | **Oct 1 – Oct 10, 2025** | Requirements, legal-source research, RAG design | Defined the use case, identified the Constitution + core Acts to cover, chose a local-model RAG architecture and a no-database approach |
| **2 · Data engineering** | **Oct 11 – Oct 25, 2025** | Building the corpus | Collected, cleaned and structured the Constitution and four Acts into JSON; designed the chunking and citation scheme; wrote the corpus validator |
| **3 · Backend &amp; retrieval** | **Oct 26 – Nov 12, 2025** | API and search engine | Built the Express API; implemented the BM25 index, exact-reference boosting and the optional embeddings layer; integrated Ollama with a grounded prompt and the extractive fallback |
| **4 · Frontend** | **Nov 13 – Nov 27, 2025** | Web application | Built the React + Tailwind UI: chat with a sources panel, browsable law library, document and article views, and full-text search |
| **5 · Integration &amp; testing** | **Nov 28 – Dec 10, 2025** | Quality | End-to-end wiring, answer-quality evaluation, edge-case handling (empty/short queries, model offline), and bug fixing |
| **6 · Polish &amp; docs** | **Dec 11 – Dec 24, 2025** | Release readiness | Accessibility and responsive passes, visual polish, configuration cleanup, and complete documentation |

## Roadmap

- Expand the corpus with more Acts and the full set of Constitutional articles.
- Streaming token-by-token responses from the model.
- Conversation memory for multi-turn follow-up questions.
- Optional Urdu interface and bilingual answers.
- Per-answer "confidence" signal based on retrieval scores.

## Limitations &amp; legal disclaimer

- The corpus is a **curated subset** of widely-cited provisions, not an exhaustive legal database.
- Answers are only as current as the included text; **statutes are amended over time**.
- Retrieval and generation can miss nuance, context, or recent case law.
- **This is general legal information, not legal advice**, and using it does not create a lawyer–client relationship. Always verify against the official *Gazette of Pakistan* and consult a qualified lawyer for your specific situation.

## License

Released under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see the [LICENSE](LICENSE) file for the full text.

The AGPL-3.0 is a strong copyleft license: you are free to use, study, modify and redistribute this software, but any modified version you run as a network service must make its complete corresponding source code available to its users under the same license.

```
Copyright (c) 2025 Fozan Khana

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version. This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
for more details.
```

The legal texts referenced are public law of the Islamic Republic of Pakistan.
