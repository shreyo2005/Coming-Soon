import { useState, useRef } from "react";
import { s, colors } from "../theme";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

// Reusable photo capture: device upload OR live webcam.
// Uploads to backend immediately, calls onUploaded(path).
export default function PhotoCapture({ role, userId, accent, onUploaded }) {
  const [mode, setMode] = useState(null);     // null | "webcam"
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const a = accent || colors.accent;

  // ---- Device file upload ----
  const onFilePick = (e) => {
    const file = e.target.files[0];
    if (file) upload(file);
  };

  // ---- Webcam ----
  const startWebcam = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setMode("webcam");
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch {
      setError("Could not access camera. Check browser permissions.");
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMode(null);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
      stopWebcam();
      upload(file, true);
    }, "image/jpeg", 0.9);
  };

  // ---- Upload to backend ----
  const upload = async (file, isWebcam = false) => {
    if (file.size > 5 * 1024 * 1024) return setError("Image must be under 5 MB");
    setUploading(true); setError("");
    setPreview(URL.createObjectURL(file));
    const endpoint = isWebcam ? "upload-webcam-image" : "upload-photo";
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${BASE}/profile/${endpoint}?role=${role}&id=${userId}`, {
        method: "POST", body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      const data = await res.json();
      setDone(true);
      if (onUploaded) onUploaded(data.path);
    } catch (e) {
      setError(e.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={s.label}>Profile photo</label>

      {/* Preview circle */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden",
          background: colors.bg, border: `1px solid ${colors.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", color: colors.textFaint, flexShrink: 0,
        }}>
          {preview ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📷"}
        </div>
        <div style={{ fontSize: "12.5px", color: done ? a : colors.textSoft }}>
          {uploading ? "Uploading..." : done ? "✓ Photo uploaded" : "Upload from device or use your camera"}
        </div>
      </div>

      {error && <div style={{ ...s.err, marginBottom: "12px" }}>{error}</div>}

      {mode === "webcam" ? (
        <div>
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: "10px", background: "#000", marginBottom: "10px" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ ...s.btn(a), marginBottom: 0 }} onClick={capture}>Capture</button>
            <button style={s.btnGhost} onClick={stopWebcam}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ ...s.btnGhost, flex: 1 }} onClick={() => fileInputRef.current.click()}>
            Upload file
          </button>
          <button style={{ ...s.btnGhost, flex: 1 }} onClick={startWebcam}>
            Use camera
          </button>
          <input
            ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg"
            onChange={onFilePick} style={{ display: "none" }}
          />
        </div>
      )}
    </div>
  );
}
