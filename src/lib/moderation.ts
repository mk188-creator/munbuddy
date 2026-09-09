/**
 * Lightweight abuse classifier for Global Chat and DMs.
 *
 * Deterministic and dependency-free so it can run inline on every message.
 * It never bans anyone — it either blocks a single clearly abusive message,
 * warns the sender, or flags the message for Founder/staff review.
 */

export type AbuseCategory =
  | "harassment"
  | "bullying"
  | "threats"
  | "severe_insult"
  | "hate"
  | "sexual_harassment"
  | "spam";

export type Verdict = {
  action: "allow" | "warn" | "block";
  categories: AbuseCategory[];
  severity: "none" | "low" | "medium" | "high";
  message: string | null;
  flag: boolean;
};

const RULES: { category: AbuseCategory; weight: number; pattern: RegExp }[] = [
  // Threats — highest weight.
  { category: "threats", weight: 3, pattern: /\b(i(?:'m| am| will|ll)?\s*(?:gonna|going to)?\s*(kill|murder|stab|shoot|beat)\s+(you|u|him|her|them))\b/i },
  { category: "threats", weight: 3, pattern: /\b(kys|kill yourself|end yourself|hang yourself)\b/i },
  { category: "threats", weight: 3, pattern: /\b(i know where you live|watch your back|you(?:'re| are) dead)\b/i },
  // Hate-based abuse.
  { category: "hate", weight: 3, pattern: /\b(n[i1]gg(?:a|er)s?|f[a4]gg?ots?|tr[a4]nn(?:y|ies)|k[i1]kes?|ch[i1]nks?|p[a4]k[i1]s?\b|retards?)\b/i },
  { category: "hate", weight: 3, pattern: /\b(all|every)\s+(muslims|jews|hindus|christians|blacks|whites|asians|arabs|gays)\s+(are|should)\b/i },
  // Sexual harassment.
  { category: "sexual_harassment", weight: 3, pattern: /\b(send nudes|nudes\?|show me your (?:tits|boobs|body)|rape you|suck my)\b/i },
  { category: "sexual_harassment", weight: 2, pattern: /\b(horny|sexy)\b.{0,20}\b(you|u)\b/i },
  // Severe insults.
  { category: "severe_insult", weight: 2, pattern: /\b(fuck (?:you|u|off)|f\*ck you|stfu|shut the fuck up|bitch|bastard|asshole|dickhead|cunt|whore|slut|motherfucker)\b/i },
  // Bullying / harassment patterns.
  { category: "bullying", weight: 2, pattern: /\b(you(?:'re| are| r)\s+(?:so\s+)?(worthless|useless|pathetic|trash|garbage|stupid|dumb|ugly|a loser|nobody))\b/i },
  { category: "bullying", weight: 2, pattern: /\b(nobody likes you|everyone hates you|go cry|leave this (?:app|chat) (?:loser|idiot))\b/i },
  { category: "harassment", weight: 2, pattern: /\b(stop (?:talking|posting)|shut up)\b.{0,30}\b(idiot|loser|moron|freak)\b/i },
  // Spam.
  { category: "spam", weight: 2, pattern: /(https?:\/\/\S+){3,}/i },
  { category: "spam", weight: 2, pattern: /\b(free\s+(robux|vbucks|crypto|nitro|followers)|dm me for money|join my discord\.gg)\b/i },
  { category: "spam", weight: 1, pattern: /(.)\1{19,}/ },
];

const MASK_HINT: Record<AbuseCategory, string> = {
  threats: "Threatening another delegate is never allowed here.",
  hate: "Hateful or discriminatory language isn't allowed on MUN Hub.",
  sexual_harassment: "Sexual comments directed at other people aren't allowed.",
  severe_insult: "That's a personal insult — please make the point without it.",
  bullying: "That reads as bullying. Debate the position, not the person.",
  harassment: "That reads as harassment. Please keep it respectful.",
  spam: "That looks like spam or flooding.",
};

/** Sender-facing rephrase suggestion — respectful, never accusatory. */
function rephrase(categories: AbuseCategory[]) {
  const first = categories[0];
  const hint = first ? MASK_HINT[first] : "Please keep it respectful.";
  return `${hint} Try rephrasing it as a point about the argument, not the person.`;
}

export function classifyMessage(raw: string): Verdict {
  const text = raw.normalize("NFKC");
  const hits = new Map<AbuseCategory, number>();
  let score = 0;

  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      hits.set(rule.category, Math.max(hits.get(rule.category) ?? 0, rule.weight));
      score += rule.weight;
    }
  }

  // Shouting is a soft signal only.
  const letters = text.replace(/[^a-z]/gi, "");
  if (letters.length > 30 && letters === letters.toUpperCase()) score += 1;

  const categories = [...hits.keys()];
  if (!categories.length && score < 2) {
    return { action: "allow", categories: [], severity: "none", message: null, flag: false };
  }

  const severe = categories.some((c) => ["threats", "hate", "sexual_harassment"].includes(c));

  if (severe || score >= 4) {
    return {
      action: "block",
      categories,
      severity: "high",
      message: rephrase(categories),
      flag: true,
    };
  }

  if (score >= 2) {
    return {
      action: "warn",
      categories,
      severity: "medium",
      message: rephrase(categories),
      flag: true,
    };
  }

  return { action: "allow", categories, severity: "low", message: null, flag: true };
}

/** Simple flood guard: too many messages in a short window. */
export function isFlooding(timestamps: number[], now = Date.now()) {
  const recent = timestamps.filter((t) => now - t < 10_000);
  return recent.length >= 6;
}
