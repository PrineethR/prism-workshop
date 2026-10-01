// The path from "I want to run a workshop" to "the core team has reviewed it".
// Each step says what to do, how you know it's done, and what Prism did.

export interface Step {
  id: string;
  n: number;
  title: string;
  lede: string;
  icon: string;
  do: string[];
  done: string[];
  prism: string;
  avoid?: string[];
  links?: string[]; // catalog slugs
}

export const steps: Step[] = [
  {
    id: 'brief', n: 1, icon: 'brief',
    title: 'Start from a business brief',
    lede: 'One sentence the whole room works on, written as a need rather than a solution.',
    do: [
      'Decide what the workshop is for: teaching the method, progress on a live problem, aligning leaders, or kicking off a project. Everything else follows from it.',
      'Find a sponsor with a real challenge, and write it down with them.',
      'Describe the problem, not the solution: “Customers struggle to find the right information when they need support,” not “Build a chatbot.”',
      'Make it broad enough to explore but focused enough to act on.',
    ],
    done: ['You can say what will be different when people leave', 'The brief fits in one sentence', 'It names a person or a behaviour, not a feature', 'The sponsor would act on what teams find'],
    prism: '“We want to introduce a way for our customers to engage with the app beyond their regular transactional usages.” Every team worked on this one brief for the two days.',
    avoid: ['“Create a new dashboard”', 'A metric with no person in it, e.g. “the app has a 38% drop-off rate”'],
    links: ['problem-statement'],
  },
  {
    id: 'room', n: 2, icon: 'user-room',
    title: 'Design the room',
    lede: 'Tables of five or six, one design lead per table, and a reason for everyone to talk.',
    do: [
      'Send a short pre-survey so you know who’s coming and what they work on.',
      'Seat people in mixed tables. Put a designer from the team at every table as its design lead.',
      'Give each table a perspective card: Simplicity Champion, Innovation Explorer, User Advocate or Business Champion.',
      'Hand out superpower stickers at the door.',
    ],
    done: ['Every table has a design lead', 'Every table has a perspective card', 'You know each participant’s team'],
    prism: 'Before anything started, each person had a table, a team, a design lead and a completed survey. The opening slide asked, “Does everyone know their superpower?”',
    links: ['template-perspective-cards', 'template-superpower-sticker', 'two-truths'],
  },
  {
    id: 'spine', n: 3, icon: 'calendar',
    title: 'Lay the Double Diamond spine',
    lede: 'Decide which phases you can do properly in the time you have. Cut phases before you cut practice time.',
    do: [
      'Kick off with primers: what design is, and whether it makes a difference.',
      'Sequence the phases: Discover → Define → Ideate (with a sprinkle of Delight) → Prototype & Test.',
      'Open every phase with a “where are we?” slide that lights up the diamond.',
      'Use the copilot to see what fits.',
    ],
    done: ['Every phase gets at least 50 minutes', 'Breaks are on the agenda, with times', 'The day ends with share-outs, not theory'],
    prism: 'Day 1: primers, Discover, Define, group projects. Day 2: recap, Ideate & Delight, Prototype & Test, share-outs, project statements.',
    avoid: ['Four phases in a half day', 'Theory straight after lunch'],
  },
  {
    id: 'module', n: 4, icon: 'containers',
    title: 'Build every phase the same way',
    lede: 'Prism repeats one pattern for every phase. People learn the rhythm, so they can focus on the content.',
    do: [
      'Feel it first: open with an activity that lets people experience the idea before you name it.',
      'Then Why → What → How. Keep each one to a single slide where you can.',
      'Show each tool through the running example, then through a real case.',
      'End with a three-line “day-to-day” cheat sheet, then practice on the brief.',
    ],
    done: ['Each phase has a feel-it activity', 'Each tool has an example', 'Practice time is at least as long as theory time'],
    prism: 'Discover opened with People Watching, Define with “What is this…”, Ideate with Let’s Circle Back, and Prototype with Sinking & Floating.',
    links: ['people-watching', 'what-is-this', 'circle-back', 'sinking-floating'],
  },
  {
    id: 'thread', n: 5, icon: 'chai-cups',
    title: 'Choose one running example',
    lede: 'One everyday, physical thing that every tool gets shown on. Prism used chai.',
    do: [
      'Choose something everyone has done, has an opinion on, and has no work stakes in.',
      'Prepare one worked example per tool before the day.',
      'Keep it physical. Volunteers made real tea for People Watching.',
    ],
    done: ['Each method slide has a worked example', 'The example has friction worth solving (ginger grating!)'],
    prism: '“The designated tea maker of the house has asked for help to make the process more efficient.” It ran from the stakeholder map to the prioritisation matrix to a role-played pre-grated ginger batch.',
    links: ['stakeholder-map', 'how-might-we', 'crazy-8s', 'role-play'],
  },
  {
    id: 'energy', n: 6, icon: 'timer',
    title: 'Time it, and keep the energy up',
    lede: 'Every activity has a visible countdown. Every break ends with an energiser.',
    do: [
      'Put a timer on the slide for every activity: 05:00, 10:00, 20:00, 30:00.',
      'Plan an energiser after each break and after lunch.',
      'Use fill-in-the-blank lines with goodies to wake the room after theory.',
      'End every activity with a single debrief line on its own slide.',
    ],
    done: ['Every activity has a timer', 'Every break is followed by something physical'],
    prism: 'Heads, Shoulders, Knees & Toes; Would You Rather; Goodie Time. Debrief lines like “That should have broken some ice ;)”',
    links: ['heads-shoulders', 'would-you-rather', 'fill-the-blank'],
  },
  {
    id: 'materials', n: 7, icon: 'draw',
    title: 'Make the materials',
    lede: 'The deck, the guidebook, the worksheets and the things people touch.',
    do: [
      'Start the deck from the Prism template. Change content, not structure.',
      'Print worksheets at A3, one set per table, plus spares.',
      'Prepare the guidebook so people have something to take home.',
      'Pack the physical kit: stickers, circles sheets, boat materials, goodies, the tea station.',
    ],
    done: ['Worksheets are printed per table', 'The deck has been run end to end once with a timer'],
    prism: 'A guidebook, perspective cards, A3 worksheets for every tool, superpower stickers and a Slido poll.',
    links: ['template-experience-map', 'template-stakeholder-map', 'template-crazy-8s-sheet'],
  },
  {
    id: 'run', n: 8, icon: 'spaceship',
    title: 'Run the room',
    lede: 'Three norms, said out loud at the start.',
    do: [
      'Be present, not perfect.',
      'Keep the user in the room.',
      'Spaceship!',
      'Start day 2 with reflections and a recap. Close each day with reflections and questions.',
    ],
    done: ['Norms are on a slide in the first 15 minutes', 'Design leads know the brief before the day'],
    prism: '“How we show up” was slide 18, before any content.',
  },
  {
    id: 'close', n: 9, icon: 'flowers',
    title: 'Close, and keep it going',
    lede: 'A workshop is the launch, not the whole programme.',
    do: [
      'Share-outs use one frame: discovery → insight → HMW → ideas → direction → prototype → learn.',
      'Talk about trade-offs with DVF: desirable, feasible, viable.',
      'Every team leaves with a problem statement for a group project.',
      'Book the follow-ups before people leave, and send the feedback form on the day.',
    ],
    done: ['Each team has a problem statement', 'Check-ins are in calendars', 'The feedback form is out'],
    prism: 'Launch (two days, in person) → Velocity (virtual check-ins in weeks 3 and 5) → Impact (a showcase in week 6).',
    links: ['shareout', 'dvf', 'problem-statement'],
  },
  {
    id: 'review', n: 10, icon: 'question',
    title: 'Send it for review',
    lede: 'The core team’s only job: a quality check before the invite goes out.',
    do: [
      'Export your plan from the copilot and attach the deck link.',
      'Run the checklist below yourself first.',
      'Book a 30-minute review at least two weeks before the workshop.',
    ],
    done: ['Every check passes, or has a reason why not'],
    prism: 'Reviews look at structure and time, not slide polish.',
  },
];

