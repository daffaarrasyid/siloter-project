# AGENTS.md

# AI Agent Guidelines

## Skill Usage

The agent must discover and use relevant skills from `.agents/skills/` when performing project tasks.

### Frontend Development
- Use `design-taste-frontend` when creating, redesigning, or improving UI/UX.
- Apply anti-slop principles to avoid generic AI-generated interfaces.
- Maintain consistency with the existing SILOTER design system.

### Documentation and Writing
- Use `avoid-ai-writing` when reviewing or improving English documentation and written content.
- Preserve technical accuracy, terminology, and project-specific information.
- Do not rewrite technical documentation without understanding its context.

### General Rules
- Read the relevant skill instructions before executing the task.
- Do not force irrelevant skills into unrelated tasks.
- Follow the existing architecture and conventions documented in `ARCHITECTURE.md`.
- Inspect existing code before modifying it.
- Verify changes through appropriate tests before reporting completion.

## 1. Introduction and Role

This document defines the strict operational rules, workflows, and constraints for all AI coding agents working on the **SILOTER** (*Sistem Informasi dan Deteksi Loitering Angkutan Umum Terpadu*) repository. SILOTER is a decoupled, real-time traffic monitoring and computer vision platform built with **Next.js (App Router, TypeScript)**, **Python FastAPI**, **Ultralytics (YOLOv26n & YOLOv8)**, **ByteTrack**, **OpenCV**, and **Supabase (PostgreSQL, Storage, Auth)**. AI agents must follow these instructions to understand requirements, plan, implement changes, and manage the codebase.

## 2. Source of Truth Hierarchy

When processing instructions and resolving conflicts, agents MUST adhere to the following strict hierarchy:

1. **Explicit user instruction** for the current task.
2. **`PRD.md`** for product requirements, functional/non-functional rules (FR-01 to FR-10, NFR-01 to NFR-05), scope, and user flows.
3. **`ARCHITECTURE.md`** for directory structure (`frontend/` and `backend/`), technology constraints, spatio-temporal ROI rules, and multi-model configurations.
4. **UI/UX Flowchart & `shadcn/ui` Design Conventions** for command-center visual hierarchy, alert banners, and human-in-the-loop validation screens.
5. **Existing codebase conventions** and implemented patterns.
6. **General software engineering and computer vision best practices**.

If two sources conflict, do not silently choose one when the conflict affects product behavior, architecture, security, data, or core user flows. Flag the conflict and request clarification.

## 3. Core Principle

**Make the smallest correct change.**

AI agents must avoid unnecessary changes.
Do NOT:

* Rewrite working code without a clear reason.
* Refactor unrelated modules across `frontend/` or `backend/`.
* Rename unrelated files or move directories outside the structure defined in `ARCHITECTURE.md`.
* Change the decoupled FastAPI–Next.js architecture unnecessarily.
* Add unnecessary Python or Node.js dependencies.
* Introduce features that were not requested.
* Expand project scope without explicit approval.

## 4. Before Coding

Before modifying the repository, the AI agent MUST:

1. Read the relevant sections of `PRD.md`, `ARCHITECTURE.md`, and `AGENTS.md`.
2. Inspect the existing repository structure (`siloter-project/frontend` and `siloter-project/backend`).
3. Identify existing React components (`shadcn/ui`), custom hooks, FastAPI routers, OpenCV stream workers, and Supabase utilities that can be reused.
4. Determine which functional (FR) and non-functional (NFR) requirements are relevant to the requested task.
5. Identify possible conflicts, ambiguities, or missing information.
6. Create an implementation plan before making significant changes. For larger tasks, present the plan before implementation.

## 5. Scope Control

AI agents MUST work only within the requested scope.
If the task is "Add feature X", do not automatically:

* Redesign feature Y.
* Refactor unrelated components or Python services.
* Replace the existing computer vision library (`ultralytics`) or UI library (`shadcn/ui`).
* Rewrite the Supabase database schema.
* Change authentication flows.
* Modify unrelated UI screens.

If an unrelated problem is discovered, report it separately rather than silently fixing it.

## 6. Product Requirements

`PRD.md` defines what the product should do.
AI agents MUST:

* Follow functional requirements:
  * **FR-01 & FR-02:** HLS (`.m3u8`) stream connection to BSW Kota Bogor with strict **1 FPS** frame extraction via OpenCV.
  * **FR-03:** Automatic stream reconnection (*auto-reconnect*) on network/token drops.
  * **FR-04 & FR-05:** Multi-model object detection (**YOLOv26n** primary, **YOLOv8** baseline comparison) integrated with **ByteTrack** for persistent unique vehicle IDs (`track_id`).
  * **FR-06 & FR-07:** Configurable *Region of Interest* (ROI) polygons and stationary duration calculation tolerant of *micro-movement* and temporary occlusion.
  * **FR-08 & FR-09:** Automatic evidence screenshot (*Auto-Capture* `.jpg`), database logging, real-time WebSocket alert notifications, and analytical charts.
  * **FR-10:** Role-based authentication for Dishub operators and administrators.
