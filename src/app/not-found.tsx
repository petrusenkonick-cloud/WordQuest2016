export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <div style={{ fontSize: "4rem", marginBottom: "20px" }}>404</div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#888", marginBottom: "30px" }}>
        The spell you&apos;re looking for doesn&apos;t exist in this realm.
      </p>
      <a
        href="/"
        style={{
          padding: "12px 24px",
          background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "bold",
        }}
      >
        Return to Academy
      </a>
    </div>
  );
}
