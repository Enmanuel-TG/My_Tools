"use client";

import { useState } from "react";

export default function Home() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatType, setFormatType] = useState<"audio" | "video">("audio");
  const [cookiesFile, setCookiesFile] = useState<File | null>(null);
  const [cookiesId, setCookiesId] = useState<string | null>(null);
  const [uploadingCookies, setUploadingCookies] = useState(false);

  async function uploadCookies() {
    if (!cookiesFile) {
      setError("Please select a cookies file");
      return;
    }

    setUploadingCookies(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", cookiesFile);

      const res = await fetch(
        `https://my-tools-ocm5.onrender.com/upload-cookies`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || "Failed to upload cookies");
      }

      const data = await res.json();
      setCookiesId(data.cookies_id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cookies");
    } finally {
      setUploadingCookies(false);
    }
  }

  async function DownLoad() {
    if (!value.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        url: value,
        format_type: formatType,
      });
      if (cookiesId) {
        params.append("cookies_id", cookiesId);
      }

      const res = await fetch(
        `https://my-tools-ocm5.onrender.com/download?${params.toString()}`
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

        <div>
          <label
            htmlFor="cookies"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            Cookies File (Optional - helps bypass bot detection):
          </label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              id="cookies"
              type="file"
              accept=".txt,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setCookiesFile(file || null);
                setCookiesId(null);
              }}
              disabled={loading || uploadingCookies}
              style={{
                flex: 1,
                padding: "0.5rem",
                fontSize: "0.9rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {cookiesFile && (
              <button
                type="button"
                onClick={uploadCookies}
                disabled={loading || uploadingCookies || !!cookiesId}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                  backgroundColor: cookiesId ? "#4caf50" : "#0070f3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    loading || uploadingCookies || cookiesId
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {uploadingCookies
                  ? "Uploading..."
                  : cookiesId
                    ? "✓ Uploaded"
                    : "Upload"}
              </button>
            )}
          </div>
          {cookiesId && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#4caf50",
                marginTop: "0.25rem",
              }}
            >
              Cookies loaded successfully
            </p>
          )}
          <p
            style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}
          >
            Export cookies from your browser using extensions like &quot;Get
            cookies.txt LOCALLY&quot; or &quot;cookies.txt&quot;
          </p>
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