* Follow non-functional requirements:
  * **NFR-01:** Maintain $1\text{--}3\text{ FPS}$ inference stability.
  * **NFR-02:** Fault isolation per camera stream (one failing CCTV stream must not crash the other streams).
  * **NFR-03:** Real-time WebSocket alert latency under $5\text{ seconds}$.
  * **NFR-04:** Strict 1 FPS throttling to prevent IP bans or DDoS-like load on Diskominfo Kota Bogor servers.
  * **NFR-05:** Dynamic configuration of ROI polygons, time thresholds ($60\text{--}120\text{ seconds}$), and active YOLO model weights without code rewrites.
* Respect product scope. Do NOT implement explicitly out-of-scope functionality such as Automatic Number Plate Recognition (ANPR), electronic ticketing/payment (ETLE), or in-browser model retraining.

## 7. UI & Design System Rules

AI agents working on `frontend/` MUST:

* Use **Tailwind CSS**, existing **`shadcn/ui`** primitives (`components/ui/`), and **Lucide Icons**.
* Follow the **Command-Center / Control Room** UX principles: high-contrast status indicators (green/amber for normal monitoring, pulsing red for active loitering violations).
* Implement the complete Dishub Operator user flow:
  1. **Login (`/login`)** & **Onboarding Setup (`/onboarding`)** for unconfigured cameras (Select CCTV: Empang, Surken, Balaikota $\rightarrow$ Draw ROI Polygon $\rightarrow$ Set Threshold).
  2. **Main Dashboard (`/dashboard`)** featuring annotated MJPEG live streams, camera status cards, and real-time **Alert Banner Widgets**.
  3. **Event Detail & Human-in-the-Loop Validation (`/events/[id]`)** allowing operators to inspect the Auto-Capture evidence photo and click **"Konfirmasi" (`Valid`)** or **"Tolak" (`Invalid / Rejected`)**.
  4. **Analytics & Reporting (`/analytics`, `/reports`)** using **Recharts** for peak congestion hours (*Time-Series*), 3-camera comparisons, YOLOv26n vs. YOLOv8 inference benchmarks, and Excel (`.xlsx`) / PDF export.
* Reuse existing UI components and avoid creating duplicate primitives.

## 8. Architecture

`ARCHITECTURE.md` defines the technical architecture.
AI agents MUST:

* Respect confirmed technology decisions: **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **Recharts**, **Python FastAPI**, **Ultralytics (`YOLOv26n` & `YOLOv8`)**, **ByteTrack**, **OpenCV**, and **Supabase**.
* Keep responsibilities strictly decoupled between `frontend/` (presentation, ROI canvas, charts, WebSocket listener) and `backend/` (stream ingestion, YOLO+ByteTrack inference, spatio-temporal rule engine, Auto-Capture upload).
* Normalize all ROI polygon coordinates to a relative scale of $[0.0, 1.0]$ against frame width ($W$) and height ($H$) to handle resolution differences between Balaikota ($\approx 704\text{ px}$) and Jl. Djuanda Empang/Surken ($\approx 1920\text{ px}$).
* Evaluate vehicle position inside the ROI using the **bottom-center anchor point** of the bounding box:
  $$P_{anchor} = \left( \frac{x_1 + x_2}{2}, y_2 \right)$$
* Support local video simulation fallback (`backend/data_fallback/*.mp4`) when live `.m3u8` tokens from BSW expire during testing or demonstrations.

## 9. Dependencies

Before adding a new dependency in `package.json` or `requirements.txt`:

1. Check whether the repository already provides equivalent functionality (e.g., use `ultralytics` built-in ByteTrack rather than installing external tracking repos).
2. Determine whether the dependency is actually necessary.
3. Consider maintenance, security, bundle size, and Python `venv` compatibility.
4. Do not add dependencies merely for trivial convenience.

## 10. File & Code Changes

AI agents should:

* Follow the mono-repo directory structure (`siloter-project/backend` and `siloter-project/frontend`) defined in `ARCHITECTURE.md`.
* Keep root documentation files (`PRD.md`, `ARCHITECTURE.md`, `AGENTS.md`, `README.md`) solely in the root of `siloter-project/` and avoid duplicating them inside `frontend/` or `backend/`.
* Keep functions, FastAPI endpoints, and React components modular and focused.
* Avoid modifying unrelated files.

## 11. Database & Storage Changes

Supabase database and storage changes require caution.
AI agents MUST:

* Follow the documented schema for `camera_configs`, `violation_events`, and `users_profile`.
* Ensure single-capture locking (`is_captured = True` per `track_id` per loitering cycle) so the system does not spam Supabase Storage and PostgreSQL with duplicate entries every second after exceeding the threshold.
* Compress Auto-Capture `.jpg` frames (e.g., JPEG quality `85`, $< 500\text{ KB}$) before uploading to Supabase Storage.
* Never drop or destroy existing violation logs or camera configurations during routine development.

## 12. API & Real-Time Changes

When modifying FastAPI REST endpoints or WebSockets:

* Preserve existing Pydantic schemas and JSON contracts unless a breaking change is explicitly required.
* Ensure MJPEG streaming endpoints (`/api/stream/{camera_code}`) properly yield `multipart/x-mixed-replace` frames and release resources cleanly when clients disconnect.
* Ensure WebSocket broadcasts (`/ws/alerts`) handle disconnected clients gracefully without crashing the inference loop.
* Validate all incoming ROI polygon arrays and threshold values (`422 Unprocessable Entity` on invalid coordinates).

## 13. Security & Fair-Use Compliance

Security and infrastructure compliance take priority over convenience.
AI agents MUST:

* **Enforce 1 FPS Stream Throttling:** Never run an unthrottled `while True` loop pulling `.m3u8` streams at maximum network speed from `bsw.kotabogor.go.id`.
* Never expose `SUPABASE_SERVICE_ROLE_KEY` or backend `.env` credentials in `frontend/` client code or commit them to Git.
* Protect configuration and validation endpoints with Supabase Auth / JWT verification.
* Validate all user inputs on both frontend and backend.

## 14. Testing

Every implementation should include appropriate verification.
Before considering a task complete:

* Run relevant linting, type-checking (`tsc`), or Python execution checks.
* Verify computer vision edge cases:
  * *Micro-movement*: Creeping forward inside the ROI must not reset the stationary timer.
  * *Temporary occlusion*: Brief occlusion ($3\text{--}5\text{ seconds}$ grace period) must not immediately drop the `track_id` timer.
  * *Stream disconnect*: Disconnecting one camera URL must trigger `Reconnecting...` state for that camera only (NFR-02).
  * *Model switching*: Switching between `YOLOv26n` and `YOLOv8` must work cleanly and record the active model name in `violation_events`.
* **For UI changes:** Verify responsive layout, live stream fallback states, alert banner triggers, and table filtering.

## 15. Debugging

When debugging:

1. Reproduce the problem (check FastAPI terminal logs, OpenCV stream status, or browser console/network tabs).
2. Identify the likely root cause.
3. Make the smallest correct fix.
4. Verify the fix and check for regressions across both `frontend/` and `backend/`.

Do not mask symptoms with arbitrary `try/pass` blocks that hide critical stream or inference failures.

## 16. Existing Code

Treat existing working code as valuable.
Before replacing an existing implementation:

* Understand why it exists.
* Determine whether it already satisfies the requirement or can be extended.
* Avoid replacement solely because a different approach appears cleaner.

## 17. Refactoring

Refactoring must be intentional.
AI agents MUST NOT perform unrelated refactoring during feature implementation.
A refactor is appropriate only when:

* It is necessary for the requested feature.
* It fixes a concrete architectural or performance bottleneck (e.g., blocking the FastAPI event loop during OpenCV inference).
* It reduces significant duplication without expanding scope.

If a large refactor is required, explain why before performing it.

## 18. Ambiguity Handling

When requirements are unclear:

* **Low-risk ambiguity:** If the ambiguity has minimal impact and there is an obvious convention in `PRD.md`, `ARCHITECTURE.md`, or the existing codebase, make a conservative decision.
* **High-risk ambiguity:** Stop and request clarification when ambiguity affects product behavior, architecture, database schema, security, BSW stream compliance, or core user flows. Never make major decisions silently.

## 19. Workflow

For significant tasks, follow this workflow:

* **Phase 1 — Understand:** Read `PRD.md`, `ARCHITECTURE.md`, and `AGENTS.md`, inspect the repository, and identify affected files and constraints.
* **Phase 2 — Plan:** Define the smallest implementation approach, identify dependencies, tests, and risks.
* **Phase 3 — Implement:** Make the smallest correct change following the PRD and Architecture. Reuse existing code.
* **Phase 4 — Verify:** Run checks, verify spatio-temporal/UI behavior, and check for regressions.
* **Phase 5 — Report:** Summarize what changed, files modified, verification performed, assumptions, and follow-ups.

## 20. Definition of Done

A task is considered complete only when:

* The requested functionality has been implemented.
* The implementation follows `PRD.md` (FR-01 to FR-10, NFR-01 to NFR-05).
* The implementation follows `ARCHITECTURE.md` and the Dishub UI Flowchart.
* No unnecessary scope was introduced.
* Relevant checks have been performed and edge cases (1 FPS lock, ROI normalization, single Auto-Capture, micro-movement) are respected.
* Security requirements have been respected and no secrets exposed.
* Existing unrelated functionality has not been unnecessarily modified.

## 21. Final Response Format

After completing a task, provide a concise report using this exact structure:

**Summary**
Briefly describe what was implemented.

**Changes**
List the important files or modules that were created or changed.

**Verification**
List tests, commands, or checks that were actually performed. Do not claim that a test or command was executed if it was not.

**Notes**
Mention assumptions, known limitations, unresolved issues, or required follow-up decisions.

## 22. Final Principle

When uncertain, prioritize:
**Correctness → Security & Fair-Use Compliance → Requirements (`PRD.md`) → Existing Architecture (`ARCHITECTURE.md`) → Consistency → Simplicity**

Always prefer: The smallest correct change that satisfies the user's request and the project's source-of-truth documents.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
