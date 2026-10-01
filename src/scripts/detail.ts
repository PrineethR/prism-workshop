import { store } from './store';

export const PIN_KEY = 'prism.pinned';

export function initDetail() {
  // "Add to my plan": the copilot picks pinned items first.
  document.querySelectorAll<HTMLButtonElement>('[data-pin]').forEach((b) => {
    const id = b.dataset.pin!;
    const pinned = new Set<string>(store.get(PIN_KEY, []));
    b.setAttribute('aria-pressed', String(pinned.has(id)));
    b.addEventListener('click', () => {
      const now = new Set<string>(store.get(PIN_KEY, []));
      now.has(id) ? now.delete(id) : now.add(id);
      store.set(PIN_KEY, [...now]);
      b.setAttribute('aria-pressed', String(now.has(id)));
    });
  });

  // Facilitator timer, styled like the countdowns on the deck's activity slides.
  document.querySelectorAll<HTMLElement>('[data-timer]').forEach((card) => {
    const total = Number(card.dataset.timer);
    const out = card.querySelector<HTMLElement>('[data-time]')!;
    const arc = card.querySelector<SVGCircleElement>('.arc')!;
    const start = card.querySelector<HTMLButtonElement>('[data-t-start]')!;
    const reset = card.querySelector<HTMLButtonElement>('[data-t-reset]')!;
    let left = total, id = 0, endAt = 0;

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const draw = () => {
      out.textContent = fmt(left);
      arc.style.strokeDashoffset = String(1000 - (left / total) * 1000);
    };
    const stop = () => { clearInterval(id); id = 0; card.classList.remove('running'); start.textContent = left < total && left > 0 ? 'Resume' : 'Start'; };
    const tick = () => {
      left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      draw();
      if (left === 0) { stop(); card.classList.add('finished'); start.textContent = 'Start'; }
    };

    start.addEventListener('click', () => {
      if (id) { stop(); return; }
      if (left === 0) left = total;
      card.classList.remove('finished');
      card.classList.add('running');
      endAt = Date.now() + left * 1000;
      id = window.setInterval(tick, 250);
      start.textContent = 'Pause';
    });
    reset.addEventListener('click', () => { stop(); left = total; card.classList.remove('finished'); draw(); start.textContent = 'Start'; });
    draw();
  });
}
