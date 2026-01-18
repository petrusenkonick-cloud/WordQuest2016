"use client";

interface SectionDividerProps {
  className?: string;
}

export function SectionDivider({ className = "" }: SectionDividerProps) {
  return (
    <div
      className={className}
      style={{
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)",
        margin: "15px 0",
      }}
    />
  );
}
