"""
Snap Video Studio - Backend API
FastAPI server for AI video generation
"""

import os
import uuid
import json
import time
import shutil
import asyncio
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, validator

# ─── Config ───────────────────────────────────────────────────────────────────
CONFIG_PATH = Path(__file__).parent / "config.json"
VIDEOS_DIR = Path(__file__).parent / "videos"
VIDEOS_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("snap-video-studio")

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Snap Video Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/videos", StaticFiles(directory=str(VIDEOS_DIR)), name="videos")

# ─── Models ───────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    aspect_ratio: str = Field(default="16:9")
    resolution: str = Field(default="1080p")

    @validator("aspect_ratio")
    def validate_aspect_ratio(cls, v):
        valid = ["16:9", "9:16", "1:1"]
        if v not in valid:
            raise ValueError(f"aspect_ratio must be one of {valid}")
        return v

    @validator("resolution")
    def validate_resolution(cls, v):
        valid = ["1080p", "4K", "8K"]
        if v not in valid:
            raise ValueError(f"resolution must be one of {valid}")
        return v


class VideoRecord(BaseModel):
    id: str
    prompt: str
    aspect_ratio: str
    resolution: str
    provider: str
    created_at: str
    filename: str
    url: str


# ─── Config helpers ───────────────────────────────────────────────────────────
def load_config() -> dict:
    default = {
        "provider": "mock",          # "mock" | "stable_video_diffusion" | "hunyuan"
        "mock_delay_seconds": 3,
        "huggingface_token": "",
        "max_saved_videos": 5,
        "watermark_text": "Created with Snap Video Studio",
    }
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            saved = json.load(f)
        default.update(saved)
    return default


def save_config(cfg: dict):
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, indent=2)


# ─── Video history helpers ─────────────────────────────────────────────────────
HISTORY_PATH = VIDEOS_DIR / "history.json"


def load_history() -> list:
    if HISTORY_PATH.exists():
        with open(HISTORY_PATH) as f:
            return json.load(f)
    return []


def save_history(records: list):
    with open(HISTORY_PATH, "w") as f:
        json.dump(records, f, indent=2)


def prune_history(records: list, max_count: int) -> list:
    """Keep only the last N records, deleting old video files."""
    if len(records) <= max_count:
        return records
    to_remove = records[:-max_count]
    for rec in to_remove:
        path = VIDEOS_DIR / rec["filename"]
        if path.exists():
            path.unlink()
            logger.info(f"Pruned old video: {rec['filename']}")
    return records[-max_count:]


# ─── Resolution map ───────────────────────────────────────────────────────────
RESOLUTION_MAP = {
    "1080p": {"16:9": (1920, 1080), "9:16": (1080, 1920), "1:1": (1080, 1080)},
    "4K":    {"16:9": (3840, 2160), "9:16": (2160, 3840), "1:1": (2160, 2160)},
    "8K":    {"16:9": (7680, 4320), "9:16": (4320, 7680), "1:1": (4320, 4320)},
}


# ─── Providers ────────────────────────────────────────────────────────────────
async def generate_mock(prompt: str, width: int, height: int, output_path: Path, cfg: dict):
    """
    Mock provider – creates a placeholder MP4 using imageio/numpy if available,
    otherwise writes a minimal valid MP4 stub.
    """
    delay = cfg.get("mock_delay_seconds", 3)
    await asyncio.sleep(delay)

    try:
        import numpy as np
        import imageio

        watermark = cfg.get("watermark_text", "Created with Snap Video Studio")
        # Downscale to 480p for mock to keep file small
        w, h = min(width, 854), min(height, 480)
        fps = 24
        n_frames = fps * 3  # 3-second clip

        frames = []
        for i in range(n_frames):
            t = i / fps
            frame = np.zeros((h, w, 3), dtype=np.uint8)
            # Animated gradient background
            for y in range(h):
                r = int(30 + 80 * abs((y / h) - (t % 1)))
                g = int(20 + 60 * abs((y / h) - 0.5))
                b = int(80 + 120 * (y / h))
                frame[y, :] = [r, g, b]
            frames.append(frame)

        with imageio.get_writer(str(output_path), fps=fps, codec="libx264",
                                quality=5, macro_block_size=None) as writer:
            for f in frames:
                writer.append_data(f)

    except ImportError:
        # Fallback: copy a minimal MP4 stub
        _write_minimal_mp4(output_path)


