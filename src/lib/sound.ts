/**
 * Tiny WebAudio UI sound engine — no assets, no network, a few hundred bytes of
 * synthesis. Every sound is a short enveloped oscillator so the app stays light.
 */

export type SoundName =
  | "click"
  | "navigate"
  | "success"
  | "error"
  | "notify"
  | "ai";

const STORAGE_KEY = "mun-hub:sound-enabled";

let context: AudioContext | null = null;
let enabled = true;
let hydrated = false;

type Listener = (value: boolean) => void;
const listeners = new Set<Listener>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  enabled = stored === null ? true : stored === "true";
}

export function isSoundEnabled() {
  hydrate();
  return enabled;
}

export function setSoundEnabled(value: boolean) {
  hydrate();
  enabled = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  }
  listeners.forEach((listener) => listener(value));
}

export function subscribeSound(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

type Tone = {
  freq: number;
  to?: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  delay?: number;
};

const RECIPES: Record<SoundName, Tone[]> = {
  click: [{ freq: 620, to: 480, duration: 0.05, gain: 0.05, type: "triangle" }],
  navigate: [
    { freq: 420, to: 660, duration: 0.09, gain: 0.045, type: "sine" },
  ],
  success: [
    { freq: 660, duration: 0.09, gain: 0.05, type: "sine" },
    { freq: 880, duration: 0.13, gain: 0.05, type: "sine", delay: 0.07 },
    { freq: 1180, duration: 0.16, gain: 0.035, type: "sine", delay: 0.15 },
  ],
  error: [
    { freq: 280, to: 180, duration: 0.16, gain: 0.055, type: "sawtooth" },
    { freq: 190, duration: 0.14, gain: 0.04, type: "triangle", delay: 0.1 },
  ],
  notify: [
    { freq: 880, duration: 0.08, gain: 0.045, type: "sine" },
    { freq: 1320, duration: 0.12, gain: 0.035, type: "sine", delay: 0.08 },
  ],
  ai: [
    { freq: 520, to: 780, duration: 0.22, gain: 0.03, type: "sine" },
  ],
};

export function playSound(name: SoundName) {
  hydrate();
  if (!enabled) return;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    // Respect users who opt out of non-essential feedback.
    if (name === "click" || name === "navigate") return;
  }
  const ctx = getContext();
  if (!ctx) return;

  for (const tone of RECIPES[name]) {
    const start = ctx.currentTime + (tone.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, start + tone.duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + tone.duration + 0.02);
  }
}
