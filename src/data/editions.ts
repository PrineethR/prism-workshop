// Past Prism runs, written up as worked examples. Agendas are copied from the deck.

export interface AgendaRow { minutes: number; title: string; note?: string; kind: 'session' | 'break' | 'practice' | 'close' }

export const monsoon = {
  id: 'monsoon-2026',
  name: 'Monsoon Edition',
  programme: 'The Executive Design Thinking Learning Accelerator',
  promise: 'Bridging the gap between business strategy and hands-on, human-centred product execution.',
  cohort: 'Cohort 3',
  where: 'Axis House, Mumbai',
  brief: 'We want to introduce a way for our customers to engage with the app beyond their regular transactional usages.',
  thread: 'Chai: the designated tea maker of the house wants help making the process more efficient.',
  phases: [
    { name: 'Launch', when: 'Week 1 · September 22–23, 2026', what: 'A deep dive into the design thinking framework, in person.' },
    { name: 'Velocity', when: 'Weeks 3 and 5 · virtual', what: 'One-on-one group momentum sessions and support: Discover & Define, then Ideate & Prioritise.' },
    { name: 'Impact', when: 'Week 6 · Oct 26–30, 2026', what: 'A pitch session where each group presents its progress, solutions and key learnings.' },
  ],
  days: [
    {
      label: 'Day 1', date: 'September 22, 2026',
      rows: [
        { minutes: 60, title: 'Primers', note: 'Understanding & defining design · Can design make a difference?', kind: 'session' },
        { minutes: 15, title: 'Coffee break', kind: 'break' },
        { minutes: 75, title: 'Deep dive: Discovery', kind: 'session' },
        { minutes: 45, title: 'Lunch', kind: 'break' },
        { minutes: 60, title: 'Deep dive: Define', kind: 'session' },
        { minutes: 45, title: 'Group projects', kind: 'practice' },
        { minutes: 15, title: 'Day 1 closing', kind: 'close' },
      ] as AgendaRow[],
    },
    {
      label: 'Day 2', date: 'September 23, 2026',
      rows: [
        { minutes: 15, title: 'Reflections and recap', kind: 'session' },
        { minutes: 60, title: 'Deep dive: Ideate and Delight', kind: 'session' },
        { minutes: 15, title: 'Beverage break', kind: 'break' },
        { minutes: 60, title: 'Deep dive: Prototype and Test', kind: 'session' },
        { minutes: 45, title: 'Lunch break', kind: 'break' },
        { minutes: 40, title: 'Group share-outs', kind: 'practice' },
        { minutes: 30, title: 'Group working time', kind: 'practice' },
        { minutes: 30, title: 'Closing', kind: 'close' },
      ] as AgendaRow[],
    },
  ],
  quotes: [
    'I realised how often we assume things without asking enough questions.',
    'This should be done more often, it genuinely changes thinking.',
  ],
  mindset: [
    ['Don’t question, execute', 'Problem frame'],
    ['Business & technology centric', 'Empathetic'],
    ['Verbal & precise', 'Visual & imaginative'],
    ['Waterfall, linear thinking', 'Iterative'],
    ['Cooperative', 'Collaborative'],
  ],
  slides: [2, 8, 9, 10, 16, 18, 44, 62, 63, 71, 73, 87, 89, 103, 105, 107, 111, 129, 139, 142, 155, 162, 169, 173, 177, 187, 200, 206, 209, 213],
};