// What the core team checks. The copilot runs the automatic ones live, with
// the same ids (src/scripts/copilot/engine.ts → runChecks).
export const reviewChecklist = [
  { id: 'brief-problem', label: 'The brief describes a problem, not a solution', auto: true },
  { id: 'feel-first', label: 'Every phase opens with an activity before theory', auto: true },
  { id: 'practice-time', label: 'In each phase, practice time is at least as long as explanation time', auto: true },
  { id: 'theory-chunks', label: 'No stretch of theory runs over 25 minutes', auto: true },
  { id: 'min-phase', label: 'No phase is shorter than 50 minutes', auto: true },
  { id: 'after-lunch', label: 'The slot after lunch is hands-on', auto: true },
  { id: 'energiser', label: 'Every break is followed by an energiser', auto: true },
  { id: 'converge', label: 'Every time the room opens up, it also narrows down to a choice', auto: true },
  { id: 'sequence', label: 'Each phase has an input, from the room or from work done before', auto: true },
  { id: 'real-users', label: 'On a live problem, real people outside the room are part of it', auto: true },
  { id: 'leads', label: 'There is a design lead for every table', auto: true },
  { id: 'fits', label: 'The agenda fits the time available', auto: true },
  { id: 'remote-fit', label: 'Remote sessions are short, and every activity works on a call', auto: true },
  { id: 'running-example', label: 'One running example is used for every tool', auto: false },
  { id: 'cases-sourced', label: 'Every case study has its source on the slide, and its figures have been checked', auto: false },
  { id: 'follow-through', label: 'There is a plan for after the workshop', auto: true },
];
