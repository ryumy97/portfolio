"use client";

import { useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import {
  initParticleDebugFromUrl,
  useParticleDebug,
} from "@/stores/particle-debug";

const ParticleDebugHud = () => {
  const enabled = useParticleDebug((state) => state.enabled);
  const setEnabled = useParticleDebug((state) => state.setEnabled);
  const showHud = process.env.NODE_ENV === "development" || enabled;

  useEffect(() => {
    initParticleDebugFromUrl();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyP" || !event.altKey || event.repeat) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable=true]")
      ) {
        return;
      }
      event.preventDefault();
      useParticleDebug
        .getState()
        .setEnabled(!useParticleDebug.getState().enabled);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!showHud) return null;

  return (
    <div className="pointer-events-auto fixed bottom-2 left-2 z-70 flex items-center gap-2 rounded-md bg-background/90 px-2 py-1 ring-1 ring-foreground/10">
      <label htmlFor="particle-debug" className="text-xs text-muted-foreground">
        Particle debug
      </label>
      <Switch
        id="particle-debug"
        size="sm"
        checked={enabled}
        onCheckedChange={setEnabled}
      />
    </div>
  );
};

export default ParticleDebugHud;