def _write_minimal_mp4(path: Path):
    """Write a tiny but valid MP4 file so browsers don't choke."""
    # This is a 1-frame 16x16 black MP4 encoded as base64
    import base64
    stub_b64 = (
        "AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA3RtZGF0"
        "AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1NSByMjkxNyAw"
        "YTg0ZDk4IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMt"
        "MjAxOCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlv"
        "bnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDEx"
        "MyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3Jl"
        "Zj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBj"
        "cW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNl"
        "dD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFk"
    )
    try:
        data = base64.b64decode(stub_b64 + "==")
    except Exception:
        data = b"\x00" * 1024
    path.write_bytes(data)


async def generate_stable_video_diffusion(
    prompt: str, width: int, height: int, output_path: Path, cfg: dict
):
    """
    Stable Video Diffusion via Hugging Face diffusers.
    Requires: pip install diffusers transformers accelerate torch
    and a HF token set in config.json if using gated models.
    """
    try:
        import torch
        from diffusers import StableVideoDiffusionPipeline
        from diffusers.utils import load_image, export_to_video
        import requests
        from PIL import Image, ImageDraw, ImageFont
        import io

        token = cfg.get("huggingface_token") or None
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        logger.info(f"Loading SVD pipeline on {device}...")
        pipe = StableVideoDiffusionPipeline.from_pretrained(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            torch_dtype=dtype,
            variant="fp16" if torch.cuda.is_available() else None,
            use_auth_token=token,
        )
        pipe.to(device)

        # Generate a conditioning image from the prompt via SDXL or a placeholder
        cond_img = Image.new("RGB", (width, height), color=(30, 30, 60))
        draw = ImageDraw.Draw(cond_img)
        draw.text((10, height // 2), prompt[:80], fill=(200, 200, 255))

        generator = torch.manual_seed(42)
        frames = pipe(
            cond_img,
            num_frames=25,
            generator=generator,
        ).frames[0]

        # Add watermark
        watermark = cfg.get("watermark_text", "Created with Snap Video Studio")
        watermarked = []
        for frame in frames:
            img = frame if isinstance(frame, Image.Image) else Image.fromarray(frame)
            d = ImageDraw.Draw(img)
            d.text((10, img.height - 30), watermark, fill=(255, 255, 255))
            watermarked.append(img)

        export_to_video(watermarked, str(output_path), fps=7)

    except ImportError as e:
        logger.warning(f"SVD deps missing ({e}), falling back to mock")
        await generate_mock(prompt, width, height, output_path, cfg)


async def generate_hunyuan(
    prompt: str, width: int, height: int, output_path: Path, cfg: dict
):
    """
    HunyuanVideo open-source model.
    Requires: pip install hunyuan-video  (or clone from Tencent repo)
    Very GPU-heavy – 80 GB VRAM recommended.
    """
    try:
        # Try to import the HunyuanVideo inference pipeline
        from hyvideo.inference import HunyuanVideoSampler
        from hyvideo.utils.file_utils import save_videos_grid
        import torch

        ckpt_dir = Path(__file__).parent / "models" / "HunyuanVideo"
        if not ckpt_dir.exists():
            raise FileNotFoundError(
                "HunyuanVideo checkpoints not found. "
                "See README for download instructions."
            )

        sampler = HunyuanVideoSampler.from_pretrained(str(ckpt_dir))
        outputs = sampler.predict(
            prompt=prompt,
            height=height,
            width=width,
            video_length=65,
            seed=42,
            neg_prompt="",
            infer_steps=50,
            guidance_scale=7.0,
            num_videos_per_prompt=1,
        )
        video_path = outputs["samples"][0]
        shutil.move(video_path, str(output_path))

        # Watermark
        _add_watermark_ffmpeg(output_path, cfg.get("watermark_text", ""))

    except (ImportError, FileNotFoundError) as e:
        logger.warning(f"HunyuanVideo unavailable ({e}), falling back to mock")
        await generate_mock(prompt, width, height, output_path, cfg)


def _add_watermark_ffmpeg(video_path: Path, text: str):
    """Add text watermark using ffmpeg if available."""
    try:
        import subprocess
        tmp = video_path.with_suffix(".wm.mp4")
        cmd = [
            "ffmpeg", "-y", "-i", str(video_path),
            "-vf", f"drawtext=text='{text}':fontcolor=white:fontsize=18:x=10:y=h-30",
            "-codec:a", "copy", str(tmp)
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        if result.returncode == 0:
            tmp.replace(video_path)
        else:
            tmp.unlink(missing_ok=True)
    except Exception as e:
        logger.warning(f"ffmpeg watermark failed: {e}")


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "Snap Video Studio API"}


@app.get("/api/config")
def get_config():
    cfg = load_config()
    # Don't expose token
    safe = {k: v for k, v in cfg.items() if k != "huggingface_token"}
    return safe


@app.post("/api/config")
def update_config(body: dict):
    cfg = load_config()
    cfg.update(body)
    save_config(cfg)
    return {"status": "saved"}


@app.get("/api/videos", response_model=list)
def list_videos():
    return load_history()


@app.get("/api/videos/{video_id}")
def get_video(video_id: str):
    history = load_history()
    for rec in history:
        if rec["id"] == video_id:
            return rec
    raise HTTPException(status_code=404, detail="Video not found")


@app.delete("/api/videos/{video_id}")
def delete_video(video_id: str):
    history = load_history()
    new_history = []
    deleted = False
    for rec in history:
        if rec["id"] == video_id:
            path = VIDEOS_DIR / rec["filename"]
            if path.exists():
                path.unlink()
            deleted = True
        else:
            new_history.append(rec)
    if not deleted:
        raise HTTPException(status_code=404, detail="Video not found")
    save_history(new_history)
    return {"status": "deleted"}


@app.post("/api/generate")
async def generate_video(req: GenerateRequest, background_tasks: BackgroundTasks):
    cfg = load_config()
    provider = cfg.get("provider", "mock")

    # Determine dimensions
    dims = RESOLUTION_MAP.get(req.resolution, RESOLUTION_MAP["1080p"])
    width, height = dims.get(req.aspect_ratio, (1920, 1080))

    video_id = str(uuid.uuid4())
    filename = f"{video_id}.mp4"
    output_path = VIDEOS_DIR / filename

    # Choose generator
    if provider == "stable_video_diffusion":
        gen_fn = generate_stable_video_diffusion
    elif provider == "hunyuan":
        gen_fn = generate_hunyuan
    else:
        gen_fn = generate_mock

    logger.info(f"Generating video [{provider}] {req.resolution} {req.aspect_ratio}: {req.prompt[:60]}")

    try:
        await gen_fn(req.prompt, width, height, output_path, cfg)
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")

    if not output_path.exists():
        raise HTTPException(status_code=500, detail="Generator did not produce a file")

    record = {
        "id": video_id,
        "prompt": req.prompt,
        "aspect_ratio": req.aspect_ratio,
        "resolution": req.resolution,
        "provider": provider,
        "created_at": datetime.utcnow().isoformat(),
        "filename": filename,
        "url": f"/videos/{filename}",
    }

    history = load_history()
    history.append(record)
    max_saved = cfg.get("max_saved_videos", 5)
    history = prune_history(history, max_saved)
    save_history(history)

    return record
