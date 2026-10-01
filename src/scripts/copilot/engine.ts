// The copilot's planner. Pure functions: answers in, agenda, checks and prep out.
//
// v2 plans from the outcome backwards, the way a facilitator would:
//   1. What should be different when people leave? (goal)
//   2. Where is the team on the diamond? (stage) → which phases, and which one gets the most time
//   3. Who, how many, how long, in a room or remote → the shape of the day
// Durations for the Monsoon preset still come from the Monsoon Edition agenda;
// the rules are the review checklist in src/data/guide.ts.

import { items, find, type Item } from '../../data/catalog';
import { phaseById, type PhaseId } from '../../data/phases';

export type Goal = 'learn' | 'solve' | 'align' | 'launch';
export type Stage = 'whole' | 'unclear' | 'research' | 'problem' | 'idea';
export type Audience = 'leaders' | 'product' | 'mixed' | 'designers';
export type Format = 'room' | 'remote';
export type Length = 'session' | 'half' | 'day' | 'two';
export type CorePhase = 'discover' | 'define' | 'ideate' | 'delight' | 'prototype';
type Slot = CorePhase | 'kickoff' | 'shareout' | 'closer';

export interface Answers {
  name: string;
  brief: string;
  goal: Goal;
  stage: Stage;
  audience: Audience;
  people: number;
  leads: number;
  format: Format;
  length: Length;
  start: string; // "09:30"
  date: string; // "2026-11-12", optional
  phases: CorePhase[];
  phasesTouched: boolean; // false: phases follow the recommendation
  thread: string; // running example; 'brief' = demo on the brief itself
  followUp: boolean;
  energisers: boolean;
  picks: Partial<Record<Slot, string>>; // chosen activity per slot; '' = none
  tools: Partial<Record<CorePhase, string[]>>; // methods taught per phase
  adjust: Partial<Record<CorePhase, number>>; // ± minutes the creator added
}

export interface Part { label: string; minutes: number; type: 'feel' | 'theory' | 'cases' | 'practice' | 'energiser' | 'setup' | 'share' | 'close'; item?: string; note?: string }
export interface Block {
  key: string;
  day: number;
  title: string;
  kind: 'kickoff' | 'phase' | 'break' | 'lunch' | 'recap' | 'project' | 'shareout' | 'close';
  phase?: PhaseId;
  slot?: Slot; // which pick this block's main activity comes from
  focus?: boolean;
  minutes: number;
  start?: number; // minutes from midnight
  parts: Part[];
  why?: string; // the copilot's reasoning, shown under the block
}
export interface Check { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string }
export interface PrepItem { offset: number; text: string; tag?: string }
export interface Plan {
  days: Block[][]; checks: Check[]; tables: number; capacity: number; used: number[];
  materials: string[]; templates: Item[]; cases: Item[]; outcomes: string[]; success: string; prep: PrepItem[];
}

export const CORE: CorePhase[] = ['discover', 'define', 'ideate', 'delight', 'prototype'];
const SPINE: CorePhase[] = ['discover', 'define', 'ideate', 'prototype'];
export const CAPACITY: Record<Length, number> = { session: 150, half: 240, day: 420, two: 390 };

export const goalLabel: Record<Goal, string> = {
  learn: 'Teach the way of working',
  solve: 'Make progress on a real problem',
  align: 'Align leaders on what to solve',
  launch: 'Kick off a project',
};
export const stageLabel: Record<Stage, string> = {
  whole: 'The whole diamond',
  unclear: 'Not sure what the real problem is',
  research: 'Have research, no focus yet',
  problem: 'Clear problem, need ideas',
  idea: 'Have an idea to test',
};
export const lengthLabel: Record<Length, string> = { session: '2½ hours', half: 'Half day', day: 'One day', two: 'Two days' };
const success: Record<Goal, string> = {
  learn: 'Everyone can name the four phases, and has used at least one tool from each on a real brief.',
  solve: 'Each team leaves with a tested concept, evidence from real people, and its next experiment.',
  align: 'The leadership group agrees one problem statement and the two or three bets worth funding.',
  launch: 'The team shares a view of its users and riskiest assumptions, and has a research plan for the next two weeks.',
};

export const defaults: Answers = {
  name: 'My Prism workshop',
  brief: '',
  goal: 'learn',
  stage: 'whole',
  audience: 'mixed',
  people: 24,
  leads: 4,
  format: 'room',
  length: 'day',
  start: '09:30',
  date: '',
  phases: ['discover', 'define', 'ideate', 'prototype'],
  phasesTouched: false,
  thread: 'Chai',
  followUp: true,
  energisers: true,
  picks: {},
  tools: {},
  adjust: {},
};

export const monsoonPreset: Answers = {
  ...defaults,
  name: 'Prism · Monsoon Edition',
  brief: 'We want to introduce a way for our customers to engage with the app beyond their regular transactional usages.',
  goal: 'learn',
  stage: 'whole',
  audience: 'leaders',
  people: 30,
  leads: 5,
  length: 'two',
  phases: ['discover', 'define', 'ideate', 'delight', 'prototype'],
  phasesTouched: true,
  thread: 'Chai',
  followUp: true,
};

