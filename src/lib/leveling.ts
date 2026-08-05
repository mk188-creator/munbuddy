/** Pure XP / level math shared by client and server. */

export const MAX_LEVEL = 120;

/** XP required to advance from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.min(level, MAX_LEVEL));
  return Math.round(100 + (l - 1) * 55 + Math.pow(l - 1, 1.45) * 6);
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l += 1) total += xpForLevel(l);
  return total;
}

export type LevelProgress = {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  percent: number;
};

export function applyXp(level: number, xp: number, gained: number): LevelProgress & { levelsGained: number } {
  let nextLevel = level;
  let nextXp = xp + Math.max(0, gained);
  let levelsGained = 0;

  while (nextLevel < MAX_LEVEL && nextXp >= xpForLevel(nextLevel)) {
    nextXp -= xpForLevel(nextLevel);
    nextLevel += 1;
    levelsGained += 1;
  }
  if (nextLevel >= MAX_LEVEL) nextXp = Math.min(nextXp, xpForLevel(MAX_LEVEL));

  const need = xpForLevel(nextLevel);
  return {
    level: nextLevel,
    xpIntoLevel: nextXp,
    xpForNext: need,
    percent: Math.min(100, Math.round((nextXp / need) * 100)),
    levelsGained,
  };
}

export function levelProgress(level: number, xp: number): LevelProgress {
  const need = xpForLevel(level);
  return {
    level,
    xpIntoLevel: xp,
    xpForNext: need,
    percent: Math.min(100, Math.round((xp / need) * 100)),
  };
}

const TITLES: Array<{ min: number; title: string }> = [
  { min: 1, title: "Observer" },
  { min: 3, title: "Page" },
  { min: 6, title: "Junior Delegate" },
  { min: 10, title: "Delegate" },
  { min: 15, title: "Committee Regular" },
  { min: 20, title: "Caucus Leader" },
  { min: 25, title: "Diplomat" },
  { min: 32, title: "Bloc Architect" },
  { min: 40, title: "Resolution Author" },
  { min: 50, title: "Ambassador" },
  { min: 60, title: "Special Envoy" },
  { min: 70, title: "Under-Secretary" },
  { min: 80, title: "Deputy Secretary-General" },
  { min: 90, title: "Secretary-General" },
  { min: 100, title: "MUN Legend" },
  { min: 110, title: "Hall of Fame" },
];

export function titleForLevel(level: number): string {
  let title = TITLES[0]!.title;
  for (const entry of TITLES) if (level >= entry.min) title = entry.title;
  return title;
}

export function unlockedTitles(level: number): string[] {
  return TITLES.filter((t) => level >= t.min).map((t) => t.title);
}

export const RARITIES = ["common", "rare", "epic", "legendary", "mythic"] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_META: Record<Rarity, { label: string; color: string; ring: string; glow: string }> = {
  common: { label: "Common", color: "text-slate-300", ring: "ring-slate-400/40", glow: "oklch(0.75 0.02 250)" },
  rare: { label: "Rare", color: "text-sky-300", ring: "ring-sky-400/50", glow: "oklch(0.75 0.14 235)" },
  epic: { label: "Epic", color: "text-violet-300", ring: "ring-violet-400/50", glow: "oklch(0.72 0.19 300)" },
  legendary: { label: "Legendary", color: "text-amber-300", ring: "ring-amber-400/60", glow: "oklch(0.82 0.16 80)" },
  mythic: { label: "Mythic", color: "text-fuchsia-300", ring: "ring-fuchsia-400/70", glow: "oklch(0.75 0.24 340)" },
};

/** Drop table per crate rarity: probability weights over reward rarities. */
export const CRATE_TABLE: Record<Rarity, { odds: Record<Rarity, number>; coins: [number, number]; xp: [number, number] }> = {
  common: { odds: { common: 78, rare: 18, epic: 3.5, legendary: 0.45, mythic: 0.05 }, coins: [40, 140], xp: [30, 90] },
  rare: { odds: { common: 45, rare: 40, epic: 12, legendary: 2.7, mythic: 0.3 }, coins: [120, 320], xp: [80, 200] },
  epic: { odds: { common: 15, rare: 42, epic: 32, legendary: 9.5, mythic: 1.5 }, coins: [300, 700], xp: [200, 450] },
  legendary: { odds: { common: 0, rare: 25, epic: 45, legendary: 26, mythic: 4 }, coins: [700, 1600], xp: [450, 900] },
  mythic: { odds: { common: 0, rare: 0, epic: 40, legendary: 47, mythic: 13 }, coins: [1500, 3500], xp: [900, 2000] },
};

export const CRATE_PRICE: Record<Rarity, number> = {
  common: 250,
  rare: 700,
  epic: 1800,
  legendary: 4200,
  mythic: 9000,
};

export const COSMETIC_KINDS = [
  "frame",
  "badge",
  "title",
  "theme",
  "background",
  "sticker",
  "chat_effect",
] as const;
export type CosmeticKind = (typeof COSMETIC_KINDS)[number];

export const KIND_LABEL: Record<CosmeticKind, string> = {
  frame: "Profile Frame",
  badge: "Badge",
  title: "Title",
  theme: "Theme",
  background: "Background",
  sticker: "Sticker",
  chat_effect: "Chat Effect",
};
