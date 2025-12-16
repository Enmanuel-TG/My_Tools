"use client";

import { useState } from "react";

export default function Home() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatType, setFormatType] = useState<"audio" | "video">("audio");

  async function DownLoad() {
    if (!value.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = encodeURIComponent(value);
      const res = await fetch(
        `https://my-tools-ocm5.onrender.com/download?url=${url}&format_type=${formatType}`
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: res.statusText }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${res.status}`
        );
      }

      // Get the blob from the response
      const blob = await res.blob();

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download =
        res.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") ||
        `download.${formatType === "audio" ? "mp3" : "mp4"}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Download error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Video/Audio Downloader</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          DownLoad();
        }}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label
            htmlFor="url"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            YouTube URL:
          </label>
          <input
            id="url"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Format:
          </label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <label>
              <input
                type="radio"
                value="audio"
                checked={formatType === "audio"}
                onChange={(e) =>
                  setFormatType(e.target.value as "audio" | "video")
                }
                disabled={loading}
              />
              Audio (MP3)
            </label>
            <label>
              <input
                type="radio"
                value="video"
                checked={formatType === "video"}
                onChange={(e) =>
                  setFormatType(e.target.value as "audio" | "video")
                }
                disabled={loading}
              />
              Video
            </label>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#fee",
              color: "#c33",
              borderRadius: "4px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !value.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: loading ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Downloading..." : "Download"}
        </button>
      </form>
    </div>
  );
}
