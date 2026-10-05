// My plan: an open planning wall. Pieces of the kit (activities, methods,
// cases, templates, the three kit files and the perspective cards) go on as
// cards, next to sticky notes, headings and frames. Frames add up the minutes
// inside them, so a wall of frames left to right reads as a running order.
//
// The board is plain DOM: a transformed "world" inside a stage that pans and
// zooms. One board per browser, kept in localStorage; Save a copy / Open a copy
// move it between machines.

import { store } from './store';
import { PIN_KEY } from './detail';
import { items, slugOf, kindLabel, roleLabel, find, type Item } from '../data/catalog';
import { phases, phaseById, type PhaseId } from '../data/phases';
import { kit, perspectiveCards } from '../data/kit';
import { buildPlan, defaults, fmtClock, type Answers } from './copilot/engine';
import { formulaAnswers } from '../data/formula';

const KEY = 'prism.board.v1';
const COPILOT_KEY = 'prism.copilot.v2';
const GRID = 8;
const CARD_W = 232;
const ZMIN = 0.2, ZMAX = 2;

const base = (document.querySelector('link[rel=icon]') as HTMLLinkElement).getAttribute('href')!.replace(/favicon\.svg$/, '');
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const snap = (v: number) => Math.round(v / GRID) * GRID;
const uid = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m} min`);

// ── Pieces: everything that can go on the wall ──────────────────────────────

type PieceKind = Item['kind'] | 'kit';
interface Piece { ref: string; kind: PieceKind; title: string; summary: string; phase?: PhaseId; minutes?: number; teach?: boolean; image?: string; href: string; meta: string; search: string }

const pieceKindLabel: Record<PieceKind, string> = { ...kindLabel, kit: 'Kit' };
const pieces: Piece[] = [
  ...items.map((i): Piece => ({
    ref: slugOf(i), kind: i.kind, title: i.title, summary: i.summary, phase: i.phase,
    minutes: i.minutes ?? i.teach, teach: !i.minutes && !!i.teach, image: i.image,
    href: `${base}catalog/${slugOf(i)}/`,
    meta: [kindLabel[i.kind], i.role ? roleLabel[i.role] : phaseById[i.phase].short].join(' · '),
    search: `${i.title} ${i.summary} ${i.role ?? ''} ${phaseById[i.phase].name}`.toLowerCase(),
  })),
  ...kit.map((k): Piece => ({
    ref: `kit-${k.id}`, kind: 'kit', title: k.title, summary: k.line, image: k.poster,
    href: `${base}kit/#${k.id}`, meta: 'Kit file', search: `${k.title} ${k.line}`.toLowerCase(),
  })),
  ...perspectiveCards.map((c): Piece => ({
    ref: `card-${c.id}`, kind: 'kit', title: c.title, summary: c.asks, phase: 'kickoff', image: c.image,
    href: `${base}kit/#cards`, meta: 'Perspective card', search: `${c.title} ${c.line} ${c.asks} perspective card`.toLowerCase(),
  })),
];
const pieceByRef = new Map(pieces.map((p) => [p.ref, p]));
const kindOrder: PieceKind[] = ['activity', 'method', 'case', 'template', 'kit'];
const phaseOrder = phases.map((p) => p.id);

// ── Board model ─────────────────────────────────────────────────────────────

type NoteColour = 'yellow' | 'pink' | 'lilac' | 'white';
const COLOURS: NoteColour[] = ['yellow', 'pink', 'lilac', 'white'];
type ItemNode = { id: string; t: 'item'; x: number; y: number; ref: string; min?: number };
type NoteNode = { id: string; t: 'note'; x: number; y: number; w: number; h: number; text: string; c: NoteColour };
// `at`: a fixed start time ("09:30"). Frames without one start when the block to their left ends.
type FrameNode = { id: string; t: 'frame'; x: number; y: number; w: number; h: number; text: string; at?: string };
type TextNode = { id: string; t: 'text'; x: number; y: number; w: number; text: string };
type BNode = ItemNode | NoteNode | FrameNode | TextNode;
interface View { x: number; y: number; z: number }
// v2: frame times are live (`at` plus the row), not typed into titles.
interface Saved { nodes: BNode[]; view: View; v?: number }
const VERSION = 2;

/** Minutes a node adds to its frame. Notes count if they say “10 min”. */
function minutesOf(n: BNode): number {
  if (n.t === 'item') return n.min ?? pieceByRef.get(n.ref)?.minutes ?? 0;
  if (n.t === 'note') {
    const m = n.text.match(/(\d+)\s*(?:min|mins|minutes|m)\b/i);
    const h = n.text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b/i);
    return (m ? +m[1] : 0) + (h ? Math.round(+h[1] * 60) : 0);
  }
  return 0;
}

