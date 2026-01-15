"use client";

import { AmbientParticles, TorchGlow } from "./Particles";

export function GlobalEffects() {
  return (
    <>
      {/* Ambient floating particles throughout the game */}
      <AmbientParticles />

      {/* Subtle torch glow atmosphere */}
      <TorchGlow intensity="low" />
    </>
  );
}
