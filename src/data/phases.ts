// The Double Diamond, as Prism teaches it. Copy is from the Monsoon Edition deck.
// `diamond` places each phase on the spine: which diamond (1 or 2) and whether
// that half opens up (diverge) or narrows down (converge).

export type PhaseId = 'kickoff' | 'discover' | 'define' | 'ideate' | 'delight' | 'prototype' | 'close';

export interface Phase {
  id: PhaseId;
  name: string;
  short: string;
  tagline: string;
  icon: string;
  diamond?: { n: 1 | 2; half: 'diverge' | 'converge' };
  why: string[];
  what: string;
  how: string[];
  cheatSheet: string[];
  quote?: { text: string; by: string };
  blank?: string;
}

export const phases: Phase[] = [
  {
    id: 'kickoff',
    name: 'Kickoff & setup',
    short: 'Kickoff',
    tagline: 'Warm the room, set the norms, make the case for design.',
    icon: 'hourglass',
    why: ['People learn better once they know each other.', 'Leaders need to see why design matters to the business before they invest a day in it.'],
    what: 'Introductions, house rules and two primers: what design is, and whether it makes a difference.',
    how: ['two-truths', 'rapidfire-disappointment', 'design-means', 'experience-breakdown'],
    cheatSheet: ['Be present, not perfect', 'Keep the user in the room', 'Spaceship!'],
  },
  {
    id: 'discover',
    name: 'Discover',
    short: 'Discover',
    tagline: 'Slow down. Open up. Understand before solving.',
    icon: 'look',
    diamond: { n: 1, half: 'diverge' },
    why: ['Assumptions & unknowns', 'Behaviours & motivations', 'Stakeholders & context'],
    what: 'Two lenses: the context (what’s happening around the problem) and the users (who is experiencing it, and what they’re doing).',
    how: ['stakeholder-map', 'why-ladder', 'user-interviews', 'observations'],
    cheatSheet: ['Speak to a few people who are directly affected', 'Look for recurring frustrations, workarounds and unmet needs', 'Observe how work is actually done, not how it’s described'],
    quote: { text: 'Want users to fall in love with your designs? Fall in love with your users.', by: 'Dana Chisnell' },
    blank: 'Customers don’t always know what they want, but they always know when ______.',
  },
  {
    id: 'define',
    name: 'Define',
    short: 'Define',
    tagline: 'Move from raw data to meaning, and name what explains why.',
    icon: 'question',
    diamond: { n: 1, half: 'converge' },
    why: ['Understand and align on the wrong problem', 'Go from research to focus', 'Open up the solution space'],
    what: 'In our context, a metric or complaint isn’t a design problem yet. Define takes us from business shorthand to human understanding.',
    how: ['insights', 'opportunity-areas', 'how-might-we'],
    cheatSheet: ['Gather your observations and find common themes', 'Separate symptoms from root causes', 'Pick one problem worth solving before you explore ideas'],
    quote: { text: 'A problem well stated is half solved.', by: 'Charles Kettering' },
    blank: 'One of the most ______ things a business can do is solve the wrong problem super efficiently.',
  },
  {
    id: 'ideate',
    name: 'Ideate',
    short: 'Ideate',
    tagline: 'Ideation isn’t solutioning. It’s finding ways to solve something that can surprise you.',
    icon: 'beyond',
    diamond: { n: 2, half: 'diverge' },
    why: ['Step beyond the obvious', 'Separate idea generation from idea evaluation', 'Collect perspectives and strengths', 'Uncover unexpected areas'],
    what: 'It isn’t about the “right” idea. It’s about generating the widest range of possibilities, then choosing.',
    how: ['crazy-8s', 'analogous-inspiration', 'prioritisation-matrix'],
    cheatSheet: ['Generate multiple ideas before evaluating them', 'Think human first', 'Spend time on some really crazy, next-to-impossible ideas'],
    blank: 'The goal isn’t the perfect idea. It’s the ______ one.',
  },
  {
    id: 'delight',
    name: 'Delight',
    short: 'Delight',
    tagline: 'Not decoration. Emotional memory.',
    icon: 'donuts',
    diamond: { n: 2, half: 'diverge' },
    why: ['Creates an emotional connection: people remember how something made them feel', 'Drives repeat behaviour: delight builds habits, not just transactions', 'Generates word of mouth: people share what surprised or moved them'],
    what: 'Delight is the difference between a product you use and a product you love.',
    how: ['would-you-rather', 'delight-examples'],
    cheatSheet: ['Look for the moment that could be remembered', 'Delight sits on top of something that already works'],
  },
  {
    id: 'prototype',
    name: 'Prototype & test',
    short: 'Prototype',
    tagline: 'Build something frugal, get feedback, iterate.',
    icon: 'build',
    diamond: { n: 2, half: 'converge' },
    why: ['Validate ideas before investing heavily', 'Reduce risk and learn faster'],
    what: 'Prototyping is building something frugally to see what works and what doesn’t, then moving to the next iteration. Testing is putting it in front of end users for feedback.',
    how: ['role-play', 'vibecode'],
    cheatSheet: ['Make the idea tangible as quickly as possible', 'Prototype the experience, not just the screen', 'Test with a batch of unbiased users'],
  },
  {
    id: 'close',
    name: 'Share & close',
    short: 'Close',
    tagline: 'Show the work, face the trade-offs, keep the momentum going.',
    icon: 'flowers',
    why: ['Teams learn as much from each other’s work as from their own', 'Every idea is a trade-off between desirability, feasibility and viability'],
    what: 'Group share-outs, the DVF conversation, and a problem statement each team takes into the next six weeks.',
    how: ['shareout', 'dvf', 'problem-statement'],
    cheatSheet: ['Users want it, but we can’t build it', 'That can be built, but nobody wants it', 'Users want it and we can build it, but it doesn’t make business sense'],
  },
];

export const phaseById = Object.fromEntries(phases.map((p) => [p.id, p])) as Record<PhaseId, Phase>;

// The order Prism uses to teach every phase. This pattern is what a creator copies.
export const modulePattern = [
  { key: 'divider', label: 'Divider', note: 'A full-bleed section slide. Name the phase.' },
  { key: 'where', label: 'Where are we?', note: 'Show the Double Diamond and light up the phase.' },
  { key: 'feel', label: 'Feel it first', note: 'A short activity that lets the room experience the idea before it has a name.' },
  { key: 'why', label: 'Why', note: 'Why does this phase matter? Three reasons, no more.' },
  { key: 'what', label: 'What', note: 'One sentence that defines it.' },
  { key: 'how', label: 'How', note: 'Two to four tools, each shown through the running example.' },
  { key: 'cases', label: 'Cases', note: 'One or two real cases, with the intervention, the impact and a source.' },
  { key: 'cheat', label: 'Day-to-day', note: 'A three-line cheat sheet people can use on Monday.' },
  { key: 'practice', label: 'Let’s practice', note: 'Timed work on the brief, with a design lead at every table.' },
] as const;
