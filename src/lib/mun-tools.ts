/**
 * Registry of every MUN AI tool. Client-safe: pure data + pure prompt builders.
 * The chat route imports `buildToolPrompt` to turn form values into a prompt.
 */

export type ToolField = {
  name: string;
  label: string;
  placeholder?: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  help?: string;
};

export type MunTool = {
  id: string;
  name: string;
  tagline: string;
  category: "Research" | "Writing" | "Speaking" | "Strategy" | "Crisis";
  icon: string;
  fields: ToolField[];
  system: string;
  buildPrompt: (v: Record<string, string>) => string;
};

const BASE_SYSTEM =
  "You are MUN Hub, an expert Model United Nations coach and researcher. You write with " +
  "diplomatic precision, cite real UN bodies, treaties and resolution numbers when relevant, " +
  "and never invent fake citations. Format answers in clean markdown with headings and lists. " +
  "You help students learn — always explain your reasoning briefly so the student improves.";

const country: ToolField = {
  name: "country",
  label: "Country / Delegation",
  placeholder: "e.g. Federative Republic of Brazil",
  type: "text",
  required: true,
};
const committee: ToolField = {
  name: "committee",
  label: "Committee",
  placeholder: "e.g. UNSC, UNHRC, DISEC, ECOSOC",
  type: "text",
  required: true,
};
const topic: ToolField = {
  name: "topic",
  label: "Agenda / Topic",
  placeholder: "e.g. Regulation of autonomous weapons systems",
  type: "textarea",
  required: true,
};