// ── Recommendations ──────────────────────────────────────────────────────────

/** Where the team is on the diamond decides where the workshop starts and what gets the most time. */
const stageStart: Record<Stage, number> = { whole: 0, unclear: 0, research: 1, problem: 2, idea: 3 };
export const focusOf = (s: Stage): CorePhase | undefined => (s === 'whole' ? undefined : SPINE[stageStart[s]]);

export function recommendPhases(a: Pick<Answers, 'goal' | 'stage' | 'length'>): CorePhase[] {
  const fit = { session: 1, half: 2, day: a.stage === 'whole' ? 4 : 3, two: 4 }[a.length];
  let start = stageStart[a.stage];
  // "Have an idea to test" never needs Discover; at most Ideate (variations) and Prototype.
  const n = a.stage === 'idea' ? Math.min(fit, 2) : fit;
  if (start + n > SPINE.length) start = Math.max(0, SPINE.length - n);
  const out = SPINE.slice(start, start + n);
  if (a.length === 'two' && out.includes('ideate') && a.goal === 'learn') out.splice(out.indexOf('ideate') + 1, 0, 'delight');
  return out;
}

export function recommendReason(a: Pick<Answers, 'goal' | 'stage' | 'length'>): { phases: string; why: string } {
  const ph = recommendPhases(a).filter((p) => p !== 'delight').map((p) => phaseById[p].short);
  const why: Record<Stage, string> = {
    whole: 'To teach the method, people need to feel the whole arc once, even if each phase is short.',
    unclear: 'You don’t know the real problem yet, so most of the time goes to Discover. Ideas would be guesses.',
    research: 'You have the research. The work is making sense of it and choosing a focus.',
    problem: 'The problem is clear, so go wide on ideas and make one or two tangible.',
    idea: 'You already have an idea. Generate a few variations and test them; don’t reopen the problem.',
  };
  return { phases: `${ph.join(' → ')}.`, why: why[a.stage] };
}

/** Tools each goal teaches by default. Learning uses the deck’s tools; live work uses the quickest ones. */
const goalTools: Record<Goal, Partial<Record<CorePhase, string[]>>> = {
  learn: {},
  solve: { discover: ['stakeholder-map', 'user-interviews', 'intercepts'], define: ['affinity-clustering', 'insights', 'how-might-we'], ideate: ['brainstorm-rules', 'crazy-8s', 'dot-voting'], prototype: ['storyboard', 'think-aloud', 'feedback-grid'] },
  align: { discover: ['assumption-map', 'stakeholder-map', 'desk-research'], define: ['affinity-clustering', 'problem-tree', 'how-might-we'], ideate: ['crazy-8s', 'now-wow-how'], prototype: ['concept-poster', 'test-card'] },
  launch: { discover: ['assumption-map', 'stakeholder-map', 'research-plan'], define: ['jtbd', 'how-might-we'], ideate: ['crazy-8s', 'prioritisation-matrix'], prototype: ['storyboard', 'test-card'] },
};
export function defaultTools(a: Pick<Answers, 'goal' | 'format' | 'length'>, p: CorePhase): string[] {
  // Teaching the method: the deck's tools, as many as the length allows (all four only over two days).
  const deck = phaseById[p].how.filter((id) => find(id, 'method')).slice(0, a.length === 'two' ? 4 : a.length === 'session' ? 2 : 3);
  const list = goalTools[a.goal][p] ?? deck;
  return a.format === 'remote' ? list.filter((id) => find(id, 'method')?.remote !== false) : list;
}
export const toolsFor = (a: Answers, p: CorePhase) => a.tools[p] ?? defaultTools(a, p);
export const toolOptions = (p: CorePhase) => items.filter((i) => i.kind === 'method' && i.phase === p);

// ── Pools for each slot ──────────────────────────────────────────────────────

const byRole = (role: Item['role'], phase?: PhaseId) => items.filter((i) => i.kind === 'activity' && i.role === role && (!phase || i.phase === phase));
export function optionsFor(slot: Slot): Item[] {
  if (slot === 'kickoff') return byRole('icebreaker');
  if (slot === 'shareout') return byRole('shareout');
  if (slot === 'closer') return byRole('closer');
  const own = byRole('opener', slot);
  return slot === 'discover' ? [...own, find('experience-breakdown')!] : own;
}
const defaultPick: Record<Slot, string> = {
  kickoff: 'two-truths', discover: 'people-watching', define: 'what-is-this', ideate: 'circle-back', delight: 'would-you-rather', prototype: 'sinking-floating',
  shareout: 'shareout', closer: 'rose-bud-thorn',
};
/** The default pick, adjusted for the room: remote-ready, gallery walks for big rooms, a short closer for short sessions. */
export function defaultFor(a: Answers, slot: Slot): string {
  let id = defaultPick[slot];
  if (slot === 'kickoff' && (a.goal === 'align' || a.goal === 'launch')) id = 'hopes-fears';
  if (slot === 'shareout' && Math.ceil(a.people / 6) > 6) id = 'gallery-walk';
  if (slot === 'closer' && (a.length === 'session' || a.length === 'half')) id = 'one-word';
  if (slot === 'closer' && a.followUp && a.length !== 'session' && a.length !== 'half') id = 'postcard';
  if (a.format === 'remote' && find(id)?.remote === false) id = optionsFor(slot).find((i) => i.remote !== false)?.id ?? '';
  return id;
}
export const pickFor = (a: Answers, slot: Slot) => a.picks[slot] ?? defaultFor(a, slot);
const pickItem = (a: Answers, slot: Slot) => { const id = pickFor(a, slot); return id ? find(id) : undefined; };

