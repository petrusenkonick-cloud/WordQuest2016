"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface CameraScreenProps {
  onCapture: (images: string[]) => void;
  onCancel: () => void;
}

export function CameraScreen({ onCapture, onCancel }: CameraScreenProps) {
  const [mode, setMode] = useState<"camera" | "preview">("camera");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Cannot access camera. Please use gallery instead.");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (videoRef.current && stream) {
      setIsCapturing(true);
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImages((prev) => [...prev, imageData]);
      }
      setTimeout(() => setIsCapturing(false), 200);
    }
  }, [stream]);

  // Handle file selection from gallery (multiple files)
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        stopCamera();
        const newImages: string[] = [];
        let processed = 0;

        Array.from(files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            newImages.push(event.target?.result as string);
            processed++;
            if (processed === files.length) {
              setCapturedImages((prev) => [...prev, ...newImages]);
              setMode("preview");
            }
          };
          reader.readAsDataURL(file);
        });
      }
    },
    [stopCamera]
  );

  // Go to preview mode
  const goToPreview = useCallback(() => {
    if (capturedImages.length > 0) {
      stopCamera();
      setMode("preview");
    }
  }, [capturedImages.length, stopCamera]);

  // Confirm and send images
  const confirmImages = useCallback(() => {
    if (capturedImages.length > 0) {
      onCapture(capturedImages);
    }
  }, [capturedImages, onCapture]);

  // Remove an image
  const removeImage = useCallback((index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add more photos
  const addMore = useCallback(() => {
    setMode("camera");
    startCamera();
  }, [startCamera]);

  // Cancel and go back
  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  return (
    <div className="camera-screen active">
      {/* Header */}
      <div className="camera-header">
        <button className="camera-close-btn" onClick={handleCancel}>
          ✕
        </button>
        <h2>📸 SCAN HOMEWORK</h2>
        <div style={{ width: "40px" }}>
          {capturedImages.length > 0 && mode === "camera" && (
            <button
              className="camera-close-btn"
              onClick={goToPreview}
              style={{ background: "var(--emerald)", border: "none" }}
            >
              {capturedImages.length}
            </button>
          )}
        </div>
      </div>

      {/* Camera View */}
      {mode === "camera" && (
        <div className="camera-view">
          {cameraError ? (
            <div className="camera-error">
              <div className="camera-error-icon">📷</div>
              <p>{cameraError}</p>
              <button
                className="btn btn-diamond"
                onClick={() => fileInputRef.current?.click()}
              >
                🖼️ Open Gallery
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />

              {/* Viewfinder overlay */}
              <div className="camera-viewfinder">
                <div className="viewfinder-corner tl" />
                <div className="viewfinder-corner tr" />
                <div className="viewfinder-corner bl" />
                <div className="viewfinder-corner br" />
                <div className="viewfinder-hint">Point at your homework</div>
              </div>

              {/* Flash effect */}
              {isCapturing && <div className="camera-flash" />}

              {/* Image counter badge */}
              {capturedImages.length > 0 && (
                <div className="capture-badge">{capturedImages.length} pages</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Preview Mode */}
      {mode === "preview" && (
        <div className="camera-preview-multi">
          <div className="preview-grid">
            {capturedImages.map((img, index) => (
              <div key={index} className="preview-item">
                <img src={img} alt={`Page ${index + 1}`} />
                <div className="preview-item-number">{index + 1}</div>
                <button
                  className="preview-item-remove"
                  onClick={() => removeImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="preview-hint">
            {capturedImages.length} page{capturedImages.length > 1 ? "s" : ""} captured
            {capturedImages.length > 1 && " • AI will process them in order"}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="camera-controls">
        {mode === "camera" ? (
          <>
            {/* Gallery button */}
            <button
              className="camera-btn gallery-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              🖼️
            </button>

            {/* Capture button */}
            <button
              className={`camera-btn capture-btn ${stream ? "active" : ""}`}
              onClick={capturePhoto}
              disabled={!stream}
            >
              <span className="capture-inner">📸</span>
            </button>

            {/* Done / Next */}
            {capturedImages.length > 0 ? (
              <button className="camera-btn done-btn" onClick={goToPreview}>
                ✓
              </button>
            ) : (
              <div style={{ width: "60px" }} />
            )}
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={addMore}>
              📷 Add More
            </button>
            <button className="btn btn-emerald" onClick={confirmImages}>
              ⚡ Create Game!
            </button>
          </>
        )}
      </div>

      {/* Hidden file input (multiple) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {/* Bottom hint */}
      <div className="camera-hint">
        {mode === "camera"
          ? "Take photos of all homework pages in order"
          : "Review pages • AI will understand the sequence"}
      </div>
    </div>
  );
}
