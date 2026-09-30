# AirAware
AI clean-air & climate-resilience assistant (Code for Communities, Track 2). User-provided AQI → Gemini → actionable guidance.

## Run
Backend: `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cp ../.env.example .env` (set `GEMINI_API_KEY`), then `uvicorn main:app --reload --port 8000`
Frontend: `cd frontend && npm install && npm run dev` → http://localhost:5173