// ── Blocks ───────────────────────────────────────────────────────────────────

// Minutes per phase block, by workshop length. The focus phase gets more on top.
const budget: Record<Length, Record<CorePhase, number>> = {
  two: { discover: 75, define: 60, ideate: 60, delight: 20, prototype: 60 },
  day: { discover: 55, define: 50, ideate: 55, delight: 15, prototype: 55 },
  half: { discover: 60, define: 55, ideate: 55, delight: 15, prototype: 55 },
  session: { discover: 70, define: 70, ideate: 70, delight: 15, prototype: 70 },
};
// How much of each tool's teaching time a goal needs. Live work gets "just enough".
const teachRate: Record<Goal, number> = { learn: 1, solve: 0.6, align: 0.7, launch: 0.7 };
/** Minutes it takes to teach a tool, for this goal. */
export const teachMinutes = (a: Pick<Answers, 'goal'>, t: Item) => Math.max(2, Math.round((t.teach ?? 5) * teachRate[a.goal]));
const practiceFor: Partial<Record<CorePhase, string>> = { discover: 'practice-discover', define: 'practice-define', ideate: 'practice-ideate', prototype: 'practice-prototype' };
const threadText = (a: Answers) => (a.thread === 'brief' ? 'your brief' : `the ${a.thread.toLowerCase()}`);

function phaseBlock(a: Answers, phase: CorePhase): Block {
  const merged = phase === 'ideate' && a.phases.includes('delight');
  const focus = focusOf(a.stage) === phase;
  let T = budget[a.length][phase] + (merged ? budget[a.length].delight : 0) + (a.adjust[phase] ?? 0);
  if (focus && a.length !== 'session') T += a.length === 'half' ? 10 : 15;
  const parts: Part[] = [];

  const opener = pickItem(a, phase);
  if (opener) parts.push({ label: opener.title, minutes: opener.minutes ?? 5, type: 'feel', item: opener.id });

  const tools = toolsFor(a, phase).map((id) => find(id, 'method')).filter(Boolean) as Item[];
  const theory = (a.goal === 'learn' ? 5 : 3) + tools.reduce((s, t) => s + teachMinutes(a, t), 0);
  parts.push({
    label: a.goal === 'learn' ? 'Why → What → How' : 'Just enough theory', minutes: theory, type: 'theory',
    note: tools.length ? `${tools.map((t) => t.title).join(', ')}. Show each on ${threadText(a)}.` : 'No tools picked yet.',
  });

  if (merged) {
    const d = pickItem(a, 'delight');
    if (d) parts.push({ label: `${d.title} (Delight)`, minutes: d.minutes ?? 5, type: 'feel', item: d.id });
    parts.push({ label: 'That sprinkle of Delight', minutes: 5, type: 'theory', note: 'Why delight matters, plus two examples.' });
  }

  const casesMin = phase === 'delight' ? 0
    : a.goal === 'learn' ? (a.audience === 'leaders' ? 10 : a.audience === 'designers' ? 0 : 5)
    : a.audience === 'leaders' ? 5 : 0;
  if (casesMin) {
    // Sourced cases from the deck first; ones still marked "check figures" after.
    const cs = items.filter((i) => i.kind === 'case' && i.phase === phase).sort((x, y) => Number(!!x.verify) - Number(!!y.verify)).slice(0, casesMin >= 10 ? 2 : 1);
    if (cs.length) parts.push({ label: cs.map((c) => c.title.split(':')[0]).join(' · '), minutes: casesMin, type: 'cases', note: 'Case studies' });
  }

  const used = parts.reduce((s, p) => s + p.minutes, 0);
  const pId = practiceFor[phase];
  if (pId) {
    const field = phase === 'discover' && tools.some((t) => t.id === 'intercepts');
    parts.push({ label: field ? 'Let’s practice: out of the room, then back' : 'Let’s practice on the brief', minutes: Math.max(10, T - used), type: 'practice', item: pId,
      note: field ? 'Pairs spend 20 minutes talking to real people nearby, then come back to map what they heard.' : undefined });
    T = Math.max(T, used + 10);
  } else T = used;

  const next = SPINE[SPINE.indexOf(phase) + 1];
  const why = focus ? `The focus of this workshop: ${stageLabel[a.stage].toLowerCase()}, so ${phaseById[phase].short} gets the most time.`
    : phase === 'delight' ? 'Delight sits on top of something that already works, so it stays short.'
    : next && a.phases.includes(next) ? `Its output feeds ${phaseById[next].short}.`
    : 'The last phase: teams leave with what this produces.';

  return { key: `p-${phase}`, day: 0, kind: 'phase', phase, slot: phase, focus, title: merged ? 'Ideate (with a sprinkle of Delight)' : phaseById[phase].name, minutes: T, parts, why };
}

