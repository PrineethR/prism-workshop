// Click-and-drag horizontal scrolling for mouse users. Touch and trackpads
// already scroll natively, so this only handles mouse pointers.
export function dragScroll(el: HTMLElement) {
  let startX = 0, startLeft = 0, moved = false, down = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add('dragging'); }
    if (moved) el.scrollLeft = startLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    if (moved) requestAnimationFrame(() => el.classList.remove('dragging'));
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') el.scrollBy({ left: 300, behavior: 'smooth' });
    if (e.key === 'ArrowLeft') el.scrollBy({ left: -300, behavior: 'smooth' });
  });
}