export const MUN_TOOLS: MunTool[] = [
  {
    id: "country-stance",
    name: "Country Stance Finder",
    tagline: "Pin down your delegation's official position, allies and red lines.",
    category: "Research",
    icon: "Compass",
    fields: [country, committee, topic],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Determine the official stance of ${v['country']} in ${v['committee']} on: ${v['topic']}.\n\nReturn: 1) Official Position (3-5 sentences), 2) Key National Interests, 3) Historic Voting Record & relevant treaties signed/not signed, 4) Bloc & Allies, 5) Opposing Delegations, 6) Red Lines the delegate must never cross, 7) Three quotable talking points.`,
  },
  {
    id: "position-paper",
    name: "Position Paper",
    tagline: "A full conference-ready position paper in your delegation's voice.",
    category: "Writing",
    icon: "FileText",
    fields: [
      country,
      committee,
      topic,
      {
        name: "length",
        label: "Length",
        type: "select",
        options: ["Half page", "One page", "Two pages"],
      },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Write a ${v['length'] ?? "One page"} Model UN position paper for ${v['country']} in ${v['committee']} on "${v['topic']}".\n\nStructure: Header block (Committee, Topic, Country, Delegate), I. Background of the Topic, II. Past International Action, III. Country Policy, IV. Proposed Solutions (3 concrete, fundable, actionable). Formal third-person diplomatic register.`,
  },
  {
    id: "resolution",
    name: "Resolution Drafter",
    tagline: "Full draft resolution with preambulatory and operative clauses.",
    category: "Writing",
    icon: "ScrollText",
    fields: [
      committee,
      topic,
      { name: "sponsors", label: "Sponsors", placeholder: "e.g. Brazil, France, Kenya", type: "text" },
      { name: "focus", label: "Solution focus", placeholder: "e.g. funding mechanism + monitoring body", type: "textarea" },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Draft a complete Model UN resolution for ${v['committee']} on "${v['topic']}".\nSponsors: ${v['sponsors'] || "to be determined"}. Solution focus: ${v['focus'] || "comprehensive"}.\n\nUse correct format: header, 7-9 italicised preambulatory clauses ending in commas, 8-12 numbered operative clauses ending in semicolons (last one a period), with sub-clauses a) b) c). Only use recognised preambulatory/operative phrases.`,
  },
  {
    id: "working-paper",
    name: "Working Paper",
    tagline: "Structured working paper for bloc negotiation.",
    category: "Writing",
    icon: "NotebookPen",
    fields: [committee, topic, { name: "bloc", label: "Bloc / Signatories", placeholder: "e.g. African Group", type: "text" }],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Produce a Model UN working paper for ${v['committee']} on "${v['topic']}" authored by ${v['bloc'] || "our bloc"}. Include: title, signatories, problem statement, three pillars of the proposal each with implementation steps, funding sources, monitoring/reporting mechanism, and expected outcomes.`,
  },
  {
    id: "clause",
    name: "Clause Generator",
    tagline: "Perfectly formatted operative or preambulatory clauses on demand.",
    category: "Writing",
    icon: "ListTree",
    fields: [
      topic,
      { name: "kind", label: "Clause type", type: "select", options: ["Operative", "Preambulatory", "Both"] },
      { name: "count", label: "How many", type: "select", options: ["3", "5", "8", "12"] },
      { name: "idea", label: "Idea to express", type: "textarea", placeholder: "e.g. create a UN-backed adaptation fund" },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Generate ${v['count'] ?? "5"} ${(v['kind'] ?? "Operative").toLowerCase()} clauses about "${v['topic']}" expressing: ${v['idea'] || "the delegation's core proposal"}. Use authentic MUN clause openers, correct punctuation, and add sub-clauses where useful. After the clauses, add a short note explaining why each opener was chosen.`,
  },
  {
    id: "amendment",
    name: "Amendment Generator",
    tagline: "Friendly and unfriendly amendments with justification.",
    category: "Writing",
    icon: "PenLine",
    fields: [
      { name: "clause", label: "Existing clause text", type: "textarea", required: true },
      { name: "goal", label: "What you want to change", type: "textarea", required: true },
      { name: "kind", label: "Amendment type", type: "select", options: ["Friendly", "Unfriendly", "Both"] },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Here is a resolution clause:\n"""${v['clause']}"""\n\nWrite ${(v['kind'] ?? "Friendly").toLowerCase()} amendment(s) achieving: ${v['goal']}. For each, give the formal amendment text (Add/Strike/Replace wording), the resulting clause in full, a 2-sentence justification speech, and the likely objection from opposing delegates.`,
  },
  {
    id: "poi",
    name: "POI Generator",
    tagline: "Sharp points of information that put opponents on the back foot.",
    category: "Speaking",
    icon: "MessageCircleQuestion",
    fields: [
      country,
      { name: "opponent", label: "Speaker / Delegation you're questioning", type: "text", required: true },
      { name: "claim", label: "What they argued", type: "textarea", required: true },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `As the delegate of ${v['country']}, generate 6 points of information directed at ${v['opponent']} who argued: "${v['claim']}". Range from factual-trap to policy-contradiction to funding-feasibility. For each POI give the exact wording (one sentence, formal), the weakness it exploits, and the likely rebuttal to prepare for.`,
  },
  {
    id: "motions",
    name: "Motion Suggestions",
    tagline: "The right motion at the right moment, with exact phrasing.",
    category: "Strategy",
    icon: "Gavel",
    fields: [
      committee,
      { name: "situation", label: "Current committee situation", type: "textarea", required: true, placeholder: "e.g. formal debate stalling, three blocs forming" },
      { name: "goal", label: "Your objective", type: "text", placeholder: "e.g. merge with the EU bloc" },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Committee: ${v['committee']}. Situation: ${v['situation']}. My objective: ${v['goal'] || "advance my bloc's resolution"}.\n\nRecommend the 4 best motions right now, ranked. For each: exact wording to say when recognised, the parliamentary purpose, required vote (simple/two-thirds), the strategic advantage, and the risk if it fails.`,
  },
  {
    id: "speech",
    name: "Speech Generator",
    tagline: "Timed speeches at 30, 60 or 90 seconds — word counted.",
    category: "Speaking",
    icon: "Mic",
    fields: [
      country,
      committee,
      topic,
      { name: "duration", label: "Duration", type: "select", options: ["30 seconds", "60 seconds", "90 seconds"] },
      { name: "tone", label: "Tone", type: "select", options: ["Assertive", "Collaborative", "Urgent", "Statesmanlike"] },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) => {
      const words: Record<string, string> = {
        "30 seconds": "75-85",
        "60 seconds": "150-165",
        "90 seconds": "225-245",
      };
      const d = v['duration'] ?? "60 seconds";
      return `Write a ${d} MUN speech for ${v['country']} in ${v['committee']} on "${v['topic']}". Tone: ${v['tone'] ?? "Assertive"}. Target exactly ${words[d]} words so it fits the time at speaking pace. Open with a hook, state policy, give one statistic, propose one action, close with a call to the committee. After the speech, print the word count and a delivery note (pauses, emphasis).`;
    },
  },
  {
    id: "opening-closing",
    name: "Opening & Closing Speeches",
    tagline: "Bookend the committee session with memorable remarks.",
    category: "Speaking",
    icon: "Megaphone",
    fields: [
      country,
      committee,
      topic,
      { name: "which", label: "Which speech", type: "select", options: ["Opening", "Closing", "Both"] },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Write the ${(v['which'] ?? "Both").toLowerCase()} speech(es) for ${v['country']} in ${v['committee']} on "${v['topic']}". Opening: formal salutation to the dais, framing of the crisis, national position, invitation to collaborate (~60s). Closing: acknowledge the committee's work, summarise our contribution, name the resolution we sponsor, end with a memorable line (~45s). Include word counts.`,
  },
  {
    id: "strategy",
    name: "Debate & Caucus Strategy",
    tagline: "A turn-by-turn game plan for formal debate and caucusing.",
    category: "Strategy",
    icon: "Swords",
    fields: [
      country,
      committee,
      topic,
      { name: "size", label: "Committee size", type: "text", placeholder: "e.g. 40 delegates" },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Build a full committee strategy for ${v['country']} in ${v['committee']} (${v['size'] || "medium sized"}) on "${v['topic']}".\n\nCover: 1) Session-one objectives, 2) Bloc-building targets with the exact pitch for each, 3) Unmoderated caucus playbook (first 3 minutes), 4) When to speak vs. when to negotiate, 5) How to become a sponsor not a signatory, 6) Award-winning behaviours the dais rewards, 7) Contingency if our bloc fractures.`,
  },
  {
    id: "crisis",
    name: "Crisis Committee Assistant",
    tagline: "Rapid crisis directives, personal actions and escalation reads.",
    category: "Crisis",
    icon: "Siren",
    fields: [
      { name: "role", label: "Your character / portfolio", type: "text", required: true },
      { name: "crisis", label: "Crisis update", type: "textarea", required: true },
      { name: "resources", label: "Resources at your disposal", type: "textarea" },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `I am ${v['role']} in a crisis committee. Crisis update: ${v['crisis']}. My resources: ${v['resources'] || "standard portfolio powers"}.\n\nGive me: 1) Immediate threat assessment, 2) Two private directives (covert, written in directive format), 3) One public directive for the committee, 4) A press statement, 5) Predicted crisis escalation in the next update and how to pre-position for it.`,
  },
  {
    id: "country-profile",
    name: "Country Profile",
    tagline: "Everything about your delegation on one briefing sheet.",
    category: "Research",
    icon: "Globe2",
    fields: [country, { name: "lens", label: "Focus lens", type: "text", placeholder: "e.g. climate policy, security posture" }],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Create a delegate briefing profile for ${v['country']}${v['lens'] ? ` with a focus on ${v['lens']}` : ""}. Include: government type & current leadership, economy snapshot, population & demographics, UN memberships and blocs, key treaties ratified, foreign policy doctrine, historic UN voting patterns, three current domestic pressures, and how a delegate should carry themselves representing this country.`,
  },
  {
    id: "background-guide",
    name: "Committee Background Guide",
    tagline: "Chair-quality background guide for any committee and topic.",
    category: "Research",
    icon: "BookOpen",
    fields: [committee, topic],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Write a background guide for ${v['committee']} on "${v['topic']}". Sections: Letter from the Dais, Committee Mandate & Powers, Topic Introduction, Historical Background, Current Situation, Past UN Action (with real resolution numbers), Bloc Positions, Questions a Resolution Must Answer, and Further Research suggestions.`,
  },
  {
    id: "research",
    name: "Research Assistant",
    tagline: "Structured research answers with sources to verify.",
    category: "Research",
    icon: "Search",
    fields: [
      { name: "question", label: "Research question", type: "textarea", required: true },
      { name: "depth", label: "Depth", type: "select", options: ["Quick brief", "Standard", "Deep dive"] },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Research question: ${v['question']}. Depth: ${v['depth'] ?? "Standard"}.\n\nAnswer with: key findings, relevant data points with dates, the main UN instruments involved, competing viewpoints, and a "verify these" list of named primary sources (UN documents, agency reports) the delegate should check. Flag clearly anything you are uncertain about.`,
  },
  {
    id: "fact-check",
    name: "Fact Checker",
    tagline: "Stress-test a claim before you say it in committee.",
    category: "Research",
    icon: "ShieldCheck",
    fields: [{ name: "claim", label: "Claim to check", type: "textarea", required: true }],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Fact-check this claim for use in a MUN debate: "${v['claim']}".\n\nGive: verdict (Accurate / Partly accurate / Misleading / Unverifiable), what is true, what is wrong or missing context, a safer rephrasing a delegate could actually say, and which primary sources to confirm it with. Be explicit about the limits of your knowledge and never fabricate a citation.`,
  },
  {
    id: "un-resolution",
    name: "UN Resolution Assistant",
    tagline: "Understand, summarise and apply real UN resolutions.",
    category: "Research",
    icon: "Landmark",
    fields: [
      { name: "resolution", label: "Resolution or subject", type: "text", required: true, placeholder: "e.g. UNSC Resolution 1325" },
      { name: "need", label: "What do you need?", type: "select", options: ["Plain-English summary", "How to cite it in debate", "Its operative obligations", "Related resolutions"] },
    ],
    system: BASE_SYSTEM,
    buildPrompt: (v) =>
      `Regarding ${v['resolution']}: ${v['need'] ?? "Plain-English summary"}.\n\nExplain the adopting body and date, the context that produced it, its key operative provisions, its legal weight (binding vs. recommendatory), how delegates commonly invoke it, and closely related resolutions. If you are not certain of a detail, say so rather than guessing.`,
  },
];

export const TOOL_CATEGORIES = ["Research", "Writing", "Speaking", "Strategy", "Crisis"] as const;

export function getTool(id: string): MunTool | undefined {
  return MUN_TOOLS.find((tool) => tool.id === id);
}

export function buildToolPrompt(id: string, values: Record<string, string>) {
  const tool = getTool(id);
  if (!tool) return null;
  return { system: tool.system, prompt: tool.buildPrompt(values) };
}

export const CHAT_SYSTEM = BASE_SYSTEM;
