# Skill: gemini-live-api-dev

**Source:** `google-gemini/gemini-skills/skills/gemini-live-api-dev`  
**Purpose:** Real-time audio ingestion and conversational feedback specifications for Aptis Speaking tasks.  
**Status:** Active Reference for Phase 2 (Speaking Module)  

---

## Architectural Notes for Speaking Module

1. **Audio Ingestion Options:**
   - **Buffered Audio Mode (Standard API):** Client records user speech via MediaRecorder API (`audio/webm` or `audio/wav`), encodes to base64, and sends payload to `/api/grade/speaking`.
   - **Live Streaming Mode (Live API):** WebSocket bidirectional connection for real-time conversation simulation (Part 4 of Speaking test).

2. **Multimodal Audio Processing:**
   - Models: `gemini-3.7-flash` (Primary), `gemini-2.5-flash-native-audio` (Live streaming).
   - Analysis covers pronunciation clarity, grammar range in spoken discourse, hesitation markers, and task completion within the 45-second preparation / response countdown windows.
