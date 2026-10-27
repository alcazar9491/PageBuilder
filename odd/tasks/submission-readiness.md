# Feature: Submission readiness

## Objective

Close the two gaps that block submission: an unverified Docker image, and a prompt log that summarizes the prompts instead of showing them.

## Problem / Why

The assignment asks for a Docker deployment and a Prompt Log "showing how you directed the AI".
- The Docker image was never built or run; the Docker engine was down during the `chore/docker` task.
- `PROMPT_LOG.md` lists each prompt's objective, not its text.

## Scope

- Build and run the image through `docker compose`, then smoke-test it.
- Add the verbatim prompts to `PROMPT_LOG.md`, recovered from the Claude Code session transcripts.

Out of scope: changes to application code, unless the Docker run exposes a defect.

## Constraints

- No source changes are expected, so TDD does not apply (Strict TDD is on for behavior changes).
- Prompts are copied verbatim, including typos.
- The first session (`ef7c6706`) was a discarded attempt; none of its output is in the history.

## Tasks

- [x] T1: Build the image with `docker compose up --build`, check the healthcheck, HTTP 200, the rendered blocks, the non-root user and the image size. Route: inline (background shell).
- [x] T2: Add the verbatim prompts to `PROMPT_LOG.md` and update row 6 with the Docker result. Route: inline (one file, content already extracted).

## Acceptance criteria

- The container reports `healthy` and serves the home page with the hero, pricing and product grid.
- `whoami` in the container prints `nextjs`.
- Every row in the prompt table has its verbatim prompt.

## Progress

### T1 evidence

- The first attempt failed before building: the Docker Desktop engine was not running (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`). Docker Desktop was started, then the run was repeated.
- `docker compose up --build -d`: `page-builder:local  Built`, container started.
- Healthcheck: `healthy`. Image size: `288MB`.
- `curl http://127.0.0.1:3000/`: `status=200`. The HTML contains `Build pages without shipping code` (hero), `Starter`, `Most popular` and `Simple pricing` (pricing), and `Studio Headphones` (product grid). `Unsupported block type` appears 0 times, as designed in production.
- `docker compose exec web whoami`: `nextjs`.
- Logs: `Next.js 16.4.3`, `Network: http://0.0.0.0:3000`, `Ready`.
- `docker compose down` removed the container and network.
- Not checked: `ls /app` inside the container. Git Bash rewrote `/app` to a Windows path, so the command did not reach the container.

### T2 evidence

- Prompts extracted from transcripts `ef7c6706` (discarded attempt) and `d4bebbbf` (the committed work), plus this session.
- `PROMPT_LOG.md` has a "Full prompt text" section with prompts 1 to 10 and the discarded attempt. Row 6 states the Docker result.

### Other

- Engram mirror: pending (Engram server unavailable this session).

## Next step

Push this branch, fast-forward `main` and push it.
