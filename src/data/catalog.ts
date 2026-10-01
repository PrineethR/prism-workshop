// Everything a creator can pull into a workshop. The items live in
// src/data/items/, one file per kind. Anything marked `slides` came from the
// Monsoon Edition deck; the rest was added for v2 from standard practice
// (IDEO, Stanford d.school and others), with sources where they matter.
// `image` paths are relative to /img/.

import type { PhaseId } from './phases';
import { activities } from './items/activities';
import { methods } from './items/methods';
import { cases } from './items/cases';
import { templates } from './items/templates';

export type Kind = 'activity' | 'method' | 'case' | 'template';
// icebreaker: opens the day · opener: "feel it first" for a phase · closer: ends the day
export type Role = 'icebreaker' | 'opener' | 'energiser' | 'practice' | 'shareout' | 'closer';
export type Energy = 'low' | 'medium' | 'high';

export interface Item {
  id: string;
  kind: Kind;
  phase: PhaseId;
  title: string;
  summary: string;
  minutes?: number;
  role?: Role;
  image?: string;
  steps?: { title: string; body: string }[];
  materials?: string[];
  output?: string[];
  debrief?: string;
  chai?: string; // how the running example shows up
  impact?: string[];
  source?: string;
  figma?: string; // paste a Figma share link to embed the file
  templates?: string[];
  slides?: number[]; // pages in the Monsoon Edition deck

  why?: string; // why it works
  when?: string; // methods: when to reach for it
  tips?: string[]; // what an experienced facilitator watches for
  variations?: { label: string; body: string }[]; // remote, big room, short on time
  say?: string[]; // lines to say out loud
  remote?: boolean; // runs on a video call, as written or with its remote variation
  energy?: Energy;
  group?: string; // pairs, tables, the whole room
  teach?: number; // methods: minutes to teach it in a workshop
  takeaway?: string; // cases: the one thing to land
  verify?: boolean; // figures added outside the deck: check them against the source before they go on a slide
  fields?: string[]; // templates: what's on the sheet
  format?: string; // templates: print size
}

export const kindLabel: Record<Kind, string> = {
  activity: 'Activity',
  method: 'Method',
  case: 'Case study',
  template: 'Template',
};

export const roleLabel: Record<Role, string> = {
  icebreaker: 'Icebreaker',
  opener: 'Feel-it opener',
  energiser: 'Energiser',
  practice: 'Practice block',
  shareout: 'Share-out',
  closer: 'Closer',
};

export const items: Item[] = [...activities, ...methods, ...cases, ...templates];

// Templates share ids with methods in a few places (stakeholder-map, why-ladder,
// analogous, prioritisation-matrix). Address catalog pages by kind + id.
export const slugOf = (i: Item) => (i.kind === 'template' ? `template-${i.id}` : i.id);
export const itemBySlug = Object.fromEntries(items.map((i) => [slugOf(i), i]));
export const find = (id: string, kind?: Kind) =>
  items.find((i) => i.id === id && (!kind || i.kind === kind)) ?? items.find((i) => i.id === id);
export const templateById = (id: string) => items.find((i) => i.kind === 'template' && i.id === id);
