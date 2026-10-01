import { store } from '../store';
import { animate } from '../chrome';
import { PIN_KEY } from '../detail';
import { find, slugOf, type Item } from '../../data/catalog';
import { phaseById } from '../../data/phases';
import {
  buildPlan, defaults, monsoonPreset, recommendPhases, recommendReason, optionsFor, pickFor, toolsFor, toolOptions,
  fmtClock, planToText, goalLabel, stageLabel, lengthLabel, teachMinutes,
  type Answers, type CorePhase, type Plan, type Block,
} from './engine';

const KEY = 'prism.copilot.v2';
const PREP_KEY = 'prism.prep';
const ORDER = ['brief', 'goal', 'stage', 'room', 'time', 'phases', 'thread', 'after'] as const;
type Q = (typeof ORDER)[number];
type Slot = Parameters<typeof pickFor>[1];

const base = (document.querySelector('link[rel=icon]') as HTMLLinkElement).getAttribute('href')!.replace(/favicon\.svg$/, '');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const href = (it: Item) => `${base}catalog/${slugOf(it)}/`;

interface Saved { a: Answers; answered: Q[]; seenPins?: string[] }

export function initCopilot() {
  const saved = store.get<Saved | null>(KEY, null);
  let a: Answers = { ...defaults, ...(saved?.a ?? {}) };
  let answered = new Set<Q>(saved?.answered ?? []);
  const seenPins = new Set<string>(saved?.seenPins ?? []);
  if (new URLSearchParams(location.search).get('preset') === 'monsoon') {
    a = structuredClone(monsoonPreset);
    answered = new Set(ORDER);
    history.replaceState(null, '', location.pathname);
  }
  let lastPassing = -1;
  const open = new Set<string>();
  const prepDone = new Set<string>(store.get(PREP_KEY, []));

  // Items pinned on catalog pages: openers, icebreakers and closers become the
  // pick for their slot; methods join that phase's tools. Each pin applies once.
  for (const id of store.get<string[]>(PIN_KEY, [])) {
    if (seenPins.has(id)) continue;
    seenPins.add(id);
    const it = find(id);
    if (!it) continue;
    const slot: Slot | undefined = it.role === 'icebreaker' ? 'kickoff' : it.role === 'closer' ? 'closer' : it.role === 'shareout' ? 'shareout'
      : it.role === 'opener' && it.phase !== 'kickoff' && it.phase !== 'close' ? (it.phase as CorePhase) : undefined;
    if (slot) a.picks[slot] = it.id;
    if (it.kind === 'method' && it.phase !== 'kickoff' && it.phase !== 'close') {
      const p = it.phase as CorePhase;
      const now = toolsFor(a, p);
      if (!now.includes(id)) a.tools[p] = [...now, id];
    }
  }

  const save = () => store.set(KEY, { a, answered: [...answered], seenPins: [...seenPins] });
  /** Phases follow the recommendation until the creator changes them by hand. */
  const followRec = () => { if (!a.phasesTouched) a.phases = recommendPhases(a); };
  const asks = (q: Q) => q !== 'stage' || a.goal !== 'learn';

  // ── Conversation ────────────────────────────────────────────────────────
  const turn = (q: string) => $(`[data-q="${q}"]`);
  const typing = $('.typing');

  const summaries: Record<Q, () => string> = {
    brief: () => a.brief ? `“${a.brief.length > 90 ? a.brief.slice(0, 88) + '…' : a.brief}”` : 'No brief yet',
    goal: () => goalLabel[a.goal],
    stage: () => stageLabel[a.stage],
    room: () => `${({ leaders: 'Leaders & executives', product: 'Product & business teams', mixed: 'Mixed room', designers: 'Designers' })[a.audience]} · ${a.people} people · ${a.leads} leads`,
    time: () => `${lengthLabel[a.length]} · ${a.format === 'remote' ? 'remote' : 'in the room'} · from ${a.start}${a.date ? ` on ${fmtDate(a.date, 0)}` : ''}`,
    phases: () => a.phases.length ? a.phases.map(cap).join(' → ') : 'No phases',
    thread: () => a.thread === 'brief' ? 'Demo on the brief itself' : `Running example: ${a.thread}`,
    after: () => a.followUp ? (a.goal === 'learn' ? 'Six-week group projects' : 'A next step with an owner') : 'A one-off',
  };

  const syncInputs = () => {
    $<HTMLInputElement>('[data-in="name"]').value = a.name;
    $<HTMLTextAreaElement>('[data-in="brief"]').value = a.brief;
    $<HTMLInputElement>('[data-in="people"]').value = String(a.people);
    $<HTMLInputElement>('[data-in="start"]').value = a.start;
    $<HTMLInputElement>('[data-in="date"]').value = a.date;
    $('[data-out="people"]').textContent = String(a.people);
    $('[data-out="tables"]').textContent = String(Math.ceil(a.people / 6));
    $('[data-out="leads"]').textContent = String(a.leads);
    $$<HTMLButtonElement>('[data-pick], [data-choose]').forEach((b) => {
      const k = (b.dataset.pick ?? b.dataset.choose) as keyof Answers;
      const v = k === 'followUp' ? (a.followUp ? 'yes' : 'no') : String(a[k]);
      const isQ = k === 'followUp' ? answered.has('after') : k === 'goal' ? answered.has('goal') : k === 'stage' ? answered.has('stage') : k === 'thread' ? answered.has('thread') : true;
      b.classList.toggle('sel', b.dataset.val === v && isQ);
    });
    $$<HTMLButtonElement>('[data-live-only]').forEach((b) => { b.hidden = a.goal === 'learn'; });
    $('[data-delight]').setAttribute('aria-pressed', String(a.phases.includes('delight')));
    $('[data-energisers]').setAttribute('aria-pressed', String(a.energisers));
    $$<SVGGElement>('[data-diamond-pick] [data-phase]').forEach((g) => {
      const on = a.phases.includes(g.dataset.phase as CorePhase);
      g.classList.toggle('on', on);
      g.setAttribute('aria-checked', String(on));
    });
    const rec = recommendReason(a);
    $('[data-rec]').textContent = rec.phases;
    $('[data-rec-why]').textContent = rec.why;
    $<HTMLButtonElement>('[data-use-rec]').hidden = !a.phasesTouched || recommendPhases(a).join() === a.phases.join();
    $('[data-phase-hint]').textContent = { session: 'In 2½ hours, one phase is the most that fits well.', half: 'In a half day, two phases is the most that fits well.', day: 'One day fits four phases, just.', two: 'Two days fits all of them.' }[a.length];
    $('[data-after-yes]').textContent = a.goal === 'learn' ? 'Six-week group projects' : 'A next step with an owner';
    $('[data-after-yes-note]').textContent = a.goal === 'learn' ? 'Problem statements, check-ins in weeks 3 and 5, a showcase.' : 'Each team names its next experiment, who owns it and when. A check-in two weeks later.';
    lintBrief();
  };

  const showTurns = (animateLast = false) => {
    let firstOpen: Q | undefined;
    ORDER.forEach((q) => {
      const t = turn(q);
      if (!asks(q)) { t.classList.remove('shown', 'answered'); return; }
      const isAnswered = answered.has(q);
      const show = isAnswered || !firstOpen;
      if (!isAnswered && !firstOpen) firstOpen = q;
      t.classList.toggle('shown', show);
      t.classList.toggle('answered', isAnswered);
      $('[data-edit]', t).textContent = summaries[q]();
    });
    const done = ORDER.every((q) => !asks(q) || answered.has(q));
    turn('done').classList.toggle('shown', done);
    if (done) renderAdvice();
    if (animateLast && firstOpen) $(`[data-q="${firstOpen}"]`).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  };

  const advance = (q: Q) => {
    answered.add(q);
    save();
    const next = ORDER.find((x) => asks(x) && !answered.has(x));
    if (next && !reduced) {
      // A beat of "typing" before the next question.
      turn(q).classList.add('answered');
      $('[data-edit]', turn(q)).textContent = summaries[q]();
      typing.classList.add('on');
      turn(q).after(typing);
      setTimeout(() => { typing.classList.remove('on'); showTurns(true); }, 480);
    } else showTurns(true);
    render();
  };

  // Brief
  const lintBrief = () => {
    const el = $('[data-lint]');
    const c = buildPlan(a).checks.find((x) => x.id === 'brief-problem')!;
    el.className = `lint ${c.status === 'pass' ? 'ok' : c.status === 'warn' ? 'warn' : ''}`;
    el.textContent = a.brief.trim() ? (c.status === 'pass' ? '✓ ' : '! ') + c.detail : '';
  };
  $<HTMLInputElement>('[data-in="name"]').addEventListener('input', (e) => { a.name = (e.target as HTMLInputElement).value || 'My Prism workshop'; save(); render(); });
  $<HTMLTextAreaElement>('[data-in="brief"]').addEventListener('input', (e) => { a.brief = (e.target as HTMLTextAreaElement).value; save(); lintBrief(); render(); });
  $('[data-sample]').addEventListener('click', () => { a.brief = monsoonPreset.brief; syncInputs(); save(); render(); });
  // "Help me write it": who / struggle to / when → one sentence.
  const build = $<HTMLButtonElement>('[data-build]');
  build.addEventListener('click', () => {
    const b = $('[data-builder]');
    b.hidden = !b.hidden;
    build.setAttribute('aria-expanded', String(!b.hidden));
    if (!b.hidden) $<HTMLInputElement>('[data-b="who"]').focus();
  });
  $$<HTMLInputElement>('[data-b]').forEach((i) => i.addEventListener('input', () => {
    const v = (k: string) => $<HTMLInputElement>(`[data-b="${k}"]`).value.trim().replace(/\.$/, '');
    const who = v('who'), need = v('need'), when = v('when');
    if (!who && !need) return;
    a.brief = `${who || 'People'} struggle to ${need || '…'}${when ? ` when ${when}` : ''}.`;
    $<HTMLTextAreaElement>('[data-in="brief"]').value = a.brief;
    save(); lintBrief(); render();
  }));

  // Room
  $<HTMLInputElement>('[data-in="people"]').addEventListener('input', (e) => {
    const before = Math.ceil(a.people / 6);
    a.people = Number((e.target as HTMLInputElement).value);
    if (a.leads === before) a.leads = Math.ceil(a.people / 6); // keep in step until the user sets it
    syncInputs(); save(); render();
  });
  $$<HTMLButtonElement>('[data-step]').forEach((b) => b.addEventListener('click', () => {
    a.leads = Math.max(0, Math.min(20, a.leads + Number(b.dataset.step)));
    syncInputs(); save(); render();
  }));
  $<HTMLInputElement>('[data-in="start"]').addEventListener('change', (e) => { a.start = (e.target as HTMLInputElement).value || '09:30'; save(); render(); });
  $<HTMLInputElement>('[data-in="date"]').addEventListener('change', (e) => { a.date = (e.target as HTMLInputElement).value; save(); render(); });

  // Options that answer a question and move on.
  $$<HTMLButtonElement>('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.pick!;
    const v = b.dataset.val!;
    if (k === 'goal') {
      a.goal = v as Answers['goal'];
      if (a.goal === 'learn') { a.stage = 'whole'; answered.add('stage'); }
      else if (a.stage === 'whole') answered.delete('stage');
      if (a.goal !== 'learn' && a.thread === 'Chai' && !answered.has('thread')) a.thread = 'brief';
      if (a.goal === 'learn' && a.thread === 'brief') a.thread = 'Chai';
      a.tools = {}; // a new goal means a new set of tools
      followRec();
    }
    if (k === 'stage') { a.stage = v as Answers['stage']; followRec(); }
    if (k === 'thread') a.thread = v;
    if (k === 'followUp') a.followUp = v === 'yes';
    syncInputs();
    advance(k === 'followUp' ? 'after' : (k as Q));
  }));
  // Options inside a question that has its own Next button.
  $$<HTMLButtonElement>('[data-choose]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.choose!;
    const v = b.dataset.val!;
    if (k === 'audience') a.audience = v as Answers['audience'];
    if (k === 'format') {
      a.format = v as Answers['format'];
      // Going remote: drop only the choices that need a room. Defaults adapt by themselves.
      if (a.format === 'remote') {
        for (const [slot, id] of Object.entries(a.picks)) if (id && find(id)?.remote === false) delete a.picks[slot as Slot];
        for (const [p, ids] of Object.entries(a.tools)) a.tools[p as CorePhase] = ids!.filter((id) => find(id, 'method')?.remote !== false);
      }
    }
    if (k === 'length') { a.length = v as Answers['length']; a.adjust = {}; followRec(); }
    syncInputs(); save(); render();
    if (answered.has('room') || answered.has('time')) showTurns();
  }));
  $('[data-thread-go]').addEventListener('click', () => {
    const v = $<HTMLInputElement>('[data-in="thread-custom"]').value.trim();
    if (v) { a.thread = v; advance('thread'); }
  });

  // Phases: the diamond is the control.
  $$<SVGGElement>('[data-diamond-pick] [data-phase]').forEach((g) => {
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'switch');
    const toggle = () => {
      const p = g.dataset.phase as CorePhase;
      a.phases = a.phases.includes(p) ? a.phases.filter((x) => x !== p) : [...a.phases, p];
      a.phasesTouched = true;
      syncInputs(); save(); render();
      if (answered.has('phases')) $('[data-edit]', turn('phases')).textContent = summaries.phases();
    };
    g.addEventListener('click', toggle);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  $('[data-diamond-pick] [data-diamond]').classList.add('drawn');
  $('[data-delight]').addEventListener('click', () => {
    a.phases = a.phases.includes('delight') ? a.phases.filter((x) => x !== 'delight') : [...a.phases, 'delight'];
    a.phasesTouched = true;
    syncInputs(); save(); render();
  });
  $('[data-use-rec]').addEventListener('click', () => { a.phasesTouched = false; followRec(); syncInputs(); save(); render(); });
  $('[data-energisers]').addEventListener('click', () => { a.energisers = !a.energisers; syncInputs(); save(); render(); });

  // Next buttons and edit
  $$<HTMLButtonElement>('[data-next]').forEach((b) => b.addEventListener('click', () => advance(b.closest<HTMLElement>('[data-q]')!.dataset.q as Q)));
  $$<HTMLButtonElement>('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    const q = b.closest<HTMLElement>('[data-q]')!.dataset.q as Q;
    answered.delete(q);
    save(); syncInputs(); showTurns();
    $('.ans', turn(q)).querySelector<HTMLElement>('input, textarea, button')?.focus();
  }));

  $('[data-preset]').addEventListener('click', () => {
    a = structuredClone(monsoonPreset);
    answered = new Set(ORDER);
    save(); syncInputs(); showTurns(); render();
    toast('Loaded the Monsoon Edition. Change anything.');
  });
  $('[data-reset]').addEventListener('click', () => {
    a = structuredClone(defaults);
    answered = new Set();
    store.del(KEY); syncInputs(); showTurns(); render();
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  // ── Advice: the copilot's suggestions, each with a one-tap fix ──────────
  function renderAdvice() {
    const plan = buildPlan(a);
    const tips: { text: string; fix?: { label: string; run: () => void } }[] = [];
    const c = (id: string) => plan.checks.find((x) => x.id === id);
    const bad = (id: string) => { const x = c(id); return x && x.status !== 'pass' ? x : undefined; };
    const phaseNamed = (title: string) => plan.days.flat().filter((b) => b.kind === 'phase' && title.includes(b.title)).map((b) => b.phase as CorePhase);

    let x;
    if ((x = bad('fits'))) {
      if (a.phasesTouched && recommendPhases(a).join() !== a.phases.join()) tips.push({ text: x.detail, fix: { label: 'Use my recommended phases', run: () => { a.phasesTouched = false; followRec(); } } });
      else if (a.length !== 'two') tips.push({ text: x.detail, fix: { label: 'Give it more time', run: () => { a.length = a.length === 'session' ? 'half' : a.length === 'half' ? 'day' : 'two'; followRec(); } } });
      else tips.push({ text: x.detail });
    }
    if ((x = bad('leads'))) tips.push({ text: x.detail, fix: { label: `Set leads to ${plan.tables}`, run: () => { a.leads = plan.tables; } } });
    for (const id of ['practice-time', 'theory-chunks']) {
      if (!(x = bad(id))) continue;
      const ps = phaseNamed(x.detail);
      tips.push({ text: x.detail, fix: ps.length ? { label: `Teach one tool fewer in ${ps.map((p) => phaseById[p].short).join(' & ')}`, run: () => { ps.forEach((p) => { a.tools[p] = toolsFor(a, p).slice(0, -1); }); } } : undefined });
    }
    if ((x = bad('real-users'))) {
      const p: CorePhase | undefined = a.phases.includes('discover') ? 'discover' : a.phases.includes('prototype') ? 'prototype' : undefined;
      const tool = p === 'discover' ? (a.format === 'room' ? 'intercepts' : 'user-interviews') : 'think-aloud';
      tips.push({ text: x.detail, fix: p ? { label: `Add ${find(tool, 'method')!.title.split(':')[0]}`, run: () => { a.tools[p] = [...toolsFor(a, p), tool]; } } : undefined });
    }
    if ((x = bad('converge'))) {
      const ideate = a.phases.includes('ideate');
      tips.push({ text: x.detail, fix: { label: ideate ? 'Add the prioritisation matrix' : 'Add assumption mapping', run: () => {
        const p: CorePhase = ideate ? 'ideate' : 'discover';
        a.tools[p] = [...toolsFor(a, p), ideate ? 'prioritisation-matrix' : 'assumption-map'];
      } } });
    }
    if ((x = bad('remote-fit'))) tips.push({ text: x.detail, fix: a.length === 'day' || a.length === 'two'
      ? { label: 'Make it a half day', run: () => { a.length = 'half'; followRec(); } }
      : { label: 'Swap in remote-ready activities', run: () => { a.picks = {}; } } });
    if ((x = bad('follow-through'))) tips.push({ text: x.detail, fix: { label: 'Add a follow-up', run: () => { a.followUp = true; } } });
    if ((x = bad('brief-problem'))) tips.push({ text: x.detail, fix: { label: 'Help me rewrite it', run: () => { answered.delete('brief'); setTimeout(() => $<HTMLButtonElement>('[data-build]').click(), 50); } } });
    if ((x = bad('sequence'))) tips.push({ text: x.detail });
    if ((x = bad('feel-first'))) tips.push({ text: x.detail, fix: { label: 'Put the openers back', run: () => { (['discover', 'define', 'ideate', 'delight', 'prototype'] as CorePhase[]).forEach((p) => { if (a.picks[p] === '') delete a.picks[p]; }); } } });
    if ((x = bad('min-phase'))) tips.push({ text: x.detail, fix: a.phasesTouched ? { label: 'Use my recommended phases', run: () => { a.phasesTouched = false; followRec(); } } : undefined });
    if ((x = bad('after-lunch'))) tips.push({ text: x.detail, fix: { label: 'Turn energisers on', run: () => { a.energisers = true; } } });
    else if ((x = bad('energiser'))) tips.push({ text: x.detail, fix: { label: 'Turn energisers on', run: () => { a.energisers = true; } } });

    const passing = plan.checks.filter((y) => y.status === 'pass').length;
    const el = $('[data-advice]');
    el.className = 'advice';
    const prepLine = a.goal === 'learn'
      ? `Before the day, prepare one ${esc(a.thread === 'brief' ? 'worked' : a.thread.toLowerCase())} example per tool.`
      : 'The Prep tab has your countdown, starting with recruiting real people.';
    el.innerHTML = tips.length
      ? `<p>Here’s your draft. <strong>${passing} of ${plan.checks.length}</strong> review checks pass. A few things I’d change:</p><ul>${tips.map((t, i) => `<li><span>${esc(t.text)}</span>${t.fix ? `<button class="btn small ghost" data-fix="${i}">${esc(t.fix.label)}</button>` : ''}</li>`).join('')}</ul>`
      : `<p>Looks solid: <strong>all ${plan.checks.length} checks pass</strong>. Open any block on the right to change its opener, the tools it teaches, or its length. Then send it for review.</p><p class="small muted">${prepLine}</p>`;
    $$<HTMLButtonElement>('[data-fix]', el).forEach((b) => b.addEventListener('click', () => {
      tips[Number(b.dataset.fix)].fix!.run();
      syncInputs(); save(); showTurns(); render();
      toast('Updated the plan');
    }));
  }

  // ── Plan panel ─────────────────────────────────────────────────────────
  const kinds = [['feel', 'Activity'], ['theory', 'Theory'], ['cases', 'Cases'], ['practice', 'Practice'], ['energiser', 'Energiser']];

  function selectHtml(slot: Slot, label: string, allowNone: boolean): string {
    const cur = pickFor(a, slot);
    const opts = optionsFor(slot).map((it) => {
      const room = a.format === 'remote' && it.remote === false ? ' · needs a room' : '';
      return `<option value="${it.id}" ${it.id === cur ? 'selected' : ''}>${esc(it.title)} · ${it.minutes ?? 5} min${room}</option>`;
    }).join('');
    return `<label class="sel">${label}<select data-slot="${slot}">${allowNone ? `<option value="" ${cur === '' ? 'selected' : ''}>None</option>` : ''}${opts}</select></label>`;
  }

  function tuneHtml(b: Block): string {
    if (!b.slot) return b.why ? `<div class="tune"><p class="why">${esc(b.why)}</p></div>` : '';
    const rows: string[] = [];
    if (b.kind === 'phase') {
      const p = b.phase as CorePhase;
      rows.push(selectHtml(p, 'Opener', true));
      if (b.title.includes('Delight')) rows.push(selectHtml('delight', 'Delight', true));
      const on = toolsFor(a, p);
      rows.push(`<div><span class="tl">Tools to teach</span><div class="tools">${toolOptions(p).map((t) => `<button class="tool" data-tool="${p}" data-id="${t.id}" aria-pressed="${on.includes(t.id)}" title="${esc(t.summary)}">${esc(t.title)} · ${teachMinutes(a, t)}′</button>`).join('')}</div></div>`);
      const adj = a.adjust[p] ?? 0;
      rows.push(`<div class="adj">Length <button data-adj="${p}" data-d="-5">−5′</button><button data-adj="${p}" data-d="5">+5′</button>${adj ? `<span>${adj > 0 ? '+' : ''}${adj} min from the default</span>` : ''}</div>`);
    }
    if (b.kind === 'kickoff') rows.push(selectHtml('kickoff', 'Icebreaker', true));
    if (b.kind === 'shareout') rows.push(selectHtml('shareout', 'Format', false));
    if (b.kind === 'close' && b.slot === 'closer') rows.push(selectHtml('closer', 'Closer', true));
    if (b.why) rows.push(`<p class="why">${esc(b.why)}</p>`);
    return `<div class="tune">${rows.join('')}</div>`;
  }

  function blockHtml(b: Block): string {
    const isBreak = b.kind === 'break' || b.kind === 'lunch';
    const parts = b.parts.map((p) => {
      const it = p.item ? find(p.item) : undefined;
      const label = it ? `<a href="${href(it)}">${esc(p.label)}</a>` : esc(p.label);
      return `<li><span class="k k-${p.type}"></span><span>${label}</span><span class="pm">${p.minutes}′</span>${p.note ? `<span class="note">${esc(p.note)}</span>` : ''}</li>`;
    }).join('');
    const focus = b.focus ? '<span class="focus-tag">Focus</span>' : '';
    return `<div class="blk ${b.kind}" style="view-transition-name:${b.key}">
      <span class="clock">${fmtClock(b.start ?? 0)}</span>
      <details ${open.has(b.key) ? 'open' : ''} data-key="${b.key}">
        <summary ${isBreak ? 'tabindex="-1"' : ''}><span class="t">${esc(b.title)}${focus}</span><span class="m">${b.minutes} min</span></summary>
        ${parts ? `<ul class="parts">${parts}</ul>` : ''}
        ${isBreak ? '' : tuneHtml(b)}
      </details>
    </div>`;
  }

  function agendaHtml(p: Plan): string {
    if (!answered.size) {
      return `<div class="empty-plan"><img src="${base}img/icons/calendar.webp" alt=""><p>Your agenda builds here as you answer.<br>Or start from the Monsoon Edition.</p></div>`;
    }
    const outcome = `<div class="outcome"><span class="eyebrow">Success looks like</span><p>${esc(p.success)}</p>${p.outcomes.length ? `<ul>${p.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}</div>`;
    const legend = `<div class="legend">${kinds.map(([k, l]) => `<span><i class="k-${k}"></i>${l}</span>`).join('')}</div>`;
    return outcome + legend + p.days.map((d, i) => {
      const used = p.used[i];
      const over = used > p.capacity;
      const by: Record<string, number> = {};
      d.forEach((b) => b.parts.forEach((pt) => { by[pt.type] = (by[pt.type] ?? 0) + pt.minutes; }));
      const brk = d.filter((b) => b.kind === 'break' || b.kind === 'lunch').reduce((s, b) => s + b.minutes, 0);
      const total = Math.max(used, p.capacity);
      const seg = (k: string, m: number, color: string) => `<i style="flex-basis:${(m / total) * 100}%;background:${color}" title="${k}: ${m} min"></i>`;
      const meter = [
        seg('Activities', (by.feel ?? 0) + (by.energiser ?? 0), 'var(--accent)'),
        seg('Theory', (by.theory ?? 0) + (by.cases ?? 0), 'var(--ultra)'),
        seg('Practice', (by.practice ?? 0) + (by.share ?? 0), 'var(--ok)'),
        seg('Setup & close', (by.setup ?? 0) + (by.close ?? 0), 'var(--pink-mid)'),
        seg('Breaks', brk, 'var(--line)'),
      ].join('');
      const end = fmtClock((d[0]?.start ?? 0) + used);
      const cap = p.capacity >= 60 ? `${Math.floor(p.capacity / 60)}h${p.capacity % 60 ? ` ${p.capacity % 60}m` : ''}` : `${p.capacity}m`;
      return `<div class="day-h"><span>${p.days.length > 1 ? `Day ${i + 1}` : 'The day'}${a.date ? ` · ${fmtDate(a.date, i)}` : ''} · ends ${end}</span><span class="fit ${over ? 'over' : ''}">${Math.floor(used / 60)}h ${used % 60}m of ${cap}</span></div>
        <div class="meter">${meter}</div>${d.map(blockHtml).join('')}`;
    }).join('');
  }

  function prepHtml(p: Plan): string {
    const groups = new Map<number, typeof p.prep>();
    p.prep.forEach((x) => groups.set(x.offset, [...(groups.get(x.offset) ?? []), x]));
    const when = (o: number) => o === 0 ? 'On the day' : o < 0 ? (o % 7 === 0 ? `${-o / 7} week${o === -7 ? '' : 's'} before` : `${-o} days before`) : (o % 7 === 0 ? `${o / 7} week${o === 7 ? '' : 's'} after` : `${o} day${o === 1 ? '' : 's'} after`);
    const done = p.prep.filter((x) => prepDone.has(x.text)).length;
    return `<p class="prep-note">${a.date ? '' : 'Add a date in the time question and these turn into real dates. '}${done}/${p.prep.length} done.</p><div class="prep">${[...groups].map(([o, xs]) => `
      <h3><span>${when(o)}</span>${a.date ? `<span class="d">${fmtDate(a.date, o)}</span>` : ''}</h3>
      ${xs.map((x) => `<label><input type="checkbox" data-prep="${esc(x.text)}" ${prepDone.has(x.text) ? 'checked' : ''}><span>${esc(x.text)}</span>${x.tag ? `<span class="tag">${x.tag}</span>` : ''}</label>`).join('')}`).join('')}</div>`;
  }

  function kitHtml(p: Plan): string {
    return `<div class="kit">
      <h3>Templates (${p.templates.length})</h3><ul class="tpls">${p.templates.map((t) => `<li><a href="${href(t)}"><img src="${base}img/${t.image}" alt="" loading="lazy">${esc(t.title)}</a></li>`).join('')}</ul>
      <h3>Materials</h3><ul>${p.materials.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
      <h3>Cases to choose from</h3><ul>${p.cases.map((c) => `<li><a href="${href(c)}">${esc(c.title)}</a>${c.verify ? ' <span class="muted small">· check figures</span>' : ''}</li>`).join('')}</ul>
      <h3>People</h3><ul><li>${p.tables} tables of about ${Math.round(a.people / p.tables)}</li><li>${a.leads} design leads, one per table</li>${a.format === 'remote' ? '<li>A producer for breakout rooms and the timer</li>' : ''}<li>Running example: ${esc(a.thread === 'brief' ? 'the brief itself' : a.thread)}</li></ul>
    </div>`;
  }

  /** The facilitator's run sheet, for print. */
  function runsheetHtml(p: Plan): string {
    const lead = (b: Block) => b.kind === 'phase' ? 'Facilitator, then design leads' : b.kind === 'project' ? 'Design leads' : b.kind === 'shareout' ? 'Facilitator + teams' : 'Facilitator';
    const head = `<div class="rs-head"><h1>${esc(a.name)} · run sheet</h1>
      <p><strong>Brief:</strong> ${esc(a.brief || '(to write)')}</p>
      <p><strong>Success:</strong> ${esc(p.success)}</p>
      <p>${a.people} people · ${p.tables} tables · ${a.leads} design leads · ${lengthLabel[a.length]}, ${a.format === 'remote' ? 'remote' : 'in the room'} · running example: ${esc(a.thread === 'brief' ? 'the brief' : a.thread)}</p></div>`;
    return head + p.days.map((d, i) => `${p.days.length > 1 ? `<p class="rs-day">Day ${i + 1}${a.date ? ` · ${fmtDate(a.date, i)}` : ''}</p>` : ''}
      <table class="rs"><thead><tr><th>Time</th><th>Block</th><th>Lead</th><th>What happens</th><th>Materials</th><th>Debrief line</th></tr></thead><tbody>
      ${d.map((b) => {
        if (b.kind === 'break' || b.kind === 'lunch') return `<tr class="brk"><td class="tm">${fmtClock(b.start ?? 0)}</td><td colspan="5">${esc(b.title)} · ${b.minutes} min</td></tr>`;
        const its = b.parts.map((pt) => pt.item ? find(pt.item) : undefined);
        const what = b.parts.map((pt, k) => {
          const it = its[k];
          const steps = it?.kind === 'activity' && it.steps && pt.type !== 'practice' ? `<div class="steps">${it.steps.map((s) => esc(s.title)).join(' → ')}</div>` : '';
          return `<li><strong>${pt.minutes}′</strong> ${esc(pt.label)}${pt.note && pt.type === 'theory' ? ` <span class="steps">(${esc(pt.note)})</span>` : ''}${steps}</li>`;
        }).join('');
        const mats = [...new Set(its.flatMap((it) => it?.materials ?? []))];
        const deb = its.map((it) => it?.kind === 'activity' ? it.debrief : undefined).filter(Boolean);
        return `<tr><td class="tm">${fmtClock(b.start ?? 0)}<br>${b.minutes}′</td><td class="blk-t">${esc(b.title)}</td><td>${lead(b)}</td><td><ul>${what}</ul></td><td>${mats.map(esc).join('<br>')}</td><td class="deb">${deb.map((x) => esc(x!)).join('<br>')}</td></tr>`;
      }).join('')}</tbody></table>`).join('');
  }

  function render() {
    const p = buildPlan(a);
    const doRender = () => {
      $('[data-plan-name]').textContent = a.name;
      $('[data-plan-sub]').textContent = answered.size ? `${goalLabel[a.goal]} · ${lengthLabel[a.length]}${a.format === 'remote' ? ', remote' : ''}` : '';
      $('[data-agenda]').innerHTML = agendaHtml(p);
      const prev = new Map($$('[data-checks] .chk').map((el) => [el.dataset.id, el.dataset.status]));
      $('[data-checks]').innerHTML = p.checks.map((c) => `<li class="chk ${c.status}${prev.size && prev.get(c.id) !== c.status ? ' flip' : ''}" data-id="${c.id}" data-status="${c.status}"><span class="ic">${c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '×'}</span><div><strong>${esc(c.label)}</strong><p>${esc(c.detail)}</p></div></li>`).join('');
      $('[data-prep]').innerHTML = prepHtml(p);
      $('[data-kit]').innerHTML = kitHtml(p);
      $('[data-runsheet]').innerHTML = runsheetHtml(p);
      wirePlan();
    };
    if (answered.size) animate(doRender); else doRender();

    const passing = p.checks.filter((c) => c.status === 'pass').length;
    const score = $('[data-score]');
    $('[data-score-n]').textContent = String(passing);
    $('[data-score-d]').textContent = String(p.checks.length);
    $<SVGCircleElement>('.score .bar').style.strokeDasharray = `${(passing / p.checks.length) * 100} 100`;
    score.classList.toggle('all', passing === p.checks.length);
    score.style.visibility = answered.size ? 'visible' : 'hidden';
    if (lastPassing >= 0 && passing > lastPassing) { score.classList.remove('bump'); void score.getBoundingClientRect(); score.classList.add('bump'); }
    lastPassing = passing;
    $('[data-fab-score]').textContent = `${passing}/${p.checks.length}`;
    if (ORDER.every((q) => !asks(q) || answered.has(q))) renderAdvice();
  }

  function wirePlan() {
    $$<HTMLDetailsElement>('[data-agenda] details').forEach((d) => d.addEventListener('toggle', () => {
      d.open ? open.add(d.dataset.key!) : open.delete(d.dataset.key!);
    }));
    $$<HTMLSelectElement>('[data-slot]').forEach((s) => s.addEventListener('change', () => {
      a.picks[s.dataset.slot as Slot] = s.value;
      save(); render();
      toast(s.value ? `Swapped to ${find(s.value)!.title}` : 'Removed');
    }));
    $$<HTMLButtonElement>('[data-tool]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const p = b.dataset.tool as CorePhase, id = b.dataset.id!;
      const now = toolsFor(a, p);
      a.tools[p] = now.includes(id) ? now.filter((x) => x !== id) : [...now, id];
      save(); render();
    }));
    $$<HTMLButtonElement>('[data-adj]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const p = b.dataset.adj as CorePhase;
      a.adjust[p] = (a.adjust[p] ?? 0) + Number(b.dataset.d);
      save(); render();
    }));
    $$<HTMLInputElement>('[data-prep]').forEach((i) => i.addEventListener('change', () => {
      i.checked ? prepDone.add(i.dataset.prep!) : prepDone.delete(i.dataset.prep!);
      store.set(PREP_KEY, [...prepDone]);
      $('[data-prep]').querySelector('.prep-note')!.textContent = `${a.date ? '' : 'Add a date in the time question and these turn into real dates. '}${buildPlan(a).prep.filter((x) => prepDone.has(x.text)).length}/${buildPlan(a).prep.length} done.`;
    }));
  }

  // Tabs
  $$<HTMLButtonElement>('[data-ptab]').forEach((t) => t.addEventListener('click', () => {
    $$('[data-ptab]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    $$<HTMLElement>('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== t.dataset.ptab; });
  }));

  // Actions
  const copy = async (text: string, msg: string) => {
    try { await navigator.clipboard.writeText(text); toast(msg); } catch { toast('Couldn’t copy. Select the text instead.'); }
  };
  $('[data-copy]').addEventListener('click', () => copy(planToText(a, buildPlan(a)), 'Plan copied'));
  $('[data-print]').addEventListener('click', () => window.print());
  const dlg = $<HTMLDialogElement>('[data-dlg]');
  $('[data-review]').addEventListener('click', () => {
    const p = buildPlan(a);
    const todo = p.checks.filter((c) => c.status !== 'pass');
    $<HTMLTextAreaElement>('[data-review-text]').value = [
      `Subject: Prism review request: ${a.name}`, '',
      `Hi team, I’m planning a ${lengthLabel[a.length].toLowerCase()} Prism workshop${a.date ? ` on ${fmtDate(a.date, 0)}` : ''} and would like a 30-minute review.`, '',
      `What it’s for: ${goalLabel[a.goal]}${a.goal !== 'learn' ? ` (${stageLabel[a.stage].toLowerCase()})` : ''}`,
      `Success looks like: ${p.success}`,
      `Brief: ${a.brief || '(to do)'}`,
      `Room: ${a.people} people, ${p.tables} tables, ${a.leads} design leads (${summaries.room().split(' · ')[0]}), ${a.format === 'remote' ? 'remote' : 'in person'}`,
      `Phases: ${summaries.phases()} · running example: ${a.thread === 'brief' ? 'the brief itself' : a.thread}`,
      `After: ${summaries.after()}`, '',
      `Checks: ${p.checks.length - todo.length}/${p.checks.length} passing.`,
      ...todo.map((c) => `  · ${c.label}: ${c.detail}`), '',
      'Deck: [link]', '', '---', planToText(a, p),
    ].join('\n');
    dlg.showModal();
  });
  $('[data-copy-review]').addEventListener('click', () => copy($<HTMLTextAreaElement>('[data-review-text]').value, 'Review request copied'));
  // Hide the floating "View plan" button while the plan itself is on screen.
  new IntersectionObserver(([e]) => $('[data-fab]').classList.toggle('away', e.isIntersecting), { threshold: 0.15 }).observe($('[data-plan-panel]'));
  $('[data-fab]').addEventListener('click', () => $('[data-plan-panel]').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));

  let tt = 0;
  function toast(msg: string) {
    const t = $('[data-toast]');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(tt); tt = window.setTimeout(() => t.classList.remove('on'), 1800);
  }

  save();
  syncInputs();
  showTurns();
  render();
}

/** "2026-11-12" plus n days, as "Thu 12 Nov". */
function fmtDate(iso: string, plusDays: number): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + plusDays);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
