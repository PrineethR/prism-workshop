// The two ready-made workshops: the formula people take and run as is.
// Both come from the copilot's engine with fixed answers (teach the method,
// the whole diamond, 24 people in a room, the chai example), so they pass the
// same review checks. Change the answers here and both the Workshop tab and
// the planning wall follow.

import { buildPlan, defaults, recommendPhases, type Answers } from '../scripts/copilot/engine';

export type FormulaLength = 'day' | 'two';

const base: Answers = {
  ...defaults,
  brief: 'Write your own brief here: who struggles, and with what.',
  goal: 'learn',
  stage: 'whole',
  audience: 'mixed',
  people: 24,
  leads: 4,
  format: 'room',
  start: '09:30',
  thread: 'Chai',
  followUp: true,
  energisers: true,
};

export function formulaAnswers(length: FormulaLength): Answers {
  return {
    ...base,
    length,
    name: length === 'day' ? 'Prism · One-day workshop' : 'Prism · Two-day workshop',
    phases: recommendPhases({ goal: base.goal, stage: base.stage, length }),
  };
}

export const formulas = {
  day: {
    id: 'day' as const,
    label: 'One day',
    title: 'The one-day workshop',
    line: 'The whole Double Diamond in a single day. Each team feels every phase once, on a real brief, and leaves with a problem statement to take forward.',
    best: ['First time a team meets the method', 'Up to 30 people, 4–5 tables', 'You can only get people for one day'],
  },
  two: {
    id: 'two' as const,
    label: 'Two days',
    title: 'The two-day workshop',
    line: 'The Monsoon Edition format. Day 1 opens up the problem (Discover, Define), day 2 opens up the solution (Ideate, Delight, Prototype), with time for group projects.',
    best: ['Leaders and teams who will run a project after', 'Room for every deck tool, plus Delight', 'A follow-up programme over the next six weeks'],
  },
};

export const formulaPlan = (length: FormulaLength) => buildPlan(formulaAnswers(length));
