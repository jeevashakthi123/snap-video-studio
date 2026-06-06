# 🎬 Snap Video Studio

> **Text → AI Video** — runs entirely on your laptop, free, every day.

![Snap Video Studio](https://img.shields.io/badge/version-1.0.0-7c5cfc?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-00e5ff?style=for-the-badge)

---

## 📁 Folder Structure

```
snap-video-studio/
├── backend/
│   ├── main.py            ← FastAPI server
│   ├── config.json        ← Provider & settings (edit to switch AI model)
│   ├── requirements.txt   ← Python dependencies
│   └── videos/            ← Generated videos stored here (auto-created)
│       └── history.json   ← Video metadata
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx        ← Main React UI
│   │   ├── api.js         ← API calls
│   │   ├── index.js
│   │   └── index.css      ← Tailwind + custom styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── start.sh               ← One-command launcher (Mac/Linux)
├── start.bat              ← One-command launcher (Windows)
└── README.md
```

---

## 🚀 Quick Start (runs locally, FREE, every day)

### Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Python | 3.9+ | `python3 --version` |
| Node.js | 16+ | `node --version` |
| npm | 8+ | `npm --version` |

### Option A — One-command start (recommended)

**Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```
Double-click start.bat
```

That's it! Both servers start automatically.  
Open **http://localhost:3000** in your browser.

---

### Option B — Manual start

#### 1. Backend
```bash
cd backend

# Create virtual environment (first time only)
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

#### 2. Frontend (new terminal)
```bash
cd frontend
npm install --legacy-peer-deps   # first time only
npm start
```

Open **http://localhost:3000**

---

## 🎯 Daily Use (after first setup)

Every day, just run:
```bash
./start.sh          # Mac/Linux
start.bat           # Windows
```
Or manually in two terminals:
```bash
# Terminal 1
cd backend && source .venv/bin/activate && uvicorn main:app --port 5000 --reload

# Terminal 2
cd frontend && npm start
```

---

## 🤖 AI Providers

### 1. Demo Mode (default — works instantly, no GPU needed)
Uses a fast mock generator so you can test the UI right now.

### 2. Stable Video Diffusion (Free, needs ~8 GB VRAM)
Best option for most laptops with a decent GPU.

**Setup:**
```bash
# Activate venv
source backend/.venv/bin/activate

# Install extra deps
pip install torch torchvision diffusers transformers accelerate \
            imageio[ffmpeg] Pillow numpy

# Edit backend/config.json:
# "provider": "stable_video_diffusion"
```
- Uses [`stabilityai/stable-video-diffusion-img2vid-xt`](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt) — free on HuggingFace
- Optionally set `"huggingface_token": "hf_xxx"` in config if the model is gated

### 3. HunyuanVideo (Best quality — needs 80 GB VRAM / professional GPU)
Tencent's open-source video model. For high-end workstations only.

**Setup:**
```bash
# Clone the Tencent repo
git clone https://github.com/Tencent/HunyuanVideo.git backend/models/HunyuanVideo

# Follow their installation guide for model weights (~50 GB download)
# Then edit backend/config.json:
# "provider": "hunyuan"
```

---

## ⚙️ Configuration (`backend/config.json`)

```json
{
  "provider": "mock",
  "mock_delay_seconds": 3,
  "huggingface_token": "",
  "max_saved_videos": 5,
  "watermark_text": "Created with Snap Video Studio"
}
```

| Key | Values | Description |
|-----|--------|-------------|
| `provider` | `"mock"` / `"stable_video_diffusion"` / `"hunyuan"` | Active AI backend |
| `mock_delay_seconds` | 1–10 | Fake delay in demo mode |
| `huggingface_token` | `"hf_xxx"` | HuggingFace API token (optional) |
| `max_saved_videos` | 1–10 | Auto-save limit (old files auto-deleted) |
| `watermark_text` | any string | Embedded watermark |

You can also change these live in the **Settings ⚙️** panel in the UI.

---

## 📐 Supported Options

| Feature | Options |
|---------|---------|
| Aspect Ratio | 16:9 (Landscape), 9:16 (Portrait), 1:1 (Square) |
| Resolution | 1080p, 4K, 8K |
| Prompt length | Up to 2000 characters |
| History | Last 5 videos auto-saved (configurable) |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/generate` | Generate a video |
| `GET` | `/api/videos` | List saved videos |
| `DELETE` | `/api/videos/{id}` | Delete a video |
| `GET` | `/api/config` | Get current config |
| `POST` | `/api/config` | Update config |
| `GET` | `/videos/{filename}` | Serve video file |

**Swagger docs:** http://localhost:5000/docs

### Example generate request:
```bash
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A golden sunset over a calm ocean, drone shot",
    "aspect_ratio": "16:9",
    "resolution": "1080p"
  }'
```

---

## ☁️ Optional: Deploy to Free Cloud

### Frontend → Vercel / Netlify
```bash
cd frontend
npm run build        # creates /build folder

# Vercel
npx vercel deploy --prod

# Netlify
npx netlify-cli deploy --prod --dir=build
```
Set env var `REACT_APP_API_URL=https://your-backend.onrender.com`

### Backend → Render (free tier)
1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set: Build command `pip install -r requirements.txt`
4. Set: Start command `uvicorn main:app --host 0.0.0.0 --port 10000`
5. Add env var `PORT=10000`

---

## 🛠 Troubleshooting

| Problem | Fix |
|---------|-----|
| `uvicorn: command not found` | Run `pip install uvicorn` inside venv |
| `npm: command not found` | Install Node.js from https://nodejs.org |
| CORS error in browser | Make sure backend is running on port 5000 |
| Video won't play | Browser needs `video/mp4` support (use Chrome/Firefox) |
| `torch` install hangs | Install CPU-only: `pip install torch --index-url https://download.pytorch.org/whl/cpu` |
| Port 5000 in use (Mac) | Disable AirPlay Receiver in System Preferences → Sharing |

---

## 📝 License
MIT — free for personal and commercial use.

---

*Snap Video Studio — Made with ❤️ to run free, every single day.*
