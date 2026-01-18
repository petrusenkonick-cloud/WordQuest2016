"use client";

import { InfoButton } from "./InfoButton";

interface SectionHeaderProps {
  title: string;
  icon?: string;
  infoKey?: string;
  className?: string;
}

const SECTION_INFO: Record<string, string> = {
  learn: "This is the main learning area. Scan your homework to create games or follow the Quest Map to learn new words!",
  practice: "Train on your mistakes here. The more you practice, the fewer errors you'll make!",
  play: "Play fun mini-games to strengthen your skills and earn rewards!",
  progress: "Track your achievements and compete with other wizards!",
  settings: "Parent settings and your spell book collection.",
};

export function SectionHeader({ title, icon, infoKey, className = "" }: SectionHeaderProps) {
  return (
    <div
      className={`section-header ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        margin: "16px 0 12px 0",
        position: "relative",
      }}
    >
      {/* Left decorative line */}
      <div style={{
        flex: 1,
        height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5))",
        maxWidth: "40px",
      }} />

      {/* Title badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
        border: "2px solid rgba(139, 92, 246, 0.5)",
        borderRadius: "20px",
        padding: "6px 14px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}>
        {icon && <span style={{ fontSize: "1em" }}>{icon}</span>}
        <span style={{
          color: "#e2e8f0",
          fontWeight: "bold",
          fontSize: "0.75em",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}>{title}</span>
        {infoKey && SECTION_INFO[infoKey] && (
          <InfoButton info={SECTION_INFO[infoKey]} />
        )}
      </div>

      {/* Right decorative line */}
      <div style={{
        flex: 1,
        height: "2px",
        background: "linear-gradient(90deg, rgba(139, 92, 246, 0.5), transparent)",
        maxWidth: "40px",
      }} />
    </div>
  );
}
