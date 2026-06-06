#!/usr/bin/env bash
# ─── Snap Video Studio – One-command launcher ─────────────────────────────────
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║      🎬  Snap Video Studio  🎬        ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
echo "▶ Starting backend (FastAPI on :5000)…"
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  echo "  Creating Python virtual environment…"
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 5000 --reload &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "▶ Starting frontend (React on :3000)…"
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Installing npm packages (first run only)…"
  npm install --legacy-peer-deps
fi

npm start &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "✅  Both servers are running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:5000"
echo "   API docs → http://localhost:5000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# ── Graceful shutdown ─────────────────────────────────────────────────────────
trap "echo ''; echo 'Stopping…'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
