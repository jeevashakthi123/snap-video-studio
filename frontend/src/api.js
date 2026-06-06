const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export async function generateVideo({ prompt, aspect_ratio, resolution }) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspect_ratio, resolution }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error ${res.status}`);
  }
  return res.json();
}

export async function listVideos() {
  const res = await fetch(`${BASE}/api/videos`);
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

export async function deleteVideo(id) {
  const res = await fetch(`${BASE}/api/videos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete video");
  return res.json();
}

export async function getConfig() {
  const res = await fetch(`${BASE}/api/config`);
  if (!res.ok) throw new Error("Failed to load config");
  return res.json();
}

export async function updateConfig(cfg) {
  const res = await fetch(`${BASE}/api/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error("Failed to save config");
  return res.json();
}

export function videoUrl(filename) {
  return `${BASE}/videos/${filename}`;
}
