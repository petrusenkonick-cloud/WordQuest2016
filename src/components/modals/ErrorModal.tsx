"use client";

interface ErrorModalProps {
  error: string;
  onClose: () => void;
}

export function ErrorModal({ error, onClose }: ErrorModalProps) {
  // Parse error to detect type and show appropriate icon
  const getErrorIcon = () => {
    if (error.includes("homework") || error.includes("NOT_HOMEWORK")) return "📚";
    if (error.includes("blank") || error.includes("black") || error.includes("BLANK")) return "📷";
    if (error.includes("read") || error.includes("UNREADABLE") || error.includes("blurry")) return "🔍";
    if (error.includes("appropriate") || error.includes("INAPPROPRIATE")) return "⚠️";
    if (error.includes("exercises") || error.includes("questions")) return "📝";
    if (error.includes("internet") || error.includes("timeout") || error.includes("long")) return "🌐";
    if (error.includes("server") || error.includes("busy")) return "🔧";
    return "❌";
  };

  const getTitle = () => {
    if (error.includes("homework") || error.includes("NOT_HOMEWORK")) return "Not Homework";
    if (error.includes("blank") || error.includes("black") || error.includes("BLANK")) return "Empty Photo";
    if (error.includes("read") || error.includes("UNREADABLE") || error.includes("blurry")) return "Can't Read";
    if (error.includes("appropriate") || error.includes("INAPPROPRIATE")) return "Not Allowed";
    if (error.includes("exercises") || error.includes("questions")) return "No Exercises Found";
    if (error.includes("internet") || error.includes("timeout") || error.includes("long")) return "Connection Issue";
    if (error.includes("server") || error.includes("busy")) return "Server Busy";
    return "Oops!";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #1f1f3a 0%, #151528 100%)",
          borderRadius: "20px",
          padding: "24px",
          maxWidth: "340px",
          width: "100%",
          textAlign: "center",
          border: "3px solid #ef4444",
          boxShadow: "0 0 30px rgba(239, 68, 68, 0.3), inset 0 0 60px rgba(0,0,0,0.3)",
          animation: "scaleIn 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "4em",
            marginBottom: "12px",
            animation: "bounce 0.5s ease",
          }}
        >
          {getErrorIcon()}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "1.5em",
            color: "#ef4444",
            margin: "0 0 16px 0",
            fontWeight: "bold",
          }}
        >
          {getTitle()}
        </h2>

        {/* Error message - formatted with line breaks */}
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          {error.split("\n").map((line, i) => (
            <p
              key={i}
              style={{
                color: line.startsWith("•") ? "#fca5a5" : "#fff",
                fontSize: line.startsWith("•") ? "0.9em" : "1em",
                margin: i === 0 ? 0 : "8px 0 0 0",
                lineHeight: 1.5,
                textAlign: line.startsWith("•") ? "left" : "center",
                paddingLeft: line.startsWith("•") ? "10px" : 0,
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Try Again button */}
        <button
          onClick={onClose}
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "14px 40px",
            fontSize: "1.1em",
            fontWeight: "bold",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.4)";
          }}
        >
          Try Again
        </button>

        {/* Tip */}
        <p
          style={{
            color: "#6b7280",
            fontSize: "0.8em",
            marginTop: "16px",
            margin: "16px 0 0 0",
          }}
        >
          Tap anywhere to close
        </p>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
