from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import subprocess
import uuid
import os

app = FastAPI()

DOWNLOAD_DIR = "downloads"
DOWNLOAD_DIR_PATH = Path(DOWNLOAD_DIR)
DOWNLOAD_DIR_PATH.mkdir(exist_ok=True)

@app.get("/")
def health():
    return {"status": "ok"}

@app.get("/download")
def download(url: str):
    file_id = str(uuid.uuid4())
    output = f"{DOWNLOAD_DIR}/{file_id}.%(ext)s"

    cmd = [
        "yt-dlp",
        "-f", "bestaudio/best",
        "--extract-audio",
        "--audio-format", "mp3",
        "-o", output,
        "--no-playlist",
        url
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=result.stderr)

    # Find the file yt-dlp produced (should be mp3 due to options above)
    produced_files = list(DOWNLOAD_DIR_PATH.glob(f"{file_id}.*"))
    if not produced_files:
        raise HTTPException(status_code=500, detail="Downloaded file not found")

    file_path = produced_files[0]

    # Return the file so the frontend can trigger a download directly
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=file_path.name,
    )