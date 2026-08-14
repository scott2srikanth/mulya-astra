# Mulya-Astra

A single-user Next.js repository evaluation dashboard. Evaluation records, logs, and reviewer results are stored in an embedded SQLite database; no Supabase account is required.

## Requirements

- Node.js 20 or newer
- npm
- Optional `GITHUB_TOKEN` for a higher GitHub API rate limit

## Run locally

```bash
npm install
npm run dev
```

The database is created at `data/mulya-astra.sqlite`. Set `SQLITE_DATA_DIR` to put it on another persistent volume.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Architecture

- `lib/db.ts` owns the SQLite connection, schema initialization, and queries.
- `app/api/evaluations` provides create, list, detail, and delete operations.
- `app/api/evaluate` validates the queued server-owned evaluation.
- `scripts/evaluation-worker.ts` atomically claims queued work and runs repository analysis outside the request lifecycle.
- Evaluation pages poll the detail endpoint while work is in progress.

## Deployment

This version is designed for one persistent Node.js process. Mount a durable directory and point `SQLITE_DATA_DIR` at it. Do not deploy it to an ephemeral or horizontally scaled serverless filesystem: separate instances would have separate databases and files can disappear between invocations.

The current evaluator uses deterministic repository metadata and dependency heuristics rather than an LLM. Its scores are guidance, not a substitute for human hiring decisions or a complete source-code audit.

`npm run dev` and `npm start` launch both the web process and the SQLite worker. To operate them separately, run the Next.js command and `npm run worker` in independent processes that share `SQLITE_DATA_DIR`.
