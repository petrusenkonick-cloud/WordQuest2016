"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface CameraScreenProps {
  onCapture: (images: string[]) => void;
  onCancel: () => void;
}

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: "8px",
      marginBottom: "15px",
    }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === currentStep ? "30px" : "10px",
            height: "10px",
            borderRadius: "5px",
            background: i <= currentStep
              ? "linear-gradient(90deg, #8b5cf6, #6366f1)"
              : "rgba(255,255,255,0.2)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// Animated tip component
function AnimatedTip({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: "rgba(139, 92, 246, 0.2)",
      borderRadius: "12px",
      padding: "12px 16px",
      border: "1px solid rgba(139, 92, 246, 0.3)",
      animation: "pulse 2s infinite",
    }}>
      <span style={{ fontSize: "1.5em" }}>{emoji}</span>
      <span style={{ color: "#c4b5fd", fontSize: "0.95em" }}>{text}</span>
    </div>
  );
}

// Maximum photos allowed
const MAX_PHOTOS = 50;

export function CameraScreen({ onCapture, onCancel }: CameraScreenProps) {
  const [step, setStep] = useState<"intro" | "camera" | "preview" | "processing">("intro");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processingText, setProcessingText] = useState("Analyzing your homework...");
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Processing animation texts
  useEffect(() => {
    if (step === "processing") {
      const texts = [
        "Reading your homework...",
        "Finding the topics...",
        "Creating fun questions...",
        "Adding magic to the game...",
        "Almost ready!",
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setProcessingText(texts[i]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Start camera when entering camera step
  useEffect(() => {
    if (step === "camera") {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [step]);

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
      setCameraError("Camera not available - use the gallery button!");
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
      // Check photo limit
      if (capturedImages.length >= MAX_PHOTOS) {
        setLimitWarning(`Maximum ${MAX_PHOTOS} photos! Remove some to add more.`);
        setTimeout(() => setLimitWarning(null), 3000);
        return;
      }

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
  }, [stream, capturedImages.length]);

  // Handle file selection from gallery (multiple files)
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        stopCamera();

        // Calculate how many more photos we can add
        const remainingSlots = MAX_PHOTOS - capturedImages.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        if (files.length > remainingSlots) {
          setLimitWarning(`Only added ${remainingSlots} photos (limit is ${MAX_PHOTOS})`);
          setTimeout(() => setLimitWarning(null), 4000);
        }

        if (filesToProcess.length === 0) {
          setLimitWarning(`Maximum ${MAX_PHOTOS} photos! Remove some to add more.`);
          setTimeout(() => setLimitWarning(null), 3000);
          return;
        }

        const newImages: string[] = [];
        let processed = 0;

        filesToProcess.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            newImages.push(event.target?.result as string);
            processed++;
            if (processed === filesToProcess.length) {
              setCapturedImages((prev) => [...prev, ...newImages]);
              setStep("preview");
            }
          };
          reader.readAsDataURL(file);
        });
      }
    },
    [stopCamera, capturedImages.length]
  );

  // Go to preview step
  const goToPreview = useCallback(() => {
    if (capturedImages.length > 0) {
      stopCamera();
      setStep("preview");
    }
  }, [capturedImages.length, stopCamera]);

  // Confirm and send images
  const confirmImages = useCallback(() => {
    if (capturedImages.length > 0) {
      setStep("processing");
      // Small delay to show processing animation
      setTimeout(() => {
        onCapture(capturedImages);
      }, 3000);
    }
  }, [capturedImages, onCapture]);

  // Remove an image
  const removeImage = useCallback((index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add more photos
  const addMore = useCallback(() => {
    setStep("camera");
    startCamera();
  }, [startCamera]);

  // Cancel and go back
  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  // Start scanning
  const startScanning = useCallback(() => {
    setStep("camera");
  }, []);

  // Get current step number for indicator
  const getStepNumber = () => {
    switch (step) {
      case "intro": return 0;
      case "camera": return 1;
      case "preview": return 2;
      case "processing": return 3;
      default: return 0;
    }
  };

  return (
    <div className="camera-screen active">
      {/* Header */}
      <div className="camera-header">
        <button className="camera-close-btn" onClick={handleCancel}>
          ✕
        </button>
        <h2>
          {step === "intro" && "📚 HOMEWORK HELPER"}
          {step === "camera" && "📷 TAKE PHOTOS"}
          {step === "preview" && "👀 CHECK PHOTOS"}
          {step === "processing" && "🔮 ANALYZING..."}
        </h2>
        <div style={{ width: "40px" }}>
          {capturedImages.length > 0 && step === "camera" && (
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

      {/* Step Indicator */}
      <StepIndicator currentStep={getStepNumber()} totalSteps={4} />

      {/* STEP 1: Intro */}
      {step === "intro" && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: "20px",
          gap: "16px",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "3.5em",
            animation: "bounce 1s infinite",
          }}>
            📚
          </div>

          <h2 style={{
            fontSize: "1.4em",
            color: "white",
            margin: 0,
          }}>
            Homework Helper!
          </h2>

          <p style={{
            color: "#a5b4fc",
            fontSize: "0.95em",
            maxWidth: "300px",
            lineHeight: 1.5,
          }}>
            Take a photo of your homework - I will help you solve it, then you can write the answers on paper!
          </p>

          {/* What to photograph */}
          <div style={{
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            borderRadius: "12px",
            padding: "12px",
            width: "100%",
            maxWidth: "300px",
          }}>
            <div style={{ color: "#22c55e", fontWeight: "bold", marginBottom: "8px", fontSize: "0.9em" }}>
              ✅ WHAT TO PHOTOGRAPH:
            </div>
            <div style={{ color: "#a5b4fc", fontSize: "0.85em", lineHeight: 1.4 }}>
              • Textbook pages with exercises<br/>
              • Workbook pages with problems<br/>
              • Printed homework sheets
            </div>
          </div>

          {/* What NOT to photograph */}
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "12px",
            padding: "12px",
            width: "100%",
            maxWidth: "300px",
          }}>
            <div style={{ color: "#ef4444", fontWeight: "bold", marginBottom: "8px", fontSize: "0.9em" }}>
              ❌ WON&apos;T WORK:
            </div>
            <div style={{ color: "#fca5a5", fontSize: "0.85em", lineHeight: 1.4 }}>
              • Selfies and random photos<br/>
              • Blank or black screens<br/>
              • Game screenshots
            </div>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            maxWidth: "300px",
            marginTop: "5px",
          }}>
            <AnimatedTip emoji="1️⃣" text="Take a photo of your homework" />
            <AnimatedTip emoji="2️⃣" text="Solve the problems in the game" />
            <AnimatedTip emoji="3️⃣" text="Write answers on paper!" />
          </div>

          <button
            onClick={startScanning}
            style={{
              marginTop: "15px",
              padding: "14px 36px",
              fontSize: "1.1em",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              border: "none",
              borderRadius: "16px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
            }}
          >
            <span>📷 Scan Homework</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "10px 20px",
              fontSize: "0.9em",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "12px",
              color: "#a5b4fc",
              cursor: "pointer",
            }}
          >
            🖼️ Pick from gallery
          </button>
        </div>
      )}

      {/* STEP 2: Camera View */}
      {step === "camera" && (
        <div className="camera-view">
          {cameraError ? (
            <div className="camera-error">
              <div style={{ fontSize: "3em", marginBottom: "15px" }}>📱</div>
              <p style={{ color: "#fca5a5", marginBottom: "5px" }}>{cameraError}</p>
              <p style={{ color: "#a5b4fc", fontSize: "0.9em", marginBottom: "20px" }}>
                No worries! Just pick photos from your gallery
              </p>
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
                <div className="viewfinder-hint">
                  {capturedImages.length === 0
                    ? "Point at your homework page"
                    : "Add more pages if needed"}
                </div>
              </div>

              {/* Flash effect */}
              {isCapturing && <div className="camera-flash" />}

              {/* Limit warning */}
              {limitWarning && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(239, 68, 68, 0.95)",
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  zIndex: 100,
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}>
                  ⚠️ {limitWarning}
                </div>
              )}

              {/* Image counter badge */}
              {capturedImages.length > 0 && (
                <div className="capture-badge">
                  {capturedImages.length}/{MAX_PHOTOS} page{capturedImages.length > 1 ? "s" : ""} captured!
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP 3: Preview Mode */}
      {step === "preview" && (
        <div className="camera-preview-multi">
          <div style={{
            textAlign: "center",
            marginBottom: "15px",
          }}>
            <p style={{ color: "#22c55e", fontSize: "1.1em", margin: 0 }}>
              Great job! Check your photos
            </p>
            <p style={{ color: "#a5b4fc", fontSize: "0.85em", marginTop: "5px" }}>
              Tap ✕ on any photo to remove it
            </p>
          </div>

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

          <p className="preview-hint" style={{ marginTop: "15px" }}>
            {capturedImages.length} page{capturedImages.length > 1 ? "s" : ""} ready
            {capturedImages.length > 1 && " - AI will read them in order"}
          </p>
        </div>
      )}

      {/* STEP 4: Processing */}
      {step === "processing" && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: "20px",
          gap: "25px",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "4em",
            animation: "spin 2s linear infinite",
          }}>
            🔮
          </div>

          <h2 style={{
            fontSize: "1.4em",
            color: "white",
            margin: 0,
          }}>
            Magic in Progress!
          </h2>

          <p style={{
            color: "#c4b5fd",
            fontSize: "1.1em",
            animation: "pulse 2s infinite",
          }}>
            {processingText}
          </p>

          <div style={{
            width: "200px",
            height: "6px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "3px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
              borderRadius: "3px",
              animation: "loading 2s ease-in-out infinite",
            }} />
          </div>

          <p style={{
            color: "#a5b4fc",
            fontSize: "0.9em",
            maxWidth: "250px",
          }}>
            This might take a moment...
            <br />
            Your game will be extra fun!
          </p>
        </div>
      )}

      {/* Controls */}
      {(step === "camera" || step === "preview") && (
        <div className="camera-controls">
          {step === "camera" ? (
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
              <button
                className="btn btn-emerald"
                onClick={confirmImages}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>Create Game!</span>
                <span style={{ fontSize: "1.2em" }}>🎮</span>
              </button>
            </>
          )}
        </div>
      )}

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
      {(step === "camera" || step === "preview") && (
        <div className="camera-hint">
          {step === "camera"
            ? capturedImages.length === 0
              ? "Tap the camera button to take a photo"
              : "Tap ✓ when you have all pages"
            : "Tap 'Create Game!' when ready"}
        </div>
      )}

      {/* CSS animations */}
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