function kickoff(a: Answers): Block {
  const short = a.length === 'session';
  const ice = pickItem(a, 'kickoff');
  const parts: Part[] = [{ label: 'Welcome, norms & “how we show up”', minutes: 5, type: 'setup' }];
  if (ice) parts.push({ label: ice.title, minutes: Math.min(ice.minutes ?? 10, short ? 10 : 20), type: 'feel', item: ice.id });
  parts.push({ label: 'The brief, tables & perspective cards', minutes: short ? 5 : 10, type: 'setup', note: a.brief ? `“${a.brief}”` : 'Write your brief in the first question.' });
  let why = '';
  if (a.goal === 'learn' && a.audience !== 'designers') {
    parts.push({ label: 'Rapidfire Disappointment', minutes: 10, type: 'feel', item: 'rapidfire-disappointment' });
    if (a.length === 'two') parts.push({ label: 'An Experience Breakdown', minutes: 20, type: 'feel', item: 'experience-breakdown' });
    if (!short) parts.push({ label: 'Can design make a real difference?', minutes: a.length === 'half' ? 10 : 15, type: 'cases', note: a.audience === 'leaders' ? 'Airbnb · PepsiCo · McKinsey Design Index' : 'Airbnb · McKinsey Design Index' });
    why = a.audience === 'leaders' ? 'Leaders need the business case before they’ll give a day to this.' : 'People feel why design matters before they learn how.';
  } else if (a.goal === 'learn') {
    why = 'Designers know the case for design. Get straight to practice.';
  } else {
    parts.push({ label: 'The sponsor: why this problem, why now', minutes: short ? 5 : 10, type: 'setup', note: 'Ten minutes from the person who owns the problem. It tells the room the work is real.' });
    if (a.audience !== 'designers') parts.push({ label: 'The Double Diamond in ten minutes', minutes: short ? 5 : 10, type: 'theory', note: 'Just the map. Each tool is taught when it’s needed.' });
    why = a.goal === 'align' ? 'Alignment starts by surfacing what each leader hopes and fears, and hearing it from the sponsor.' : 'Live work starts with the owner of the problem, not with theory.';
  }
  return { key: 'kickoff', day: 0, kind: 'kickoff', phase: 'kickoff', slot: 'kickoff', title: a.goal === 'learn' && a.audience !== 'designers' && !short ? 'Kickoff & primers' : 'Kickoff', minutes: parts.reduce((s, p) => s + p.minutes, 0), parts, why };
}

const ENERGISERS = ['heads-shoulders', 'rps-tournament', 'fill-the-blank', 'bad-design-hunt', 'zip-zap-zop', 'count-to-20', 'line-up'];
function energiser(a: Answers, n: number): Part {
  const pool = ENERGISERS.map((id) => find(id)!).filter((i) => a.format === 'room' || i.remote !== false);
  const it = pool[n % pool.length];
  return { label: it.title, minutes: it.minutes ?? 3, type: 'energiser', item: it.id };
}

const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
export const fmtClock = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Put breaks in about every two hours (90 minutes remote), with lunch near 1pm on full days. */
function schedule(a: Answers, blocks: Block[], day: number): Block[] {
  const out: Block[] = [];
  let clock = toMin(a.start || '09:30'), since = 0, lunch = false, e = day * 3;
  const fullDay = a.length === 'day' || a.length === 'two';
  // A 2½-hour session runs straight through, with an energiser instead of a break.
  const stretch = a.length === 'session' ? Infinity : a.format === 'remote' ? 95 : 125;
  blocks.forEach((b, i) => {
    const needsBreak = i > 0 && since + b.minutes > stretch;
    const lunchTime = fullDay && !lunch && clock >= toMin('12:00');
    if (needsBreak || lunchTime) {
      const isLunch = lunchTime || (fullDay && !lunch && clock >= toMin('11:45'));
      if (isLunch) lunch = true;
      const mins = isLunch ? 45 : a.length === 'session' ? 10 : 15;
      out.push({ key: `br-${day}-${i}`, day, kind: isLunch ? 'lunch' : 'break', title: isLunch ? 'Lunch' : out.some((x) => x.kind === 'break') ? 'Beverage break' : 'Coffee break', minutes: mins, start: clock, parts: [] });
      clock += mins;
      since = 0;
      if (a.energisers && b.kind !== 'close') {
        b = { ...b, parts: [energiser(a, e++), ...b.parts] };
        b.minutes += b.parts[0].minutes;
      }
    }
    out.push({ ...b, day, start: clock });
    clock += b.minutes;
    since += b.minutes;
  });
  return out;
}

