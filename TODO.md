# Deployment Fix TODO

## Step 1: Repo analysis (done)

- Identified frontend/backend/ai-service structure.
- Identified likely root causes: wrong working dir, missing backend scripts, frontend relying on dev proxy.

## Step 2: Apply production-safe code changes

- Update `frontend/src/utils/api.js` to use `import.meta.env.VITE_API_URL` (direct URL approach).

## Step 3: Backend production scripts

- Update `backend/package.json` scripts: add `build` (optional), `start` (already), and ensure Render uses the correct start command.

## Step 4: Add deployment config

- Add `vercel.json` for SPA rewrite (optional, but added for correctness).

## Step 5: Document exact settings

- Provide exact Vercel project settings (root directory, build command, output directory).
- Provide exact Render service settings (start command, build command if needed, env vars).

## Step 6: Environment variables and CORS

- Provide recommended env var values for Vercel + Render.
- Align `FRONTEND_URL` and CORS allowed origin.

## Step 7: Terminal commands + GitHub flow

- Provide step-by-step terminal commands (frontend build, backend start test).
- Provide what to push and what NOT to upload.

## Step 8: Local verification

- `npm ci && npm run build` for frontend.
- `npm ci && node server.js` for backend with env vars.
