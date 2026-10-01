import { dragScroll } from './drag';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initHome() {
  // Hero: the glass drifts as the pointer moves.
  const art = document.querySelector<HTMLElement>('[data-prism]');
  if (art && !reduced && matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    window.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        art.style.setProperty('--px', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
        art.style.setProperty('--py', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
      });
    }, { passive: true });
  }

  // Diamond halves and phase cards light each other up.
  document.querySelectorAll<SVGGElement>('[data-diamond] [data-phase]').forEach((g) => {
    const card = document.querySelector(`[data-phase-card="${g.dataset.phase}"]`);
    const link = g.closest('a') ?? g;
    link.addEventListener('pointerenter', () => card?.classList.add('lit'));
    link.addEventListener('pointerleave', () => card?.classList.remove('lit'));
    link.addEventListener('focus', () => card?.classList.add('lit'));
    link.addEventListener('blur', () => card?.classList.remove('lit'));
  });
  document.querySelectorAll<HTMLElement>('[data-phase-card]').forEach((card) => {
    const half = document.querySelector(`[data-diamond] [data-phase="${card.dataset.phaseCard}"]`);
    card.addEventListener('pointerenter', () => half?.classList.add('on'));
    card.addEventListener('pointerleave', () => half?.classList.remove('on'));
  });

  // Module pattern: steps through the beats like a slide clicker while on screen.
  const beats = document.querySelector<HTMLElement>('[data-beats]');
  if (beats) {
    const items = [...beats.children] as HTMLElement[];
    let i = 0, timer = 0, paused = false, visible = false;
    const show = (n: number) => {
      i = (n + items.length) % items.length;
      items.forEach((li, k) => { li.classList.toggle('now', k === i); li.classList.toggle('past', k < i); });
    };
    const tick = () => { if (!paused && visible) show(i + 1); };
    show(0);
    items.forEach((li, k) => {
      li.addEventListener('pointerenter', () => { paused = true; show(k); });
      li.addEventListener('focus', () => { paused = true; show(k); });
    });
    beats.addEventListener('pointerleave', () => { paused = false; });
    if (!reduced) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 }).observe(beats);
      timer = window.setInterval(tick, 1900);
    }
    void timer;
  }

  document.querySelectorAll<HTMLElement>('[data-drag]').forEach(dragScroll);
}