export function initBoard() {
  const root = $('[data-board]');
  const stage = $('[data-stage]', root);
  const world = $('[data-world]', root);
  const framesLayer = $('[data-frames]', root);
  const nodesLayer = $('[data-nodes]', root);
  const bar = $('[data-selbar]', root);
  const empty = $('[data-empty]', root);
  const zoomOut = $('[data-zoom-label]', root);
  const tally = $('[data-tally]', root);
  const lib = $('[data-lib]', root);
  const list = $('[data-list]', lib);
  const search = $<HTMLInputElement>('[data-lib-search]', lib);
  const phaseSel = $<HTMLSelectElement>('[data-lib-phase]', lib);
  const toastEl = $('[data-toast]', root);

  const saved = store.get<Saved | null>(KEY, null);
  let nodes: BNode[] = saved?.nodes ?? [];
  const view: View = saved?.view ?? { x: 0, y: 0, z: 1 };
  const els = new Map<string, HTMLElement>();
  const sel = new Set<string>();
  let editing: string | null = null;
  let blankStart = false;

  // ── History ──────────────────────────────────────────────────────────────
  let last = JSON.stringify(nodes);
  const past: string[] = [];
  let future: string[] = [];
  const save = () => store.set(KEY, { nodes, view, v: VERSION });
  let saveT = 0;
  const saveSoon = () => { clearTimeout(saveT); saveT = window.setTimeout(save, 250); };
  function commit() {
    const now = JSON.stringify(nodes);
    if (now === last) return;
    past.push(last); if (past.length > 80) past.shift();
    last = now; future = [];
    save(); afterChange();
  }
  function restore(snapshot: string) {
    nodes = JSON.parse(snapshot); last = snapshot;
    [...sel].forEach((id) => { if (!nodes.some((n) => n.id === id)) sel.delete(id); });
    rebuild(); save();
  }
  const undo = () => { if (!past.length) return; future.push(last); restore(past.pop()!); };
  const redo = () => { if (!future.length) return; past.push(last); restore(future.pop()!); };

  // ── View ─────────────────────────────────────────────────────────────────
  function applyView() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.z})`;
    stage.style.setProperty('--gx', `${view.x}px`);
    stage.style.setProperty('--gy', `${view.y}px`);
    // Dots stay at least 12px apart, so zooming out doesn't turn the wall grey.
    let gs = 24 * view.z;
    while (gs < 12) gs *= 2;
    stage.style.setProperty('--gs', `${gs}px`);
    zoomOut.textContent = `${Math.round(view.z * 100)}%`;
    placeBar(); saveSoon();
  }
  const toWorld = (cx: number, cy: number) => {
    const r = stage.getBoundingClientRect();
    return { x: (cx - r.left - view.x) / view.z, y: (cy - r.top - view.y) / view.z };
  };
  const centre = () => { const r = stage.getBoundingClientRect(); return toWorld(r.left + r.width / 2, r.top + r.height / 2); };
  function zoomAt(z: number, cx?: number, cy?: number) {
    const r = stage.getBoundingClientRect();
    const px = cx ?? r.left + r.width / 2, py = cy ?? r.top + r.height / 2;
    const w = toWorld(px, py);
    view.z = clamp(z, ZMIN, ZMAX);
    view.x = px - r.left - w.x * view.z;
    view.y = py - r.top - w.y * view.z;
    applyView();
  }
  function fit(only?: BNode[]) {
    const list = only ?? nodes;
    if (!list.length) { view.x = 40; view.y = 40; view.z = 1; applyView(); return; }
    const b = bounds(list);
    const r = stage.getBoundingClientRect();
    const pad = 64;
    view.z = clamp(Math.min((r.width - pad * 2) / b.w, (r.height - pad * 2) / b.h), ZMIN, 1);
    view.x = (r.width - b.w * view.z) / 2 - b.x * view.z;
    view.y = (r.height - b.h * view.z) / 2 - b.y * view.z;
    applyView();
  }

  // ── Geometry ─────────────────────────────────────────────────────────────
  const size = (n: BNode) => {
    if (n.t === 'note' || n.t === 'frame') return { w: n.w, h: n.h };
    const el = els.get(n.id);
    return { w: el?.offsetWidth || (n.t === 'item' ? CARD_W : n.w), h: el?.offsetHeight || 80 };
  };
  function bounds(list: BNode[]) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of list) {
      const s = size(n);
      x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + s.w); y1 = Math.max(y1, n.y + s.h);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  /** The frame a piece belongs to: the topmost one its centre sits in. One frame
   *  only, so overlapping frames never count the same minutes twice. */
  function owner(n: BNode): FrameNode | undefined {
    if (n.t === 'frame') return undefined;
    const s = size(n), cx = n.x + s.w / 2, cy = n.y + s.h / 2;
    let hit: FrameNode | undefined;
    for (const f of nodes) if (f.t === 'frame' && cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h) hit = f;
    return hit;
  }
  const inside = (f: FrameNode) => nodes.filter((n) => owner(n) === f);
  const frameMinutes = (f: FrameNode) => inside(f).reduce((s, n) => s + minutesOf(n), 0);

  /** Frames side by side make a row: the running order of one day, left to right.
   *  Loose timed notes and cards between two frames of a row (a coffee break) belong to it too. */
  function rows(): BNode[][] {
    const frames = nodes.filter((n): n is FrameNode => n.t === 'frame');
    const up = frames.map((_, i) => i);
    const top = (i: number): number => (up[i] === i ? i : (up[i] = top(up[i])));
    for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++) {
      const a = frames[i], b = frames[j];
      const overlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (overlap > Math.min(a.h, b.h) / 2) up[top(i)] = top(j);
    }
    const groups = new Map<number, FrameNode[]>();
    frames.forEach((f, i) => groups.set(top(i), [...(groups.get(top(i)) ?? []), f]));
    const taken = new Set<BNode>();
    return [...groups.values()].map((fs) => {
      const x0 = Math.min(...fs.map((f) => f.x)), x1 = Math.max(...fs.map((f) => f.x + f.w));
      const y0 = Math.min(...fs.map((f) => f.y)), y1 = Math.max(...fs.map((f) => f.y + f.h));
      const between = nodes.filter((n) => {
        if ((n.t !== 'note' && n.t !== 'item') || taken.has(n) || owner(n) || !minutesOf(n)) return false;
        const s = size(n), cx = n.x + s.w / 2, cy = n.y + s.h / 2;
        return cx > x0 && cx < x1 && cy > y0 && cy < y1;
      });
      between.forEach((n) => taken.add(n));
      return [...fs, ...between].sort((a, b) => a.x - b.x);
    });
  }
  const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  /** Start and end of every block in a row that has a start time. A frame with `at` sets the clock;
   *  everything after it follows on, so adding, moving or retiming a block moves the rest. */
  function timeline() {
    const times = new Map<string, { start: number; end: number }>();
    for (const row of rows()) {
      let clock: number | undefined;
      for (const n of row) {
        if (n.t === 'frame' && n.at) clock = toMin(n.at);
        if (clock === undefined) continue;
        const m = n.t === 'frame' ? frameMinutes(n) : minutesOf(n);
        times.set(n.id, { start: clock, end: clock + m });
        clock += m;
      }
    }
    return times;
  }
  /** Boards from before v2 had times typed into titles. Lift them out: keep the first frame of each
   *  row as the fixed start, and let the rest follow on. */
  function migrate(list: BNode[]) {
    const stamp = /^(\d{1,2}):(\d{2})\s+/;
    const before = nodes; nodes = list;
    for (const n of list) {
      if (n.t === 'frame') {
        const m = n.text.match(stamp);
        if (m) { n.at = `${m[1].padStart(2, '0')}:${m[2]}`; n.text = n.text.replace(stamp, ''); }
      }
      if (n.t === 'note' && !owner(n) && stamp.test(n.text)) n.text = n.text.replace(stamp, '');
    }
    for (const row of rows()) row.filter((n): n is FrameNode => n.t === 'frame').slice(1).forEach((f) => { delete f.at; });
    nodes = before;
    return list;
  }
  /** To the right of everything already on the wall, so a new layout never lands on top of work. */
  function freeX() { return nodes.length ? snap(bounds(nodes).x + bounds(nodes).w + 120) : 0; }

  // ── Drawing ──────────────────────────────────────────────────────────────
  function draw(n: BNode) {
    const el = document.createElement('div');
    el.className = `n n-${n.t}`;
    el.dataset.id = n.id;
    el.tabIndex = 0;
    if (n.t === 'item') {
      const p = pieceByRef.get(n.ref);
      el.classList.add(`k-${p?.kind ?? 'missing'}`);
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', p ? `${p.meta}: ${p.title}` : 'Missing piece');
      el.innerHTML = p ? `
        <div class="ni-media">${p.image ? `<img src="${base}img/${p.image}" alt="" draggable="false" loading="lazy" />` : ''}</div>
        <div class="ni-body">
          <span class="ni-meta">${esc(p.meta)}</span>
          <strong class="ni-title">${esc(p.title)}</strong>
          <span class="ni-min" data-min></span>
        </div>` : '<div class="ni-body"><strong class="ni-title">This piece is no longer in the catalog</strong></div>';
    } else if (n.t === 'note') {
      el.classList.add(`c-${n.c}`);
      el.setAttribute('aria-label', 'Sticky note');
      el.innerHTML = '<span class="nt-clock" data-clock></span><div class="nt-text" data-text spellcheck="true"></div><span class="grip" data-resize aria-hidden="true"></span>';
      $('[data-text]', el).textContent = n.text;
    } else if (n.t === 'text') {
      el.setAttribute('aria-label', 'Heading');
      el.innerHTML = '<div class="tx-text" data-text spellcheck="true"></div>';
      $('[data-text]', el).textContent = n.text;
    } else {
      el.setAttribute('aria-label', `Frame: ${n.text}`);
      el.innerHTML = `
        <div class="fr-head" data-handle>
          <span class="fr-clock" data-clock></span>
          <div class="fr-title" data-text spellcheck="true"></div>
          <span class="fr-sum" data-sum></span>
        </div>
        <span class="grip" data-resize aria-hidden="true"></span>`;
      $('[data-text]', el).textContent = n.text;
    }
    (n.t === 'frame' ? framesLayer : nodesLayer).append(el);
    els.set(n.id, el);
    place(n);
    return el;
  }
  function place(n: BNode) {
    const el = els.get(n.id);
    if (!el) return;
    el.style.transform = `translate(${n.x}px, ${n.y}px)`;
    if (n.t === 'note' || n.t === 'frame') { el.style.width = `${n.w}px`; el.style.height = `${n.h}px`; }
    if (n.t === 'text') el.style.width = `${n.w}px`;
    if (n.t === 'item') {
      const p = pieceByRef.get(n.ref);
      const pill = el.querySelector<HTMLElement>('[data-min]');
      const m = minutesOf(n);
      if (pill) {
        pill.textContent = m ? (p?.teach && n.min === undefined ? `${m} min to teach` : `${m} min`) : '';
        pill.classList.toggle('edited', n.min !== undefined);
      }
    }
    el.classList.toggle('sel', sel.has(n.id));
  }
  function rebuild() {
    els.forEach((el) => el.remove());
    els.clear();
    nodes.forEach(draw);
    afterChange();
  }

  /** Frame totals, the board tally, the empty state, the selection bar. */
  function afterChange() {
    let total = 0, frames = 0;
    for (const n of nodes) {
      if (n.t !== 'frame') continue;
      frames++;
      const inn = inside(n);
      const m = inn.reduce((s, x) => s + minutesOf(x), 0);
      total += m;
      const sum = els.get(n.id)?.querySelector<HTMLElement>('[data-sum]');
      if (sum) {
        sum.textContent = inn.length ? (m ? fmtMin(m) : 'No timings') : 'Drop pieces in';
        sum.title = `${inn.length} ${inn.length === 1 ? 'piece' : 'pieces'}`;
      }
      const title = els.get(n.id)?.querySelector<HTMLElement>('.fr-title');
      if (title && !editing) title.title = n.text;
    }
    // Clocks: every block in a timed row shows when it starts.
    const times = timeline();
    for (const n of nodes) {
      const c = els.get(n.id)?.querySelector<HTMLElement>('[data-clock]');
      if (!c) continue;
      const t = times.get(n.id);
      c.textContent = t ? fmtClock(t.start) : '';
      c.title = t ? `${fmtClock(t.start)}–${fmtClock(t.end)}${n.t === 'frame' && n.at ? ' · fixed start' : ''}` : '';
      c.classList.toggle('fixed', n.t === 'frame' && !!n.at);
    }
    const loose = nodes.filter((n) => n.t !== 'frame' && !owner(n));
    const looseMin = loose.reduce((s, n) => s + minutesOf(n), 0);
    const cards = nodes.filter((n) => n.t === 'item').length;
    tally.innerHTML = nodes.length
      ? `<strong>${fmtMin(total + looseMin)}</strong> on the wall · ${cards} ${cards === 1 ? 'piece' : 'pieces'}${frames ? ` in ${frames} ${frames === 1 ? 'frame' : 'frames'}` : ''}${frames && looseMin ? ` · ${fmtMin(looseMin)} not in a frame` : ''}`
      : 'Nothing on the wall yet';
    empty.hidden = nodes.length > 0 || blankStart;
    root.classList.toggle('is-empty', nodes.length === 0);
    $<HTMLButtonElement>('[data-undo]', root).disabled = !past.length;
    $<HTMLButtonElement>('[data-redo]', root).disabled = !future.length;
    markOnBoard();
    renderBar();
  }

  // ── Selection bar ────────────────────────────────────────────────────────
  function renderBar() {
    const chosen = nodes.filter((n) => sel.has(n.id));
    if (!chosen.length || editing) { bar.hidden = true; return; }
    if (bar.contains(document.activeElement) && !bar.hidden) { placeBar(); return; } // don't swap the time field out from under the cursor
    const one = chosen.length === 1 ? chosen[0] : null;
    let html = '';
    if (!one) {
      // Several at once: how many, how long, and the one move that matters, grouping them into a block.
      const pieces = new Set<BNode>(chosen.filter((n) => n.t !== 'frame'));
      chosen.forEach((n) => { if (n.t === 'frame') inside(n).forEach((x) => pieces.add(x)); });
      const m = [...pieces].reduce((s, n) => s + minutesOf(n), 0);
      html += `<span class="sb-count">${chosen.length} selected${m ? ` · ${fmtMin(m)}` : ''}</span><span class="sb-sep"></span>`;
      if (chosen.some((n) => n.t !== 'frame')) html += '<button data-wrap title="Put a frame around them">Frame them</button>';
    }
    if (one?.t === 'note') {
      html += `<div class="sb-swatches" role="group" aria-label="Colour">${COLOURS.map((c) => `<button class="sw c-${c}" data-colour="${c}" aria-label="${c}" aria-pressed="${one.c === c}"></button>`).join('')}</div><span class="sb-sep"></span>`;
    }
    if (one?.t === 'item' && pieceByRef.get(one.ref)?.kind !== 'kit') {
      const m = minutesOf(one);
      html += `<div class="sb-step" role="group" aria-label="Minutes">
        <button data-step="-5" aria-label="5 minutes less">−</button><span>${m ? fmtMin(m) : 'No time'}</span><button data-step="5" aria-label="5 minutes more">+</button>
      </div>${one.min !== undefined ? '<button data-reset>Reset</button>' : ''}<span class="sb-sep"></span>`;
    }
    if (one?.t === 'item' && pieceByRef.get(one.ref)) html += `<a href="${pieceByRef.get(one.ref)!.href}" target="_blank" rel="noopener">Open ↗</a>`;
    if (one?.t === 'frame') {
      const t = timeline().get(one.id);
      html += `<label class="sb-time" title="${one.at ? 'Fixed start. Blocks to the right follow on from it.' : 'Follows on from the block to its left. Set a time to fix it.'}">Starts
        <input type="time" data-at value="${one.at ?? (t ? fmtClock(t.start) : '')}" /></label>
        ${one.at ? '<button data-unpin title="Start when the block to its left ends">Follow on</button>' : ''}<span class="sb-sep"></span>
        <button data-tidy>Tidy</button>`;
    }
    if (one && one.t !== 'item') html += '<button data-edit>Edit</button>';
    html += `<button data-dup>Duplicate</button><button data-del class="danger">Delete${chosen.length > 1 ? ` ${chosen.length}` : ''}</button>`;
    bar.innerHTML = html;
    bar.hidden = false;
    placeBar();
  }
  function placeBar() {
    if (bar.hidden) return;
    const chosen = [...sel].map((id) => els.get(id)).filter(Boolean) as HTMLElement[];
    if (!chosen.length) return;
    const sr = stage.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity;
    chosen.forEach((el) => { const r = el.getBoundingClientRect(); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); });
    const bw = bar.offsetWidth;
    const left = clamp((x0 + x1) / 2 - sr.left - bw / 2, 8, sr.width - bw - 8);
    const top = y0 - sr.top - bar.offsetHeight - 10;
    // Stay clear of the toolbar along the top of the wall.
    const tb = $('.toolbar', root).getBoundingClientRect();
    bar.style.transform = `translate(${left}px, ${Math.max(tb.bottom - sr.top + 8, top)}px)`;
  }
  bar.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    const chosen = nodes.filter((n) => sel.has(n.id));
    const one = chosen[0];
    if (b.dataset.colour && one?.t === 'note') {
      one.c = b.dataset.colour as NoteColour;
      const el = els.get(one.id)!;
      COLOURS.forEach((c) => el.classList.remove(`c-${c}`));
      el.classList.add(`c-${one.c}`);
      commit();
    } else if (b.dataset.step && one?.t === 'item') {
      one.min = Math.max(0, minutesOf(one) + Number(b.dataset.step));
      place(one); commit();
    } else if (b.hasAttribute('data-reset') && one?.t === 'item') {
      delete one.min; place(one); commit();
    } else if (b.hasAttribute('data-wrap')) wrap(chosen.filter((n) => n.t !== 'frame'));
    else if (b.hasAttribute('data-unpin') && one?.t === 'frame') {
      delete one.at; commit(); renderBar();
    } else if (b.hasAttribute('data-tidy') && one?.t === 'frame') tidy(one);
    else if (b.hasAttribute('data-edit') && one) startEdit(one.id);
    else if (b.hasAttribute('data-dup')) duplicate();
    else if (b.hasAttribute('data-del')) remove();
  });

  bar.addEventListener('change', (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>('[data-at]');
    const one = nodes.find((n) => sel.has(n.id));
    if (!input || one?.t !== 'frame') return;
    if (input.value) one.at = input.value; else delete one.at;
    commit();
  });
  bar.addEventListener('focusout', () => requestAnimationFrame(() => { if (!bar.contains(document.activeElement)) renderBar(); }));
  bar.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLElement).blur(); });

  // ── Operations ───────────────────────────────────────────────────────────
  function add(n: BNode, opts: { select?: boolean; edit?: boolean } = {}) {
    nodes.push(n);
    draw(n);
    if (opts.select !== false) { selectOnly(n.id); }
    commit();
    if (opts.edit) startEdit(n.id);
    return n;
  }
  function selectOnly(id: string | null) {
    const before = [...sel];
    sel.clear(); if (id) sel.add(id);
    [...before, ...(id ? [id] : [])].forEach((x) => { const n = nodes.find((m) => m.id === x); if (n) place(n); });
    renderBar();
  }
  /** Pieces the box touches are selected. A frame only when the box takes in all of it,
   *  so a box drawn inside a frame picks its cards, not the frame. */
  function boxSelect(x0: number, y0: number, x1: number, y1: number, base: Set<string>) {
    sel.clear(); base.forEach((id) => sel.add(id));
    for (const n of nodes) {
      const s = size(n);
      const hit = n.t === 'frame'
        ? n.x >= x0 && n.y >= y0 && n.x + s.w <= x1 && n.y + s.h <= y1
        : n.x < x1 && n.x + s.w > x0 && n.y < y1 && n.y + s.h > y0;
      if (hit) sel.add(n.id);
    }
    els.forEach((el, id) => el.classList.toggle('sel', sel.has(id)));
  }
  /** Dragging the wall used to move around it. Say once what it does now, and how to move around. */
  function tipOnce() {
    if (store.get('prism.board.tip', false)) return;
    store.set('prism.board.tip', true);
    toast('Drag across the wall to select several. Shift-click adds one. To move around, scroll or hold space.', false, 6000);
  }
  function toggleSel(id: string) {
    sel.has(id) ? sel.delete(id) : sel.add(id);
    const n = nodes.find((m) => m.id === id); if (n) place(n);
    renderBar();
  }
  function remove() {
    if (!sel.size) return;
    const n = sel.size;
    nodes = nodes.filter((x) => !sel.has(x.id));
    sel.forEach((id) => { els.get(id)?.remove(); els.delete(id); });
    sel.clear();
    commit();
    toast(`Deleted ${n === 1 ? 'one piece' : `${n} pieces`}`, true);
  }
  const copyOf = (n: BNode, dx: number, dy: number): BNode => {
    const c = { ...structuredClone(n), id: uid(), x: n.x + dx, y: n.y + dy };
    if (c.t === 'frame') delete c.at; // a copy follows on; it doesn't share the original's fixed time
    return c;
  };
  function duplicate() {
    const chosen = nodes.filter((n) => sel.has(n.id));
    if (chosen.length === 1 && chosen[0].t === 'frame') { insertAfter(chosen[0]); return; }
    const all = new Set(chosen);
    chosen.forEach((n) => { if (n.t === 'frame') inside(n).forEach((x) => all.add(x)); });
    const copies = [...all].map((n) => copyOf(n, 24, 24));
    if (!copies.length) return;
    sel.forEach((id) => { sel.delete(id); const n = nodes.find((m) => m.id === id); if (n) place(n); });
    copies.forEach((c) => { nodes.push(c); draw(c); sel.add(c.id); place(c); });
    commit();
  }
  /** Duplicating one frame adds the copy as the next block: everything to its right in the row
   *  moves along to make room, and the times after it shift by the copy's length. */
  function insertAfter(f: FrameNode) {
    const shift = f.w + 40;
    const kids = inside(f);
    const row = rows().find((r) => r.includes(f)) ?? [f];
    const movers = new Set<BNode>();
    for (const n of row) if (n !== f && n.x > f.x) { movers.add(n); if (n.t === 'frame') inside(n).forEach((x) => movers.add(x)); }
    movers.forEach((n) => { n.x += shift; place(n); });
    const copy = copyOf(f, shift, 0) as FrameNode;
    const made = [copy, ...kids.map((k) => copyOf(k, shift, 0))];
    made.forEach((n) => { nodes.push(n); draw(n); });
    selectOnly(copy.id);
    commit();
    toast(movers.size ? 'Added a copy as the next block. Everything after it moved along.' : 'Added a copy as the next block.');
  }
  /** A new frame around the selected pieces: the quickest way from loose cards to a block. */
  function wrap(list: BNode[]) {
    if (!list.length) return;
    const b = bounds(list);
    const f: FrameNode = { id: uid(), t: 'frame', x: snap(b.x - 20), y: snap(b.y - 64), w: snap(b.w + 40), h: snap(b.h + 84), text: 'New block' };
    nodes.push(f); draw(f);
    selectOnly(f.id);
    commit();
    startEdit(f.id);
  }
  function tidy(f: FrameNode) {
    const inn = inside(f).sort((a, b) => a.y - b.y || a.x - b.x);
    let y = f.y + 56;
    for (const n of inn) { n.x = f.x + 16; n.y = y; place(n); y += snap(size(n).h + 12); }
    f.h = Math.max(160, y - f.y + 8);
    if (inn.length) f.w = Math.max(f.w, Math.max(...inn.map((n) => size(n).w)) + 32);
    place(f); commit();
  }
  function bringToFront(n: BNode) {
    nodes = [...nodes.filter((x) => x !== n), n];
    const el = els.get(n.id); if (el) (n.t === 'frame' ? framesLayer : nodesLayer).append(el);
  }

  // ── Editing text ─────────────────────────────────────────────────────────
  function startEdit(id: string) {
    const n = nodes.find((x) => x.id === id);
    const el = els.get(id);
    if (!n || !el || n.t === 'item') return;
    const t = $('[data-text]', el);
    editing = id;
    t.contentEditable = 'plaintext-only';
    if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true';
    el.classList.add('editing');
    t.focus();
    const range = document.createRange(); range.selectNodeContents(t);
    const s = getSelection(); s?.removeAllRanges(); s?.addRange(range);
    bar.hidden = true;
  }
  function endEdit() {
    if (!editing) return;
    const n = nodes.find((x) => x.id === editing);
    const el = els.get(editing);
    editing = null;
    if (!n || !el || n.t === 'item') return;
    const t = $('[data-text]', el);
    t.contentEditable = 'false';
    el.classList.remove('editing');
    n.text = (t.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
    if (n.t === 'frame') { n.text ||= 'Untitled frame'; t.textContent = n.text; el.setAttribute('aria-label', `Frame: ${n.text}`); }
    commit();
  }
  world.addEventListener('focusout', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-text]') && editing) endEdit();
  });
  world.addEventListener('keydown', (e) => {
    if (!editing) return;
    const n = nodes.find((x) => x.id === editing);
    if (e.key === 'Escape' || (e.key === 'Enter' && (n?.t === 'frame' || n?.t === 'text' || e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      const el = els.get(editing)!;
      endEdit(); el.focus();
    }
    e.stopPropagation();
  });
  world.addEventListener('input', () => {
    if (!editing) return;
    const n = nodes.find((x) => x.id === editing);
    const el = els.get(editing);
    if (n && el && n.t === 'note') { n.text = $('[data-text]', el).innerText; afterChange(); bar.hidden = true; }
  });

  // ── Pointer: nodes, frames, resize, pan, pinch ───────────────────────────
  type Drag =
    | { mode: 'move'; sx: number; sy: number; moved: boolean; start: Map<BNode, { x: number; y: number }>; hit: BNode }
    | { mode: 'resize'; sx: number; sy: number; n: NoteNode | FrameNode; w: number; h: number }
    | { mode: 'pan'; sx: number; sy: number; vx: number; vy: number; moved: boolean; tap: boolean }
    | { mode: 'box'; sx: number; sy: number; moved: boolean; base: Set<string> };
  const boxEl = document.createElement('div');
  boxEl.className = 'marquee';
  boxEl.hidden = true;
  stage.append(boxEl);
  let drag: Drag | null = null;
  let spaceDown = false;
  const touches = new Map<number, { x: number; y: number }>();
  let pinch: { d: number; z: number } | null = null;

  stage.addEventListener('pointerdown', (e) => {
    if (e.button === 2) return;
    const t = e.target as HTMLElement;
    // Only the wall and what's on it. Floating controls keep their own clicks.
    if (t !== stage && !world.contains(t)) return;
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) {
        const [a, b] = [...touches.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: view.z };
        drag = null;
        return;
      }
    }
    const nodeEl = t.closest<HTMLElement>('.n');
    const n = nodeEl ? nodes.find((x) => x.id === nodeEl.dataset.id) : undefined;
    if (n && editing === n.id) return; // typing: let the caret work
    if (editing) endEdit();
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    // Space or the middle button pans from anywhere, over cards too.
    if (spaceDown || e.button === 1) {
      e.preventDefault();
      drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false, tap: false };
      stage.classList.add('panning');
      stage.setPointerCapture(e.pointerId);
      return;
    }
    // A frame's body is wall: dragging there selects what's inside. Its title bar and grip move and resize it.
    const frameBody = n?.t === 'frame' && !t.closest('[data-handle]') && !t.closest('[data-resize]');
    if (!n || frameBody) {
      e.preventDefault(); // no text selection
      stage.focus({ preventScroll: true });
      if (e.pointerType === 'touch') {
        // One finger on the wall moves around; a tap clears the selection.
        drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false, tap: true };
        stage.classList.add('panning');
      } else {
        // Mouse and pen draw a selection box. Shift (or ⌘) adds to what's already selected.
        if (!additive) selectOnly(null);
        drag = { mode: 'box', sx: e.clientX, sy: e.clientY, moved: false, base: new Set(sel) };
      }
      stage.setPointerCapture(e.pointerId);
      return;
    }
    e.preventDefault();
    if (t.closest('[data-resize]') && (n.t === 'note' || n.t === 'frame')) {
      selectOnly(n.id);
      drag = { mode: 'resize', sx: e.clientX, sy: e.clientY, n, w: n.w, h: n.h };
      stage.setPointerCapture(e.pointerId);
      return;
    }
    if (additive) { toggleSel(n.id); if (!sel.has(n.id)) return; }
    else if (!sel.has(n.id)) selectOnly(n.id);
    tipOnce();
    nodeEl!.focus({ preventScroll: true });
    // Moving a frame carries what's inside it.
    const moving = new Set<BNode>(nodes.filter((x) => sel.has(x.id)));
    for (const f of [...moving]) if (f.t === 'frame') inside(f).forEach((x) => moving.add(x));
    drag = { mode: 'move', sx: e.clientX, sy: e.clientY, moved: false, hit: n, start: new Map([...moving].map((x) => [x, { x: x.x, y: x.y }])) };
    stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', (e) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && touches.size === 2) {
      const [a, b] = [...touches.values()];
      zoomAt(pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (drag.mode === 'pan') {
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      view.x = drag.vx + dx; view.y = drag.vy + dy; applyView();
    } else if (drag.mode === 'box') {
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!drag.moved) { drag.moved = true; boxEl.hidden = false; bar.hidden = true; root.classList.add('boxing'); }
      const sr = stage.getBoundingClientRect();
      const l = Math.min(e.clientX, drag.sx), tp = Math.min(e.clientY, drag.sy);
      const w = Math.abs(dx), h = Math.abs(dy);
      boxEl.style.transform = `translate(${l - sr.left}px, ${tp - sr.top}px)`;
      boxEl.style.width = `${w}px`; boxEl.style.height = `${h}px`;
      const a = toWorld(l, tp), b = toWorld(l + w, tp + h);
      boxSelect(a.x, a.y, b.x, b.y, drag.base);
    } else if (drag.mode === 'move') {
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!drag.moved) { drag.moved = true; drag.start.forEach((_, n) => bringToFront(n)); bar.hidden = true; root.classList.add('dragging'); }
      drag.start.forEach((p, n) => { n.x = snap(p.x + dx / view.z); n.y = snap(p.y + dy / view.z); place(n); });
    } else {
      const n = drag.n;
      const minW = n.t === 'frame' ? 200 : 120, minH = n.t === 'frame' ? 140 : 96;
      n.w = Math.max(minW, snap(drag.w + dx / view.z)); n.h = Math.max(minH, snap(drag.h + dy / view.z));
      place(n);
    }
  });

  const endPointer = (e: PointerEvent) => {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinch = null;
    if (!drag) return;
    const d = drag; drag = null;
    stage.classList.remove('panning');
    root.classList.remove('dragging');
    if (d.mode === 'pan') { if (d.tap && !d.moved) selectOnly(null); save(); return; }
    if (d.mode === 'box') { boxEl.hidden = true; root.classList.remove('boxing'); renderBar(); tipOnce(); return; }
    if (d.mode === 'move' && !d.moved) {
      // A plain click on one of several selected pieces picks just that one.
      if (sel.size > 1 && !(e.shiftKey || e.metaKey || e.ctrlKey)) selectOnly(d.hit.id);
      return;
    }
    commit();
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('dblclick', (e) => {
    const t = e.target as HTMLElement;
    if (t !== stage && !world.contains(t)) return;
    const nodeEl = t.closest<HTMLElement>('.n');
    const n = nodeEl ? nodes.find((x) => x.id === nodeEl.dataset.id) : undefined;
    // Double-click a note, heading or frame title to type in it.
    if (n && n.t !== 'item' && (n.t !== 'frame' || t.closest('[data-handle]'))) { if (editing !== n.id) startEdit(n.id); return; }
    if (n && n.t !== 'frame') return;
    // Double-click the wall (or inside a frame) for a sticky note.
    const w = toWorld(e.clientX, e.clientY);
    add({ id: uid(), t: 'note', x: snap(w.x - 90), y: snap(w.y - 90), w: 184, h: 184, text: '', c: 'yellow' }, { edit: true });
  });

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) zoomAt(view.z * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    else { view.x -= e.deltaX; view.y -= e.deltaY; applyView(); }
  }, { passive: false });

  // ── Keyboard ─────────────────────────────────────────────────────────────
  const typingInField = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    return t.matches('input, textarea, select') || t.isContentEditable;
  };
  window.addEventListener('keydown', (e) => {
    // Hold space to pan from anywhere, over cards too.
    if (e.code === 'Space' && !typingInField(e) && !editing) {
      spaceDown = true; stage.classList.add('grab');
      if (stage.contains(document.activeElement) || document.activeElement === document.body) e.preventDefault();
    }
    if (typingInField(e) || editing) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(); return; }
    if (mod && e.key.toLowerCase() === 'a' && stage.contains(document.activeElement)) {
      e.preventDefault(); nodes.forEach((n) => sel.add(n.id)); nodes.forEach(place); renderBar(); return;
    }
    if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomAt(view.z * 1.2); return; }
    if (mod && e.key === '-') { e.preventDefault(); zoomAt(view.z / 1.2); return; }
    if (e.shiftKey && e.key === '1') { fit(); return; }
    if (!stage.contains(document.activeElement) && document.activeElement !== document.body) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel.size) { e.preventDefault(); remove(); return; }
    if (e.key === 'Escape') { selectOnly(null); return; }
    if (e.key === 'Enter' && sel.size === 1) { e.preventDefault(); startEdit([...sel][0]); return; }
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (arrows[e.key] && sel.size) {
      e.preventDefault();
      const step = e.shiftKey ? GRID * 5 : GRID;
      const moving = new Set<BNode>(nodes.filter((x) => sel.has(x.id)));
      for (const f of [...moving]) if (f.t === 'frame') inside(f).forEach((x) => moving.add(x));
      moving.forEach((n) => { n.x += arrows[e.key][0] * step; n.y += arrows[e.key][1] * step; place(n); });
      placeBar(); commit();
    }
  });
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') { spaceDown = false; stage.classList.remove('grab'); } });
  // Keyboard users: focusing a node selects it.
  world.addEventListener('focusin', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.n');
    if (el && !sel.has(el.dataset.id!) && !drag) selectOnly(el.dataset.id!);
  });

  // ── Library ──────────────────────────────────────────────────────────────
  let libKind: PieceKind | 'all' | 'pinned' = 'all';
  function pinned() { return store.get<string[]>(PIN_KEY, []).map((id) => find(id)).filter(Boolean).map((i) => slugOf(i!)); }
  function renderLib() {
    const q = search.value.trim().toLowerCase();
    const ph = phaseSel.value;
    const pins = new Set(pinned());
    $$('[data-lib-kind]', lib).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.libKind === libKind)));
    const pinTab = $('[data-lib-kind="pinned"]', lib);
    pinTab.hidden = !pins.size;
    pinTab.querySelector('span')!.textContent = String(pins.size);
    if (libKind === 'pinned' && !pins.size) libKind = 'all';
    const shown = pieces
      .filter((p) => (libKind === 'all' ? true : libKind === 'pinned' ? pins.has(p.ref) : p.kind === libKind))
      .filter((p) => !ph || p.phase === ph)
      .filter((p) => !q || q.split(/\s+/).every((w) => p.search.includes(w)))
      .sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind) || phaseOrder.indexOf(a.phase ?? 'kickoff') - phaseOrder.indexOf(b.phase ?? 'kickoff'));
    let html = '', group = '';
    for (const p of shown) {
      const g = pieceKindLabel[p.kind];
      if (g !== group) { group = g; html += `<li class="lib-h" aria-hidden="true">${p.kind === 'case' ? 'Case studies' : p.kind === 'kit' ? 'Kit files & cards' : `${g === 'Activity' ? 'Activities' : `${g}s`}`}</li>`; }
      html += `<li><button class="piece k-${p.kind}" data-ref="${p.ref}" title="${esc(p.summary)}">
        <span class="pc-media">${p.image ? `<img src="${base}img/${p.image}" alt="" draggable="false" loading="lazy" />` : ''}</span>
        <span class="pc-body"><span class="pc-title">${esc(p.title)}</span><span class="pc-meta">${esc(p.meta)}${p.minutes ? ` · ${p.minutes} min` : ''}</span></span>
        <span class="pc-on" aria-label="On the wall">●</span>
      </button></li>`;
    }
    list.innerHTML = html || '<li class="lib-none">Nothing matches. Try fewer words.</li>';
    $('[data-lib-count]', lib).textContent = `${shown.length} of ${pieces.length}`;
    markOnBoard();
  }
  function markOnBoard() {
    const on = new Set(nodes.filter((n): n is ItemNode => n.t === 'item').map((n) => n.ref));
    $$<HTMLElement>('.piece', list).forEach((b) => b.classList.toggle('on', on.has(b.dataset.ref!)));
  }
  $$('[data-lib-kind]', lib).forEach((b) => b.addEventListener('click', () => { libKind = b.dataset.libKind as typeof libKind; renderLib(); }));
  search.addEventListener('input', renderLib);
  phaseSel.addEventListener('change', renderLib);

  let cascade = 0;
  function addPiece(ref: string, at?: { x: number; y: number }) {
    const c = at ?? centre();
    const off = at ? 0 : (cascade++ % 6) * 20;
    add({ id: uid(), t: 'item', ref, x: snap(c.x - CARD_W / 2 + off), y: snap(c.y - 40 + off) });
    if (!at) { const el = els.get(nodes[nodes.length - 1].id); el?.classList.add('pop'); }
  }

  // Drag from the drawer onto the wall. Touch scrolls the list, so touch adds on tap.
  let ghost: HTMLElement | null = null;
  let libDrag: { ref: string; sx: number; sy: number; id: number; moved: boolean } | null = null;
  list.addEventListener('pointerdown', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.piece');
    if (!b || e.pointerType === 'touch' || e.button !== 0) return;
    libDrag = { ref: b.dataset.ref!, sx: e.clientX, sy: e.clientY, id: e.pointerId, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!libDrag || e.pointerId !== libDrag.id) return;
    if (!libDrag.moved && Math.hypot(e.clientX - libDrag.sx, e.clientY - libDrag.sy) < 5) return;
    if (!libDrag.moved) {
      libDrag.moved = true;
      const p = pieceByRef.get(libDrag.ref)!;
      ghost = document.createElement('div');
      ghost.className = `n n-item ghost k-${p.kind}`;
      ghost.innerHTML = `<div class="ni-media">${p.image ? `<img src="${base}img/${p.image}" alt="" />` : ''}</div><div class="ni-body"><span class="ni-meta">${esc(p.meta)}</span><strong class="ni-title">${esc(p.title)}</strong></div>`;
      document.body.append(ghost);
      root.classList.add('dropping');
    }
    const z = view.z;
    ghost!.style.transform = `translate(${e.clientX - (CARD_W / 2) * z}px, ${e.clientY - 30 * z}px) scale(${z})`;
    const over = stage.contains(document.elementFromPoint(e.clientX, e.clientY));
    ghost!.classList.toggle('off', !over);
  });
  window.addEventListener('pointerup', (e) => {
    if (!libDrag || e.pointerId !== libDrag.id) return;
    const d = libDrag; libDrag = null;
    ghost?.remove(); ghost = null;
    root.classList.remove('dropping');
    if (!d.moved) return; // a plain click is handled by the click event
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    if (!stage.contains(hit) || hit?.closest('[data-lib]')) return;
    const w = toWorld(e.clientX, e.clientY);
    addPiece(d.ref, { x: w.x, y: w.y - 10 });
    suppressClick = true;
  });
  let suppressClick = false;
  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.piece');
    if (!b) return;
    if (suppressClick) { suppressClick = false; return; }
    addPiece(b.dataset.ref!);
    if (narrow()) setLib(false);
  });

  const libBtn = $<HTMLButtonElement>('[data-lib-toggle]', root);
  const narrow = () => matchMedia('(max-width: 760px)').matches;
  /** The drawer remembers a choice made on a wide screen. On a phone it starts closed and forgets. */
  function setLib(open: boolean) {
    root.classList.toggle('lib-closed', !open);
    libBtn.setAttribute('aria-expanded', String(open));
    if (!narrow()) store.set('prism.board.lib', open);
  }
  libBtn.addEventListener('click', () => setLib(root.classList.contains('lib-closed')));
  $('[data-lib-close]', lib).addEventListener('click', () => setLib(false));
  setLib(narrow() ? false : store.get('prism.board.lib', true));

  // ── Toolbar ──────────────────────────────────────────────────────────────
  $('[data-add-note]', root).addEventListener('click', () => {
    const c = centre();
    add({ id: uid(), t: 'note', x: snap(c.x - 92 + (cascade++ % 6) * 20), y: snap(c.y - 92), w: 184, h: 184, text: '', c: 'yellow' }, { edit: true });
  });
  $('[data-add-frame]', root).addEventListener('click', () => {
    const c = centre();
    add({ id: uid(), t: 'frame', x: snap(c.x - 160), y: snap(c.y - 200), w: 320, h: 400, text: 'New frame' }, { edit: true });
  });
  $('[data-add-text]', root).addEventListener('click', () => {
    const c = centre();
    add({ id: uid(), t: 'text', x: snap(c.x - 200), y: snap(c.y - 30), w: 400, text: 'Heading' }, { edit: true });
  });
  $('[data-undo]', root).addEventListener('click', undo);
  $('[data-redo]', root).addEventListener('click', redo);
  $('[data-zoom-in]', root).addEventListener('click', () => zoomAt(view.z * 1.2));
  $('[data-zoom-out]', root).addEventListener('click', () => zoomAt(view.z / 1.2));
  $('[data-fit]', root).addEventListener('click', () => fit());

  // Menus: one open at a time, closed by a click elsewhere or Escape.
  $$<HTMLButtonElement>('[data-menu-btn]', root).forEach((b) => {
    const menu = $(`[data-menu="${b.dataset.menuBtn}"]`, root);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.hidden;
      $$('[data-menu]', root).forEach((m) => { m.hidden = true; });
      $$('[data-menu-btn]', root).forEach((x) => x.setAttribute('aria-expanded', 'false'));
      menu.hidden = !open; b.setAttribute('aria-expanded', String(open));
      if (open) refreshStarts();
    });
  });
  const closeMenus = () => { $$('[data-menu]', root).forEach((m) => { m.hidden = true; }); $$('[data-menu-btn]', root).forEach((x) => x.setAttribute('aria-expanded', 'false')); };
  document.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('[data-menu]')) closeMenus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });

  // ── Starting points ──────────────────────────────────────────────────────
  const copilotAnswers = () => store.get<{ a: Answers } | null>(COPILOT_KEY, null)?.a;
  function refreshStarts() {
    const hasPlan = !!copilotAnswers();
    const pins = pinned().length;
    $$<HTMLButtonElement>('[data-start="copilot"]', root).forEach((b) => {
      b.disabled = !hasPlan;
      const s = b.querySelector('small'); if (s) s.textContent = hasPlan ? 'Every block as a frame, in running order. Breaks as notes.' : 'Plan something in the copilot first.';
    });
    $$<HTMLButtonElement>('[data-start="pins"]', root).forEach((b) => {
      b.disabled = !pins;
      const s = b.querySelector('small'); if (s) s.textContent = pins ? `The ${pins} ${pins === 1 ? 'piece' : 'pieces'} you added from the catalog.` : 'Use “Add to my plan” on any catalog page.';
    });
  }

  type Entry = { ref: string; min?: number } | { note: string; c?: NoteColour };
  type Column = { frame: string; at?: string; entries: Entry[] } | { note: string; c: NoteColour };
  /** Rows of frames, left to right, placed to the right of what's already on the wall.
   *  Each piece is drawn as it's placed so its real height sets the next one's position. */
  function layout(rows: { heading: string; columns: Column[] }[], label: string) {
    const made: BNode[] = [];
    const put = (n: BNode) => { nodes.push(n); made.push(n); draw(n); return n; };
    const x0 = freeX();
    let y = 0;
    for (const row of rows) {
      put({ id: uid(), t: 'text', x: x0, y, w: 720, text: row.heading });
      y += 88;
      let x = x0, tallest = 0;
      for (const col of row.columns) {
        if ('note' in col) {
          put({ id: uid(), t: 'note', x, y, w: 160, h: 128, text: col.note, c: col.c });
          x += 184; tallest = Math.max(tallest, 128); continue;
        }
        const f = put({ id: uid(), t: 'frame', x, y, w: CARD_W + 40, h: 200, text: col.frame, ...(col.at ? { at: col.at } : {}) }) as FrameNode;
        let cy = y + 56;
        for (const e of col.entries) {
          const n = 'ref' in e
            ? put({ id: uid(), t: 'item', ref: e.ref, x: x + 20, y: cy, ...(e.min !== undefined ? { min: e.min } : {}) })
            : put({ id: uid(), t: 'note', x: x + 20, y: cy, w: CARD_W, h: 96, text: e.note, c: e.c ?? 'white' });
          cy += snap(size(n).h + 12);
        }
        f.h = Math.max(200, cy - y + 8); place(f);
        x += f.w + 40; tallest = Math.max(tallest, f.h);
      }
      y += tallest + 160;
    }
    sel.clear();
    commit();
    fit(made);
    toast(label);
  }

  function startDiamond() {
    layout([{
      heading: 'The Double Diamond, as the deck runs it',
      columns: phases.map((p) => ({ frame: p.name, entries: p.how.map((id) => find(id)).filter(Boolean).map((i) => ({ ref: slugOf(i!) })) })),
    }], 'Laid out the Double Diamond. Swap anything.');
  }
  function startCopilot() {
    const a = copilotAnswers();
    if (!a) return;
    startPlan({ ...defaults, ...a }, 'from the copilot');
  }
  /** Lay out a whole agenda: every block a frame, breaks and lunch as notes. */
  function startPlan(answers: Answers, from: string) {
    const plan = buildPlan(answers);
    layout(plan.days.map((day, d) => ({
      heading: plan.days.length > 1 ? `${answers.name} · Day ${d + 1}` : answers.name,
      // Only the day's first block gets a fixed time. The rest follow on, so they move when you edit.
      columns: day.map((b, i): Column => {
        if (b.kind === 'break' || b.kind === 'lunch') return { note: `${b.title}\n${b.minutes} min`, c: b.kind === 'lunch' ? 'pink' : 'yellow' };
        return {
          frame: b.title,
          at: i === 0 && b.start !== undefined ? fmtClock(b.start) : undefined,
          entries: b.parts.map((p): Entry => {
            const it = p.item ? find(p.item) : undefined;
            return it ? { ref: slugOf(it), min: p.minutes } : { note: `${p.label}\n${p.minutes} min`, c: p.type === 'cases' ? 'lilac' : 'white' };
          }),
        };
      }),
    })), `Brought in “${answers.name}” ${from}.`);
  }
  function startPins() {
    const refs = pinned();
    if (!refs.length) return;
    const x0 = freeX();
    const made: BNode[] = refs.map((ref, i) => ({ id: uid(), t: 'item', ref, x: x0 + (i % 4) * (CARD_W + 24), y: Math.floor(i / 4) * 120 }));
    nodes.push(...made); made.forEach(draw); sel.clear(); commit();
    fit(made); toast('Put your pinned pieces on the wall.');
  }
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-start]');
    if (!b || b.disabled) return;
    closeMenus();
    const kind = b.dataset.start;
    if (kind === 'diamond') startDiamond();
    else if (kind === 'copilot') startCopilot();
    else if (kind === 'formula-day' || kind === 'formula-two') startPlan(formulaAnswers(kind === 'formula-day' ? 'day' : 'two'), 'as the formula has it');
    else if (kind === 'pins') startPins();
    else if (kind === 'blank') { blankStart = true; afterChange(); if (root.classList.contains('lib-closed')) setLib(true); search.focus(); }
  });

  // ── More: copy as a list, save and open a copy, clear ────────────────────
  function asText() {
    const times = timeline();
    const clock = (n: BNode) => { const t = times.get(n.id); return t ? `${fmtClock(t.start)} ` : ''; };
    const label = (n: BNode) => {
      if (n.t === 'item') { const p = pieceByRef.get(n.ref); const m = minutesOf(n); return `- ${[p?.title ?? 'Missing piece', p?.meta, m ? `${m} min` : ''].filter(Boolean).join(' · ')}`; }
      return n.t === 'note' && n.text.trim() ? `- ${n.text.trim().replace(/\n+/g, ' · ')}` : '';
    };
    const used = new Set<BNode>();
    const out: string[] = [];
    const ordered = rows().sort((a, b) => Math.min(...a.map((n) => n.y)) - Math.min(...b.map((n) => n.y)));
    for (const row of ordered) for (const n of row) {
      used.add(n);
      if (n.t !== 'frame') { out.push(`${clock(n)}${n.t === 'note' ? n.text.trim().replace(/\n+/g, ' · ') : label(n).slice(2)}`, ''); continue; }
      const inn = inside(n).sort((a, b) => a.y - b.y || a.x - b.x);
      inn.forEach((x) => used.add(x));
      const m = frameMinutes(n);
      out.push(`${clock(n)}${n.text}${m ? ` (${fmtMin(m)})` : ''}`, ...inn.map(label).filter(Boolean), '');
    }
    const frames = nodes.filter((n) => n.t === 'frame');
    const loose = nodes.filter((n) => n.t !== 'frame' && !used.has(n) && n.t !== 'text').sort((a, b) => a.y - b.y || a.x - b.x);
    const looseLines = loose.map(label).filter(Boolean);
    if (looseLines.length) out.push(frames.length ? 'Not in a frame' : 'On the wall', ...looseLines);
    return out.join('\n').trim();
  }
  root.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-more]');
    if (!b) return;
    closeMenus();
    const what = b.dataset.more;
    if (what === 'copy') {
      if (!nodes.length) { toast('Nothing to copy yet.'); return; }
      const text = asText();
      try { await navigator.clipboard.writeText(text); toast('Copied the wall as a list, frame by frame.'); }
      catch {
        // Clipboard blocked: show the list so it can be copied by hand.
        const dlg = $<HTMLDialogElement>('[data-list-dlg]', root);
        const area = $<HTMLTextAreaElement>('textarea', dlg);
        area.value = text; dlg.showModal(); area.select();
      }
    } else if (what === 'save') {
      const blob = new Blob([JSON.stringify({ prism: 'board', v: VERSION, nodes }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'prism-plan.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Saved a copy. Send it to your co-facilitator.');
    } else if (what === 'open') {
      $<HTMLInputElement>('[data-file]', root).click();
    } else if (what === 'clear') {
      if (!nodes.length) return;
      nodes = []; sel.clear(); rebuild(); commit();
      toast('Cleared the wall.', true);
    }
  });
  $<HTMLInputElement>('[data-file]', root).addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data?.prism !== 'board' || !Array.isArray(data.nodes)) throw new Error('not a board');
      const clean = (data.nodes as BNode[]).filter((n) => n && typeof n.id === 'string' && ['item', 'note', 'frame', 'text'].includes(n.t) && Number.isFinite(n.x) && Number.isFinite(n.y));
      nodes = (data.v ?? 1) < VERSION ? migrate(clean) : clean; sel.clear(); rebuild(); commit();
      requestAnimationFrame(() => fit());
      toast(`Opened ${file.name}. Undo to go back.`, true);
    } catch { toast('That file isn’t a Prism plan.'); }
  });

  // ── Toast ────────────────────────────────────────────────────────────────
  let toastT = 0;
  function toast(msg: string, withUndo = false, ms = withUndo ? 5000 : 2600) {
    toastEl.innerHTML = `<span>${esc(msg)}</span>${withUndo ? '<button data-toast-undo>Undo</button>' : ''}`;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = window.setTimeout(() => toastEl.classList.remove('show'), ms);
  }
  toastEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-toast-undo]')) { undo(); toastEl.classList.remove('show'); }
  });

  // ── Go ───────────────────────────────────────────────────────────────────
  // Another tab may have pinned something on a catalog page.
  window.addEventListener('storage', (e) => { if (e.key === PIN_KEY) { renderLib(); refreshStarts(); } });
  window.addEventListener('resize', placeBar);
  if (saved && (saved.v ?? 1) < VERSION) { nodes = migrate(nodes); last = JSON.stringify(nodes); save(); }
  nodes.forEach(draw);
  renderLib();
  refreshStarts();
  applyView();
  afterChange();
  if (!saved) fit();

  // Arriving from the Workshop tab with ?start=day or ?start=two: lay that formula out once,
  // then drop the parameter so a reload doesn't add it again.
  const want = new URLSearchParams(location.search).get('start');
  if (want === 'day' || want === 'two') {
    history.replaceState(null, '', location.pathname);
    startPlan(formulaAnswers(want), 'from the Workshop tab');
  }
}
