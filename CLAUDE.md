# CLAUDE.md — Digital Receptionist Harness

## Project
Generic white-label AI receptionist harness. Apex AI Consulting template.
Stack: Node.js / Express / SQLite / Claude API / Nodemailer

## What this is
A fully autonomous lead intake → classification → response → follow-up → logging pipeline.
No Make. No Zapier. Claude is the intelligence layer. Node is the orchestration layer.

## Agent roster
1. ClassifierAgent — reads raw lead, returns JSON classification
2. ResponderAgent — generates personalized first reply + booking CTA
3. QualifierAgent — generates qualification question for ambiguous leads
4. FollowUpAgent — generates 24hr and 72hr follow-up emails
5. LoggerAgent — structures and writes lead state to SQLite

## Rules
- Never hardcode business-specific data. All client config lives in /config/client.json
- All Claude prompts must inject dynamic context from the lead row
- Follow-up logic is status-gated — never fire if status = booked | replied | disqualified
- All agent outputs must be validated as JSON before downstream use
- Email never sends without a classified lead_type
- Admin dashboard is read-only — no mutations from UI

## File structure
/agents       — one file per agent
/routes       — Express route handlers
/db           — SQLite schema + query helpers
/templates    — Email HTML templates
/dashboard    — Admin UI (single HTML file)
/_CONTEXT     — Client config, onboarding notes
/config       — client.json (swappable per deployment)

## Session protocol
Read CLAUDE.md → MASTER_STATUS.md → check /config/client.json before any build.