export function buildPlan(a: Answers): Plan {
  const chosen = SPINE.filter((p) => a.phases.includes(p) || (p === 'ideate' && a.phases.includes('delight') && !a.phases.includes('ideate')));
  // Delight on its own (no Ideate) becomes its own short block.
  const phaseBlocks = chosen.map((p) => (p === 'ideate' && !a.phases.includes('ideate') ? { ...phaseBlock(a, 'delight'), title: 'Delight' } : phaseBlock(a, p)));
  const tables = Math.max(1, Math.ceil(a.people / 6));

  const share = pickItem(a, 'shareout');
  const serial = share?.id !== 'gallery-walk';
  const shareMin = serial
    ? Math.min(60, Math.max({ session: 15, half: 20, day: 30, two: 40 }[a.length], tables * 4 + 5))
    : share?.minutes ?? 25;
  const shareout: Block = {
    key: 'shareout', day: 0, kind: 'shareout', phase: 'close', slot: 'shareout', title: share?.title ?? 'Group share-outs', minutes: shareMin,
    parts: [{ label: serial ? 'Discovery → insight → HMW → ideas → direction → prototype → learn' : 'Walls up, walk, harvest', minutes: shareMin, type: 'share', item: share?.id }],
    why: serial ? `${tables} teams, about ${Math.floor((shareMin - 5) / tables)} minutes each.` : `With ${tables} teams, a gallery walk keeps everyone moving and takes the same time however many teams there are.`,
  };

  const closeParts: Part[] = [];
  if (chosen.includes('ideate') || chosen.includes('prototype')) closeParts.push({ label: 'DVF: there’s always a trade-off', minutes: a.length === 'half' || a.length === 'session' ? 5 : 10, type: 'theory', item: 'dvf' });
  if (a.followUp) closeParts.push(a.goal === 'learn'
    ? { label: 'Problem statements & next steps', minutes: a.length === 'two' ? 15 : 10, type: 'close', item: 'problem-statement' }
    : { label: 'Who, what, by when', minutes: 10, type: 'close', item: 'next-steps' });
  const closer = pickItem(a, 'closer');
  closeParts.push(closer ? { label: closer.title, minutes: closer.minutes ?? 5, type: 'close', item: closer.id } : { label: 'Reflections & questions', minutes: 5, type: 'close' });
  if (pickFor(a, 'kickoff') === 'hopes-fears') closeParts.push({ label: 'Back to the hopes & fears wall', minutes: 5, type: 'close', item: 'hopes-fears' });
  const close: Block = { key: 'close', day: 0, kind: 'close', phase: 'close', slot: 'closer', title: 'Closing', minutes: closeParts.reduce((s, p) => s + p.minutes, 0), parts: closeParts };

  let days: Block[][];
  if (a.length === 'two') {
    const cut = Math.ceil(phaseBlocks.length / 2);
    const d1: Block[] = [kickoff(a), ...phaseBlocks.slice(0, cut)];
    if (a.followUp) d1.push({ key: 'project', day: 0, kind: 'project', phase: 'close', title: 'Group projects', minutes: 45, parts: [{ label: 'Project brief, and the start of a problem statement', minutes: 45, type: 'practice', item: 'problem-statement' }] });
    d1.push({ key: 'close-1', day: 0, kind: 'close', phase: 'close', title: 'Day 1 closing', minutes: 15, parts: [{ label: 'Reflections & questions · what to expect on day 2', minutes: 15, type: 'close' }] });
    const d2: Block[] = [
      { key: 'recap', day: 1, kind: 'recap', title: 'Reflections & recap', minutes: 15, parts: [{ label: 'Day 1 recap on the diamond', minutes: 15, type: 'setup' }] },
      ...phaseBlocks.slice(cut), shareout,
    ];
    if (a.followUp) d2.push({ key: 'worktime', day: 1, kind: 'project', phase: 'close', title: 'Group working time', minutes: 30, parts: [{ label: 'Finalise group project statements', minutes: 30, type: 'practice', item: 'problem-statement' }] });
    d2.push(close);
    days = [schedule(a, d1, 0), schedule(a, d2, 1)];
  } else {
    days = [schedule(a, [kickoff(a), ...phaseBlocks, shareout, close], 0)];
  }

  const capacity = CAPACITY[a.length];
  const used = days.map((d) => d.reduce((s, b) => s + b.minutes, 0));
  const got = collect(days, a, tables);
  return { days, tables, capacity, used, checks: runChecks(a, days, tables, capacity, used), ...got, outcomes: outcomes(a, days), success: success[a.goal], prep: prep(a, got.templates, got.materials, tables) };
}

// ── Checks ───────────────────────────────────────────────────────────────────

const SOLUTIONY = /\b(chat ?bot|dashboard|mobile app|new app|an app|microsite|portal|widget|feature|ai assistant|website|campaign)\b/i;
const VERBS = /\b(build|create|launch|develop|design|make|implement|add|roll out|ship)\b/i;
const REAL_PEOPLE = ['user-interviews', 'observations', 'intercepts', 'extreme-users', 'think-aloud', 'wizard-of-oz', 'fake-door'];
const CONVERGE = ['prioritisation-matrix', 'now-wow-how', 'dot-voting'];
const PLANNED = ['research-plan', 'test-card']; // real people come next, on a plan with a date

