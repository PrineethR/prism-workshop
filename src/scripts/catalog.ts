import { fillGrids, animate } from './chrome';

// Catalog filters. Changes run inside a view transition where supported, so
// cards glide to their new places instead of jumping.

export function initCatalog() {
  const cards = [...document.querySelectorAll<HTMLElement>('.item-card')];
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-kind-tab]')];
  const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-phase-chip]')];
  const search = document.querySelector<HTMLInputElement>('[data-search]')!;
  const shown = document.querySelector('[data-shown]')!;
  const empty = document.querySelector<HTMLElement>('[data-empty]')!;
  const ink = document.querySelector<HTMLElement>('.tab-ink');
  const role = document.querySelector<HTMLSelectElement>('[data-role]')!;
  const len = document.querySelector<HTMLSelectElement>('[data-len]')!;
  const remote = document.querySelector<HTMLButtonElement>('[data-remote]')!;

  const params = new URLSearchParams(location.search);
  const state = { kind: params.get('kind') || 'all', phase: params.get('phase') || '', q: params.get('q') || '', role: params.get('use') || '', len: params.get('len') || '', remote: params.get('remote') === '1' };
  search.value = state.q;
  role.value = state.role;
  len.value = state.len;

  // Name each card so a view transition can track it.
  cards.forEach((c, i) => { c.style.viewTransitionName = `c${i}`; });

  const moveInk = () => {
    const t = tabs.find((b) => b.dataset.kindTab === state.kind);
    if (t && ink) { ink.style.width = `${t.offsetWidth}px`; ink.style.transform = `translateX(${t.offsetLeft - 4}px)`; }
  };

  const apply = () => {
    let n = 0;
    const q = state.q.trim().toLowerCase();
    // Length only applies to things with a timer.
    const fitsLength = (m: number) => !state.len || (m > 0 && (state.len === '16' ? m > 15 : m <= Number(state.len)));
    for (const c of cards) {
      const ok = (state.kind === 'all' || c.dataset.kind === state.kind)
        && (!state.phase || c.dataset.phase === state.phase)
        && (!q || (c.dataset.text ?? '').includes(q))
        && (!state.role || c.dataset.role === state.role)
        && (!state.remote || c.dataset.remote !== 'no')
        && fitsLength(Number(c.dataset.minutes || 0));
      c.classList.toggle('hide', !ok);
      if (ok) n++;
    }
    fillGrids();
    shown.textContent = String(n);
    empty.hidden = n > 0;
    tabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.kindTab === state.kind)));
    chips.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.phaseChip === state.phase)));
    remote.setAttribute('aria-pressed', String(state.remote));
    moveInk();
    const p = new URLSearchParams();
    if (state.kind !== 'all') p.set('kind', state.kind);
    if (state.phase) p.set('phase', state.phase);
    if (state.q) p.set('q', state.q);
    if (state.role) p.set('use', state.role);
    if (state.len) p.set('len', state.len);
    if (state.remote) p.set('remote', '1');
    history.replaceState(null, '', `${location.pathname}${p.size ? `?${p}` : ''}`);
  };

  const animated = animate;

  tabs.forEach((b) => b.addEventListener('click', () => animated(() => { state.kind = b.dataset.kindTab!; apply(); })));
  chips.forEach((b) => b.addEventListener('click', () => animated(() => { state.phase = b.dataset.phaseChip!; apply(); })));
  role.addEventListener('change', () => animated(() => { state.role = role.value; if (state.role && state.kind !== 'all' && state.kind !== 'activity') state.kind = 'activity'; apply(); }));
  len.addEventListener('change', () => animated(() => { state.len = len.value; apply(); }));
  remote.addEventListener('click', () => animated(() => { state.remote = !state.remote; apply(); }));
  let t = 0;
  search.addEventListener('input', () => {
    clearTimeout(t);
    t = window.setTimeout(() => { state.q = search.value; apply(); }, 120);
  });
  window.addEventListener('resize', moveInk);
  apply();
  requestAnimationFrame(moveInk);
}
