import { useSyncExternalStore } from "react";

import { isSoundEnabled, setSoundEnabled, subscribeSound } from "@/lib/sound";

export function useSoundSetting() {
  const enabled = useSyncExternalStore(
    (listener) => subscribeSound(listener),
    () => isSoundEnabled(),
    () => true,
  );
  return { soundEnabled: enabled, setSoundEnabled };
}