export function runChecks(a: Answers, days: Block[][], tables: number, capacity: number, used: number[]): Check[] {
  const all = days.flat();
  const phases = all.filter((b) => b.kind === 'phase');
  const out: Check[] = [];
  const pass = (id: string, label: string, detail: string) => out.push({ id, label, status: 'pass', detail });
  const warn = (id: string, label: string, detail: string) => out.push({ id, label, status: 'warn', detail });
  const fail = (id: string, label: string, detail: string) => out.push({ id, label, status: 'fail', detail });
  const names = (bs: Block[]) => bs.map((b) => b.title).join(', ');

  const brief = a.brief.trim();
  if (!brief) fail('brief-problem', 'Brief describes a problem', 'Write the brief first. Everything hangs off it.');
  else if (SOLUTIONY.test(brief) && VERBS.test(brief)) warn('brief-problem', 'Brief describes a problem', 'This reads like a solution. Try naming who struggles, and with what.');
  else pass('brief-problem', 'Brief describes a problem', 'It names a need, not a feature.');

  const noFeel = phases.filter((b) => !b.parts.some((p) => p.type === 'feel'));
  if (noFeel.length) warn('feel-first', 'Every phase opens with an activity', `${names(noFeel)} goes straight into theory. Pick an opener in the block.`);
  else pass('feel-first', 'Every phase opens with an activity', 'People feel it before they learn it.');

  const thin = phases.filter((b) => {
    const pr = b.parts.filter((p) => p.type === 'practice').reduce((s, p) => s + p.minutes, 0);
    const th = b.parts.filter((p) => p.type === 'theory').reduce((s, p) => s + p.minutes, 0);
    return pr > 0 && pr < th;
  });
  if (thin.length) warn('practice-time', 'Practice ≥ theory', `${names(thin)}: more explaining than doing. Teach fewer tools, or give the phase more time.`);
  else pass('practice-time', 'Practice ≥ theory', 'Each phase spends more time doing than listening.');

  const long = all.flatMap((b) => b.parts.filter((p) => (p.type === 'theory' || p.type === 'cases') && p.minutes > 25).map(() => b));
  if (long.length) warn('theory-chunks', 'No talk runs over 25 minutes', `${names(long)} has a long stretch of theory. Attention drops after about 20 minutes; split it, or teach a tool inside practice.`);
  else pass('theory-chunks', 'No talk runs over 25 minutes', 'Theory comes in short pieces.');

  const short = phases.filter((b) => b.minutes < 50 && b.phase !== 'delight');
  if (short.length) warn('min-phase', 'Phases get 50+ minutes', `${names(short)} is under 50 minutes. Fewer phases, done properly, beat all four rushed.`);
  else pass('min-phase', 'Phases get 50+ minutes', 'Every phase has room to breathe.');

  const afterLunch = all.filter((b, i) => i > 0 && all[i - 1].kind === 'lunch' && b.kind !== 'close');
  const flat = afterLunch.filter((b) => { const first = b.parts.find((p) => p.type !== 'energiser'); return !a.energisers && first && (first.type === 'theory' || first.type === 'cases'); });
  if (flat.length) warn('after-lunch', 'Hands-on after lunch', `${names(flat)} starts with theory straight after lunch. That’s the flattest slot of the day.`);
  else pass('after-lunch', 'Hands-on after lunch', afterLunch.length ? 'The post-lunch slot starts with people moving.' : 'No lunch slot to worry about.');

  if (a.energisers) pass('energiser', 'Energiser after every break', 'Added to the first block after each break.');
  else warn('energiser', 'Energiser after every break', 'Rooms are flattest after lunch. Turn energisers back on.');

  const ideas = a.phases.includes('ideate'), proto = a.phases.includes('prototype');
  const chooses = CONVERGE.some((id) => toolsFor(a, 'ideate').includes(id));
  if (ideas && !proto && !chooses) warn('converge', 'Every diverge ends in a choice', 'Ideate opens up options but nothing narrows them. Add the prioritisation matrix or dot voting.');
  else if (a.phases.includes('discover') && !a.phases.includes('define') && !a.phases.includes('ideate')
    && !toolsFor(a, 'discover').some((id) => id === 'research-plan' || id === 'assumption-map')) warn('converge', 'Every diverge ends in a choice', 'Discover with no Define leaves teams with findings but no focus. End with a 15-minute cluster-and-name, at least.');
  else pass('converge', 'Every diverge ends in a choice', 'Each time the room opens up, it also narrows down.');

  const seq: string[] = [];
  if (a.phases.includes('define') && !a.phases.includes('discover') && a.stage !== 'research') seq.push('Define without Discover has nothing to synthesise. Bring research in with you');
  if (a.phases.includes('prototype') && !a.phases.includes('ideate') && a.stage !== 'idea') seq.push('Prototype without Ideate has nothing to build. Bring a chosen idea');
  if (!a.phases.length) seq.push('Pick at least one phase');
  if (seq.length) warn('sequence', 'Phases build on each other', `${seq.join('. ')}.`);
  else pass('sequence', 'Phases build on each other', 'Each phase has an input, from the room or from work done before.');

  if (a.goal !== 'learn') {
    const real = (['discover', 'prototype'] as CorePhase[]).some((p) => a.phases.includes(p) && toolsFor(a, p).some((id) => REAL_PEOPLE.includes(id)));
    const planned = a.phases.some((p) => p !== 'delight' && toolsFor(a, p).some((id) => PLANNED.includes(id)));
    if (real) pass('real-users', 'Real people are in the loop', 'Teams hear from people outside the room.');
    else if (a.stage === 'research' && !a.phases.includes('discover')) pass('real-users', 'Real people are in the loop', 'Your research brings their words in. Put the best quotes on every table.');
    else if (planned) pass('real-users', 'Real people are in the loop', 'Not in the room, but the plan teams leave with puts real people next, with a date.');
    else warn('real-users', 'Real people are in the loop', 'This is a live problem, but nobody outside the room is part of it. Add interviews, intercepts or a think-aloud test, or invite 3–4 customers.');
  }

  if (a.leads >= tables) pass('leads', 'A design lead per table', `${tables} tables, ${a.leads} leads.`);
  else fail('leads', 'A design lead per table', `${tables} tables but only ${a.leads} design lead${a.leads === 1 ? '' : 's'}. Find ${tables - a.leads} more, or seat bigger tables.`);

  const over = used.map((u) => u - capacity);
  const worst = Math.max(...over);
  if (worst > 0) out.push({ id: 'fits', label: 'Fits the time', status: worst > 20 ? 'fail' : 'warn', detail: `Runs ${worst} minutes over ${a.length === 'two' ? 'a 6.5-hour day' : `the ${lengthLabel[a.length].toLowerCase()}`}. Drop a phase, or trim a block with −5.` });
  else pass('fits', 'Fits the time', `${Math.min(...over.map((o) => -o))} minutes of slack.`);

  if (a.format === 'remote') {
    const offline = all.flatMap((b) => b.parts).map((p) => p.item && find(p.item)).filter((i): i is Item => !!i && i.remote === false);
    if (a.length === 'day' || a.length === 'two') warn('remote-fit', 'Built for a video call', 'Full days on video drain people. Split it into 3½-hour sessions on separate days.');
    else if (offline.length) warn('remote-fit', 'Built for a video call', `${[...new Set(offline.map((i) => i.title))].join(', ')} needs a room. Swap it, or use its remote variation.`);
    else pass('remote-fit', 'Built for a video call', 'Every activity works on a call, and breaks come every 90 minutes.');
  }

  if (a.followUp) pass('follow-through', 'A plan for after', a.goal === 'learn' ? 'Teams leave with a problem statement and check-ins.' : 'Teams leave with an owner and a date for the next step.');
  else warn('follow-through', 'A plan for after', 'Without a follow-up, the thinking stays in the room.');

  return out;
}

