# MASTER_STATUS — Digital Receptionist Harness

## Status: SCAFFOLD COMPLETE ✅

## What's built
- [x] 5-agent architecture: Classifier, Responder, Qualifier, FollowUp, EmailService
- [x] SQLite DB with leads, email_log, agent_log tables
- [x] Full intake pipeline with classification routing
- [x] Status-gated follow-up cron (hourly, 24hr + 72hr)
- [x] Admin dashboard (read-only, auto-refreshing)
- [x] Swappable client config (config/client.json)

## What's NOT built yet (Phase 2)
- [ ] Reply ingestion (Gmail watcher → re-classify → respond)
- [ ] FAQ/Knowledge Base agent
- [ ] Escalation agent (human handoff webhook)
- [ ] Webhook endpoint for booking confirmation (mark lead as booked)
- [ ] Multi-client support (parameterized config loading)

## To run locally
```
cd ~/digital-receptionist-harness
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env
npm install
node server.js
```

## To test intake
```
curl -X POST http://localhost:3000/api/lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","email":"test@example.com","service_requested":"Volume Lashes","message":"Hi I want to book something for next weekend"}'
```

## Current sprint
None active — scaffold phase complete.
