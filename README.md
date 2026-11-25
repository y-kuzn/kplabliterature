# 🔬 BenchQuest Lab Literature (v2.0)

Google-grade scientific discovery, 3D structural biology viewer, AI comparative literature matrix, citation network graph, and Zotero vocabulary sync — unified with the **BenchQuest Scout Telegram Bot** (`LabLitAgent`).

## ✨ Highlights

- **Omni-Search across 6 Intelligence Hubs (100 Sources)**: PubMed, OpenAlex, bioRxiv, arXiv, ChemRxiv, RCSB PDB, EMDB, AlphaFold DB, Addgene, *Nature Protocols* / *Bio-protocol*, Top-100 Global PhD Dissertations, Patents & ClinicalTrials.gov, Zenodo Posters, and PubPeer / Retraction Watch.
- **AI Comparative Literature Matrix**: Select 2–15 papers to generate a side-by-side biophysical table (Construct, Method, Resolution / $K_d$, Buffer / pH, Core Finding, Caveat) with 1-click CSV, Markdown, and `.bib` export.
- **Interactive 3D Biomolecular Viewer**: Real-time WebGL (`3Dmol.js`) inspection of RCSB PDB Cryo-EM/NMR structures and AlphaFold pLDDT confidence models + copyable PyMOL / ChimeraX commands.
- **Connected-Papers Citation Network Graph**: Interactive forward/backward citation graph via Semantic Scholar & OpenAlex.
- **2-Way Sync with Telegram Bot**: Pair your web account via `/link` in `@BenchQuestScoutBot` to share active projects, Zotero libraries, controlled `aRT-` / `aTa-` / `aMe-` tags, daily briefings, weekly magazine dossiers, and neural two-host podcasts.

## 🚀 Local Development

1. Start the unified FastAPI + Bot backend (in `LabLitAgent`):
   ```bash
   python -m bot.server
   ```
2. Start the Next.js frontend (in `y-kuzn.github.io`):
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000`.

## 🌐 Production Deployment (GitHub Pages + Railway)

- **Backend (`LabLitAgent` on Railway)**: Deploys automatically from `Dockerfile` (`python -u -m bot.server`), running both the Telegram bot and the FastAPI server on the shared `/app/bot/data/scout.db` volume. Generate a public Railway domain in **Settings → Networking**.
- **Frontend (`y-kuzn.github.io` on GitHub Pages)**: Set repository variable `NEXT_PUBLIC_API_URL` to your Railway domain (or configure it directly in the top-right **Engine Online / API Config** button in the UI). Pushing to `main` builds the static export (`./out`) via `.github/workflows/deploy.yml` and publishes to `https://y-kuzn.github.io`.
