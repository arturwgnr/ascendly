# CLAUDE.md — Ascendly Project Context

This file contains the full project specification for Ascendly.
Read this before taking any action in this project.

---

## I want to plan and build a full-stack self-improvement and study tracking app called Ascendly. Please help me create a complete technical plan before writing any code.

BRAND & IDENTITY

- Name: Ascendly
- Logo/icon: ᨒ (used as the brand mark)
- Color system: CSS custom properties centralized in a single theme file (e.g. styles/theme.css) so primary, secondary, accent colors can be changed in one place. Premium dark theme with clean typography.
  STACK
- Frontend: React (plain CSS in a styles/ folder, no Tailwind or CSS-in-JS)
- Backend: Node.js + Express + Prisma + PostgreSQL
- Auth: best practice JWT with refresh token (or Passport.js if more appropriate — your call)
- Deploy: Render (backend) + Vercel (frontend), monorepo structure
  ARCHITECTURE OVERVIEW
  Hybrid layout: central dashboard that aggregates everything + sidebar for quick access to individual modules. Full auth from day one (single user per account).
  DASHBOARD (HOME)
  Visible without entering any module:
- Today's summary (missions, day note, habits completed)
- General heatmap of recent days
- Study hours progress for the current week
- Tasks allocated to today
- Gamification widget (streak, XP, badges) — subtle and clean
  MODULE 1 — STUDY TRACKER
- Log study sessions: topic, hours, difficulty (1–5), session note
- GitHub-style heatmap by day
- Monthly study goal with timeline (hours target)
- Rhythm metrics: weekly average, progress vs. goal
- Monthly reset: at the start of each month, current metrics reset — but a monthly summary snapshot is saved automatically (total hours, average, top topics, etc.) with a historical month-over-month progress chart
  MODULE 2 — PERSONAL GROWTH / DAILY
  The most-used screen. Daily interaction:
- Today's Mission: fixed pillars (3 default, editable in Settings) + extras addable per day
- Good habits / Bad habits: each entry has an optional time field — aggregated in weekly and monthly reports to estimate time spent on good vs. bad habits
- Day type: mark as work day (colored side label on the heatmap) or day off
- Day note: score that affects heatmap color (day off = note color; work day = fixed label color)
- Reports: weekly and monthly breakdown of time in habits
  MODULE 3 — TASKS
  Two connected views:
- Backlog: full CRUD (create, edit, delete, status toggle)
- Weekly board: drag tasks from backlog into specific days of the week — manual allocation only, nothing is automatic
- Both views stay in sync — allocating a task from backlog reflects on the board and vice versa
  MODULE 4 — JOURNALING (reserved, out of initial scope)
- Time-aware dynamic structure + atemporal mode
- AI analysis
- Dedicated heatmap
- Do not plan or build this now — just leave a placeholder route and mention it in the architecture
  GAMIFICATION
  Subtle combination of three systems:
- Streaks: consecutive days with mission completed
- XP / level: rises with overall consistency
- Badges: unlocked by reaching milestones (e.g. 50h studied, 30-day streak)
  Displayed discreetly — supports behavior without becoming the focus.
  SETTINGS PAGE
  Dedicated screen with everything editable:
- Personal Growth pillars (3 default common ones pre-set)
- Theme colors (primary, secondary, accent, background)
- General app preferences
  WHAT I NEED FROM YOU
  Please plan the following before any code is written:

1. Folder and file structure (monorepo)
2. Database schema (all tables, relations, key fields)
3. API routes list (REST)
4. Frontend pages and component breakdown
5. Auth flow
6. Any architectural decisions or trade-offs worth flagging
   Do not write implementation code yet — this is planning mode only.