// ── What comes out of it ─────────────────────────────────────────────────────

function outcomes(a: Answers, days: Block[][]): string[] {
  const out: string[] = [];
  days.flat().forEach((b) => {
    if (b.kind !== 'phase' || !b.phase) return;
    const tools = toolsFor(a, b.phase as CorePhase).map((id) => find(id, 'method')).filter(Boolean) as Item[];
    // The phase's most converged output: the last tool that makes something, else the practice block's last line.
    const made = [...tools].reverse().find((t) => t.output)?.output?.at(-1);
    const prac = find(practiceFor[b.phase as CorePhase] ?? '')?.output?.at(-1);
    const line = a.goal === 'learn' ? prac ?? made : made ?? prac;
    if (line) out.push(`${phaseById[b.phase].short}: ${line.charAt(0).toLowerCase()}${line.slice(1)}`);
  });
  if (a.followUp) out.push(a.goal === 'learn' ? 'A problem statement for the group project' : 'A next experiment, with an owner and a date');
  return out;
}

function collect(days: Block[][], a: Answers, tables: number) {
  const partIds = days.flat().flatMap((b) => b.parts.map((p) => p.item).filter(Boolean) as string[]);
  const toolIds = a.phases.flatMap((p) => (p === 'delight' ? [] : toolsFor(a, p)));
  const used = [...new Set([...partIds, ...toolIds])].map((id) => find(id)).filter(Boolean) as Item[];
  const room = a.format === 'room';
  const mat = new Set<string>(room
    ? ['Printed brief on every table', `Perspective cards (${tables} sets)`, 'Sticky notes in two colours, Sharpies, A3 paper', 'A timer on screen']
    : ['A whiteboard (Miro, FigJam or Mural) with one frame per table', 'Breakout rooms set up in advance, one per table', 'A producer who runs rooms and the timer', 'Digital perspective cards']);
  if (room && used.some((i) => i.id === 'two-truths')) mat.add('Superpower stickers');
  if (used.some((i) => i.id === 'dot-voting' || i.id === 'gallery-walk')) mat.add(room ? 'Dot stickers, 3 per person' : 'Voting enabled on the board');
  used.forEach((i) => { if (room || i.remote !== false) i.materials?.forEach((m) => mat.add(m)); });
  const tplIds = new Set<string>(room ? ['perspective-cards'] : []);
  used.forEach((i) => { if (i.kind === 'template') tplIds.add(i.id); i.templates?.forEach((t) => tplIds.add(t)); });
  if (a.followUp) tplIds.add(a.goal === 'learn' ? 'problem-card' : 'action-plan');
  tplIds.add('run-sheet'); tplIds.add('feedback-form');
  const templates = items.filter((i) => i.kind === 'template' && tplIds.has(i.id));
  const phaseIds = new Set(days.flat().map((b) => b.phase));
  const cases = items.filter((i) => i.kind === 'case' && phaseIds.has(i.phase));
  return { materials: [...mat], templates, cases };
}

