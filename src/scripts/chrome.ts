// Site-wide behaviour: header state, mobile menu, the nav underline that
// follows the pointer, and scroll reveals.

export function initChrome() {
  const body = document.body;
  const onScroll = () => body.classList.toggle('scrolled', window.scrollY > 4);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const btn = document.querySelector<HTMLButtonElement>('.menu-btn');
  const nav = document.getElementById('site-nav');
  btn?.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('open', open);
  });

  // Underline that slides between nav links; rests under the current page.
  const ink = nav?.querySelector<HTMLElement>('.nav-ink');
  if (nav && ink) {
    const links = [...nav.querySelectorAll<HTMLAnchorElement>('a:not(.cta)')];
    const current = links.find((a) => a.getAttribute('aria-current') === 'page');
    const moveTo = (a?: HTMLAnchorElement) => {
      if (!a) { ink.style.opacity = '0'; return; }
      ink.style.opacity = '1';
      ink.style.width = `${a.offsetWidth - 24}px`;
      ink.style.transform = `translateX(${a.offsetLeft + 12}px)`;
    };
    moveTo(current);
    links.forEach((a) => a.addEventListener('pointerenter', () => moveTo(a)));
    nav.addEventListener('pointerleave', () => moveTo(current));
    window.addEventListener('resize', () => moveTo(current));
  }

  reveal();
  fillGrids();
  let t = 0;
  window.addEventListener('resize', () => { clearTimeout(t); t = window.setTimeout(() => fillGrids(), 120); });
}

type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
/** Run a DOM update inside a view transition where it's supported and wanted.
 *  Overlapping or hidden-tab transitions get skipped by the browser; the update
 *  still runs, so the rejections are swallowed rather than logged. */
export function animate(fn: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduced || document.visibilityState !== 'visible') { fn(); return; }
  const t = doc.startViewTransition(fn);
  const quiet = () => {};
  t.ready.catch(quiet); t.finished.catch(quiet); t.updateCallbackDone.catch(quiet);
}

/** Make every .grid come out with full rows. */
export function fillGrids(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.grid').forEach((grid) => {
    const cards = [...grid.children].filter((c) => !c.classList.contains('hide')) as HTMLElement[];
    cards.forEach((c) => c.classList.remove('wide'));
    grid.style.removeProperty('--n');
    grid.classList.remove('few', 'solo');
    const cols = parseInt(getComputedStyle(grid).getPropertyValue('--cols')) || 1;
    const n = cards.length;
    if (!n || cols === 1) return;
    if (n < cols) {
      grid.style.setProperty('--n', String(n));
      grid.classList.add(n === 1 ? 'solo' : 'few');
      return;
    }
    const r = n % cols;
    if (!r) return;
    // Spread the widened cards down the grid rather than bunching them at the top.
    const need = cols - r;
    for (let k = 0; k < need; k++) cards[Math.floor(((k + 0.5) * n) / need)].classList.add('wide');
  });
}

export function reveal(root: ParentNode = document) {
  const els = root.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}
