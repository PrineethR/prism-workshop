import { store } from './store';

const KEY = 'prism.guide.checks';

export function initGuide() {
  const checks = [...document.querySelectorAll<HTMLInputElement>('[data-check]')];
  const saved = new Set<string>(store.get(KEY, []));
  checks.forEach((c) => { c.checked = saved.has(c.dataset.check!); });

  const count = document.querySelector('[data-done-count]');
  const bar = document.querySelector<SVGCircleElement>('.progress .bar');
  const stepIds = [...document.querySelectorAll<HTMLElement>('[data-step]')].map((s) => s.dataset.step!);

  const refresh = () => {
    let done = 0;
    for (const id of stepIds) {
      const mine = checks.filter((c) => c.dataset.check!.startsWith(`${id}:`));
      const complete = mine.length > 0 && mine.every((c) => c.checked);
      if (complete) done++;
      document.querySelector(`[data-rail="${id}"]`)?.classList.toggle('done', complete);
    }
    if (count) count.textContent = String(done);
    bar?.style.setProperty('stroke-dasharray', `${(done / stepIds.length) * 100} 100`);
  };

  checks.forEach((c) => c.addEventListener('change', () => {
    c.checked ? saved.add(c.dataset.check!) : saved.delete(c.dataset.check!);
    store.set(KEY, [...saved]);
    refresh();
  }));
  refresh();

  // Scrollspy: the rail marker follows the step you're reading.
  const ink = document.querySelector<HTMLElement>('.rail-ink');
  const list = document.querySelector<HTMLElement>('.rail ol');
  const setCurrent = (id: string) => {
    document.querySelectorAll('[data-rail]').forEach((a) => a.classList.toggle('current', (a as HTMLElement).dataset.rail === id));
    const a = document.querySelector<HTMLElement>(`[data-rail="${id}"]`);
    if (a && ink && list) {
      ink.style.transform = `translateY(${a.offsetTop + list.offsetTop}px)`;
      ink.style.height = `${a.offsetHeight}px`;
    }
  };
  const io = new IntersectionObserver((entries) => {
    const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (vis[0]) setCurrent((vis[0].target as HTMLElement).dataset.step!);
  }, { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('[data-step]').forEach((s) => io.observe(s));
  setCurrent(stepIds[0]);
}