/** The countdown: what to do before and after the day. Offsets are days from the workshop. */
function prep(a: Answers, templates: Item[], materials: string[], tables: number): PrepItem[] {
  const live = a.goal !== 'learn';
  const realPeople = live && a.phases.some((p) => p !== 'delight' && toolsFor(a, p).some((id) => REAL_PEOPLE.includes(id)));
  const sheets = templates.filter((t) => !['run-sheet', 'feedback-form', 'pre-survey'].includes(t.id));
  const out: PrepItem[] = [
    { offset: -28, text: a.brief ? 'Agree the brief, and what success looks like, with the sponsor' : 'Find a sponsor and write the brief with them', tag: 'Brief' },
    { offset: -21, text: `Send the pre-survey to all ${a.people} participants`, tag: 'People' },
    { offset: -21, text: a.format === 'room' ? `Book a room for ${tables} tables of 6, with wall space for every table` : `Set up the board: ${tables} frames, one per table, with templates in place`, tag: 'Room' },
  ];
  if (realPeople) out.push({ offset: -21, text: 'Recruit real people: 5–6 customers or front-line staff to interview or to test with (or permission for intercepts)', tag: 'People' });
  if (live) out.push({ offset: -14, text: 'Collect what customers already say: complaints, reviews, call logs. Print a stack per table', tag: 'Research' });
  out.push(
    { offset: -14, text: 'Book the 30-minute core-team review. Send the plan and the deck link', tag: 'Review' },
    { offset: -10, text: `Brief the ${a.leads} design leads: the brief, the agenda, their table and what each table should leave with`, tag: 'People' },
  );
  if (a.goal === 'learn') out.push({ offset: -7, text: `Prepare one worked ${a.thread === 'brief' ? 'brief' : a.thread.toLowerCase()} example per tool`, tag: 'Deck' });
  out.push(
    { offset: -7, text: 'Run the deck end to end once, with a timer', tag: 'Deck' },
    { offset: -5, text: a.format === 'room' ? `Print ${sheets.length} templates × ${tables} tables, plus spares: ${sheets.map((t) => t.title).join(', ')}` : `Load ${sheets.length} templates into the board: ${sheets.map((t) => t.title).join(', ')}`, tag: 'Materials' },
    { offset: -2, text: `Pack and check: ${materials.slice(0, 6).join('; ')}${materials.length > 6 ? '…' : ''}`, tag: 'Materials' },
    { offset: 0, text: 'Send the feedback form before people leave the room', tag: 'Day' },
    { offset: 1, text: 'Send photos of the walls, the plan and each team’s next step to everyone', tag: 'After' },
  );
  if (a.followUp) {
    if (a.goal === 'learn') out.push({ offset: 14, text: 'Week 3 check-in: Discover & Define', tag: 'After' }, { offset: 28, text: 'Week 5 check-in: Ideate & prioritise', tag: 'After' }, { offset: 35, text: 'Week 6: showcase', tag: 'After' });
    else out.push({ offset: 14, text: 'Two-week check-in: what did the next experiment show?', tag: 'After' });
  }
  if (pickFor(a, 'closer') === 'postcard') out.push({ offset: 28, text: 'Post the postcards back', tag: 'After' });
  return out.sort((x, y) => x.offset - y.offset);
}

/** Plain-text version for copying into an email or doc. */
export function planToText(a: Answers, p: Plan): string {
  const lines: string[] = [`# ${a.name}`, '', `Brief: ${a.brief || '(not written yet)'}`,
    `Goal: ${goalLabel[a.goal]}${a.goal !== 'learn' ? ` · ${stageLabel[a.stage]}` : ''}`,
    `Room: ${a.people} people · ${p.tables} tables · ${a.leads} design leads · ${a.format === 'remote' ? 'remote' : 'in person'} · ${lengthLabel[a.length]}`,
    `Running example: ${a.thread === 'brief' ? 'the brief itself' : a.thread}`,
    `Success looks like: ${p.success}`, ''];
  p.days.forEach((d, i) => {
    if (p.days.length > 1) lines.push(`## Day ${i + 1}`);
    d.forEach((b) => {
      lines.push(`${fmtClock(b.start ?? 0)}  ${b.title} (${b.minutes} min)`);
      b.parts.forEach((pt) => lines.push(`        · ${pt.label} (${pt.minutes})`));
    });
    lines.push('');
  });
  lines.push('## Each team leaves with', ...p.outcomes.map((o) => `- ${o}`), '');
  lines.push('## Checks');
  p.checks.forEach((c) => lines.push(`${c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✗'} ${c.label}: ${c.detail}`));
  lines.push('', '## Templates', ...p.templates.map((t) => `- ${t.title}`));
  lines.push('', '## Materials', ...p.materials.map((m) => `- ${m}`));
  return lines.join('\n');
}
