from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import subprocess
import uuid
import os
import shutil

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://my-tools-ocm5.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOAD_DIR = "downloads"
DOWNLOAD_DIR_PATH = Path(DOWNLOAD_DIR)
DOWNLOAD_DIR_PATH.mkdir(exist_ok=True)

def check_node_available():
    """Check if Node.js is available for yt-dlp JavaScript runtime"""
    return shutil.which("node") is not None

@app.get("/")
def health():
    return {"status": "ok", "node_available": check_node_available()}

@app.get("/download")
def download(
    url: str = Query(..., description="YouTube URL to download"),
    format_type: str = Query("audio", description="Download format: 'audio' or 'video'")
):
    file_id = str(uuid.uuid4())
    output = f"{DOWNLOAD_DIR}/{file_id}.%(ext)s"

    # Base yt-dlp command with anti-bot measures
    cmd = [
        "yt-dlp",
        # Format selection
        "-f", "bestaudio/best" if format_type == "audio" else "best",
        # Audio extraction (only for audio format)
        *(["--extract-audio", "--audio-format", "mp3"] if format_type == "audio" else []),
        # Output
        "-o", output,
        # Playlist handling
        "--no-playlist",
        # Anti-bot measures
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "--referer", "https://www.youtube.com/",
        "--add-header", "Accept-Language:en-US,en;q=0.9",
        # JavaScript runtime (if Node.js is available)
        *(["--js-runtimes", "node"] if check_node_available() else []),
        # Additional options to reduce bot detection
        "--extractor-args", "youtube:player_client=web",
        "--no-check-certificate",
        # Quiet mode to reduce output
        "--quiet",
        "--no-warnings",
        url
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or "Unknown error occurred"
            # Provide more helpful error messages
            if "429" in error_msg or "Too Many Requests" in error_msg:
                raise HTTPException(
                    status_code=429,
                    detail="YouTube rate limit exceeded. Please try again later or use cookies for authentication."
                )
            elif "Sign in to confirm" in error_msg or "bot" in error_msg.lower():
                raise HTTPException(
                    status_code=403,
                    detail="YouTube bot detection triggered. Consider using cookies for authentication."
                )
            else:
                raise HTTPException(status_code=500, detail=error_msg)

        # Find the file yt-dlp produced
        produced_files = list(DOWNLOAD_DIR_PATH.glob(f"{file_id}.*"))
        if not produced_files:
            raise HTTPException(
                status_code=500,
                detail="Downloaded file not found. Check yt-dlp output for errors."
            )

        file_path = produced_files[0]
        
        # Determine media type based on file extension
        ext = file_path.suffix.lower()
        media_types = {
            ".mp3": "audio/mpeg",
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".m4a": "audio/mp4",
        }
        media_type = media_types.get(ext, "application/octet-stream")

        # Return the file so the frontend can trigger a download directly
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=file_path.name,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Download timeout. The video may be too large or the connection is slow.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")