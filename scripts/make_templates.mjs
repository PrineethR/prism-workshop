// Draws the preview for every template that doesn't have one from the deck.
// Each preview is a sheet of paper with the template's real layout on it, in
// the deck's burgundy. Run: node scripts/make_templates.mjs
// Output: public/img/templates/<id>.svg

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img', 'templates');
mkdirSync(OUT, { recursive: true });

const C = {
  ink: '#1d1418', ink3: '#8e8389', wine: '#97144d', pink: '#f8c2dd', blush: '#ffebf4', blush2: '#fff5fa',
  rule: '#eadfe4', edge: '#e2c3d1', ultra: '#3f2bc3', sun: '#fff1c9', mint: '#e3f3ec', red: '#c4314b',
};
const F = `font-family="Lato, 'Helvetica Neue', Arial, sans-serif"`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Primitives ───────────────────────────────────────────────────────────────
const t = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" ${F} font-size="${o.size ?? 7}" font-weight="${o.w ?? 900}" fill="${o.fill ?? C.wine}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.italic ? ' font-style="italic"' : ''}${o.ls !== false ? ' letter-spacing="0.6"' : ''}>${esc(s)}</text>`;
const label = (x, y, s, o = {}) => t(x, y, s.toUpperCase(), { size: 6.2, ...o });
const r = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 4}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? C.edge}" stroke-width="${o.sw ?? 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const l = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? C.rule}" stroke-width="${o.sw ?? 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;
const c = (cx, cy, rad, o = {}) => `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? C.edge}" stroke-width="${o.sw ?? 1}"/>`;
const p = (d, o = {}) => `<path d="${d}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? C.wine}" stroke-width="${o.sw ?? 1.4}" stroke-linecap="round" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
/** Faint writing lines inside a box. */
const lines = (x, y, w, h, gap = 9) => {
  let s = '';
  for (let yy = y + gap; yy < y + h - 2; yy += gap) s += l(x, yy, x + w, yy);
  return s;
};
/** A labelled box with writing lines. */
const field = (x, y, w, h, name, o = {}) =>
  r(x, y, w, h, { fill: o.fill ?? '#fff', stroke: o.stroke }) + label(x + 6, y + 11, name, { fill: o.lc }) + (o.nolines ? '' : lines(x + 6, y + 14, w - 12, h - 14));
const sticky = (x, y, fill = C.sun, rot = 0) =>
  `<rect x="${x}" y="${y}" width="16" height="16" fill="${fill}" stroke="rgba(0,0,0,0.06)" transform="rotate(${rot} ${x + 8} ${y + 8})"/>`;

/** Paper: landscape (A-series) or portrait, with the template name on top. */
function sheet(title, body, { portrait = false, card = false } = {}) {
  const [x, y, w, h] = portrait ? [112, 10, 176, 280] : card ? [50, 40, 300, 220] : [22, 16, 356, 268];
  const head = `${t(x + 12, y + 18, 'PRISM', { size: 7, italic: true })}${t(x + 42, y + 18, title, { size: 9, w: 700, fill: C.ink, ls: false })}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
<rect x="${x + 2}" y="${y + 4}" width="${w}" height="${h}" rx="6" fill="rgba(115,18,61,0.08)"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#fff" stroke="${C.edge}"/>
${head}
${body({ x: x + 12, y: y + 28, w: w - 24, h: h - 40 })}
</svg>`;
}

// ── Templates ────────────────────────────────────────────────────────────────
const T = {};

T['superpower-sticker'] = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
<rect x="62" y="68" width="280" height="170" rx="16" fill="rgba(115,18,61,0.1)"/>
<rect x="58" y="62" width="280" height="170" rx="16" fill="#fff" stroke="${C.edge}"/>
<path d="M58 78 a16 16 0 0 1 16 -16 h248 a16 16 0 0 1 16 16 v38 h-280 z" fill="${C.wine}"/>
${t(198, 96, 'Hi, I’m', { size: 20, w: 900, fill: '#fff', anchor: 'middle', italic: true, ls: false })}
${l(84, 160, 312, 160, { stroke: C.edge, sw: 1.5 })}
${t(198, 186, 'and my superpower is', { size: 10, w: 700, fill: C.wine, anchor: 'middle', ls: false })}
${l(84, 214, 312, 214, { stroke: C.edge, sw: 1.5 })}
</svg>`;

T['hopes-fears'] = () => sheet('Hopes & fears', ({ x, y, w, h }) => {
  const cw = (w - 10) / 2;
  let s = r(x, y, cw, h, { fill: C.blush2 }) + r(x + cw + 10, y, cw, h, { fill: '#fffaf0' });
  s += t(x + cw / 2, y + 18, 'HOPES', { size: 10, anchor: 'middle' }) + t(x + cw + 10 + cw / 2, y + 18, 'FEARS', { size: 10, anchor: 'middle', fill: '#9a6b00' });
  [[20, 34, -4], [44, 30, 3], [70, 40, -2], [26, 62, 2], [56, 66, -5], [100, 36, 4], [96, 70, -2], [130, 52, 3], [40, 96, 3], [80, 104, -3], [120, 96, 2], [24, 130, -2]]
    .forEach(([dx, dy, rot], i) => { if (y + dy < y + h - 20) s += sticky(x + dx, y + dy, C.pink, rot); if (i < 8) s += sticky(x + cw + 10 + dx + 6, y + dy + 4, C.sun, -rot); });
  return s;
});

T['interview-guide'] = () => sheet('Interview guide', ({ x, y, w, h }) => {
  const parts = [['Introduce', '2′'], ['Warm up', '3′'], ['Tell me about the last time…', '10′'], ['Dig deeper: why? how?', '10′'], ['Wrap up', '2′']];
  const bh = h / parts.length;
  return parts.map(([n, m], i) => {
    const yy = y + i * bh;
    return r(x, yy + 2, 22, 12, { fill: C.blush, stroke: C.blush, rx: 6 }) + t(x + 11, yy + 10.5, m, { size: 6.5, anchor: 'middle' })
      + t(x + 28, yy + 11, n, { size: 7, w: 700, fill: C.ink, ls: false }) + lines(x + 28, yy + 13, w - 28, bh - 12, 8);
  }).join('');
}, { portrait: true });

T['empathy-map'] = () => sheet('Empathy map', ({ x, y, w, h }) => {
  const top = h * 0.72, cx = x + w / 2, cy = y + top / 2;
  let s = r(x, y, w, top, { fill: '#fff' }) + l(x, cy, x + w, cy, { stroke: C.edge }) + l(cx, y, cx, y + top, { stroke: C.edge });
  s += label(x + 6, y + 11, 'Says') + label(x + w / 2 + 6, y + 11, 'Thinks') + label(x + 6, cy + 11, 'Does') + label(x + w / 2 + 6, cy + 11, 'Feels');
  s += c(cx, cy, 24, { fill: C.blush, stroke: C.wine, sw: 1.2 }) + c(cx, cy - 6, 7, { fill: '#fff', stroke: C.wine, sw: 1.2 }) + p(`M${cx - 12} ${cy + 14} q12 -14 24 0`);
  [[18, 20], [44, 30], [w - 70, 22], [w - 44, 40], [24, cy - y + 22], [w - 60, cy - y + 26]].forEach(([dx, dy], i) => { s += sticky(x + dx, y + dy, i % 2 ? C.pink : C.sun, i % 2 ? 3 : -3); });
  const by = y + top + 6, bw = (w - 6) / 2;
  s += field(x, by, bw, h - top - 6, 'Pains', { fill: C.blush2 }) + field(x + bw + 6, by, bw, h - top - 6, 'Gains', { fill: C.mint });
  return s;
});

T['journey-map'] = () => sheet('Journey map', ({ x, y, w, h }) => {
  const lw = 58, cols = 5, cw = (w - lw) / cols, rows = ['Doing', 'Thinking', 'Feeling', 'Pain points', 'Opportunities'], rh = (h - 16) / rows.length;
  let s = '';
  for (let i = 0; i < cols; i++) s += r(x + lw + i * cw + 2, y, cw - 4, 12, { fill: C.wine, stroke: C.wine, rx: 6 }) + t(x + lw + i * cw + cw / 2, y + 8.5, `STAGE ${i + 1}`, { size: 5.8, fill: '#fff', anchor: 'middle' });
  rows.forEach((n, j) => {
    const yy = y + 16 + j * rh;
    s += label(x, yy + rh / 2 + 2, n) + l(x + lw, yy + rh, x + w, yy + rh);
    if (n === 'Feeling') s += p(`M${x + lw + 8} ${yy + rh * 0.4} C ${x + lw + cw} ${yy + rh * 0.1}, ${x + lw + cw * 1.5} ${yy + rh * 0.9}, ${x + lw + cw * 2.5} ${yy + rh * 0.85} S ${x + lw + cw * 4} ${yy + rh * 0.1}, ${x + w - 8} ${yy + rh * 0.3}`, { stroke: C.ultra, sw: 1.6 });
    else if (n === 'Pain points') { s += sticky(x + lw + cw * 2.2, yy + 4, C.pink, -3); s += sticky(x + lw + cw * 3.4, yy + 5, C.pink, 4); }
    else for (let i = 0; i < cols; i++) s += sticky(x + lw + i * cw + cw / 2 - 8, yy + rh / 2 - 8, j === 4 ? C.mint : C.sun, (i * 7) % 5 - 2);
  });
  return s;
});

T['assumption-grid'] = () => sheet('Assumption grid', ({ x, y, w, h }) => {
  const ax = x + 14, ay = y + h - 14, gw = w - 20, gh = h - 20, mx = ax + gw / 2, my = y + gh / 2;
  let s = `<rect x="${ax}" y="${y}" width="${gw / 2}" height="${gh / 2}" fill="${C.blush}"/>`;
  s += l(ax, y, ax, ay, { stroke: C.wine, sw: 1.4 }) + l(ax, ay, ax + gw, ay, { stroke: C.wine, sw: 1.4 }) + l(mx, y, mx, ay, { stroke: C.edge, dash: '3 3' }) + l(ax, my, ax + gw, my, { stroke: C.edge, dash: '3 3' });
  s += label(ax + 6, y + 12, 'Test first') + label(mx + 6, y + 12, 'Build on it', { fill: C.ink3 }) + label(ax + 6, my + 12, 'Park', { fill: C.ink3 }) + label(mx + 6, my + 12, 'Park', { fill: C.ink3 });
  s += `<text transform="translate(${x + 6} ${y + gh / 2}) rotate(-90)" ${F} font-size="6" font-weight="900" fill="${C.wine}" text-anchor="middle" letter-spacing="0.6">IMPORTANT →</text>`;
  s += t(ax + gw / 2, ay + 11, 'NO EVIDENCE  ←→  EVIDENCE', { size: 6, anchor: 'middle' });
  [[20, 22, C.sun], [48, 34, C.sun], [30, 52, C.pink], [gw / 2 + 30, 26, C.sun], [gw / 2 + 60, gh / 2 + 18, C.sun], [36, gh / 2 + 22, C.pink]].forEach(([dx, dy, f], i) => { s += sticky(ax + dx, y + dy, f, i % 2 ? 4 : -3); });
  return s;
});

T['research-plan'] = () => sheet('Research plan', ({ x, y, w, h }) => {
  const heads = ['What we need to learn', 'Who', 'How', 'Owner · date'], ws = [0.38, 0.22, 0.2, 0.2];
  let s = '', xx = x;
  const th = h * 0.62;
  heads.forEach((n, i) => {
    const cw = w * ws[i];
    s += r(xx, y, cw - 3, 12, { fill: C.blush, stroke: C.blush, rx: 3 }) + label(xx + 4, y + 8.5, n);
    for (let k = 0; k < 3; k++) s += r(xx, y + 16 + k * ((th - 16) / 3), cw - 3, (th - 16) / 3 - 4, { fill: '#fff' });
    xx += cw;
  });
  return s + field(x, y + th + 4, w, h - th - 4, 'Questions to ask', { fill: C.blush2 });
});

T['insight-card'] = () => sheet('Insight card', ({ x, y, w, h }) => {
  const rows = ['We saw…', 'That tells us…', 'Because…'], rh = h / 3;
  return rows.map((n, i) => field(x, y + i * rh, w, rh - 5, n, { fill: i === 2 ? C.blush2 : '#fff' })).join('');
}, { card: true });

T['pov-card'] = () => sheet('Point of view', ({ x, y, w, h }) => {
  const row = (yy, a, b) => t(x, yy, a, { size: 10, w: 400, fill: C.ink, ls: false }) + l(x + b, yy + 2, x + w, yy + 2, { stroke: C.edge, sw: 1.4 });
  return row(y + 30, '', 0) + label(x, y + 42, 'User', { fill: C.ink3 })
    + row(y + 76, 'needs a way to', 76) + label(x + 76, y + 88, 'Need', { fill: C.ink3 })
    + row(y + 122, 'because', 44) + label(x + 44, y + 134, 'Surprising insight', { fill: C.ink3 })
    + l(x, y + 164, x + w, y + 164, { stroke: C.edge, sw: 1.4 });
}, { card: true });

T['persona'] = () => sheet('Archetype', ({ x, y, w, h }) => {
  let s = c(x + 22, y + 22, 20, { fill: C.blush, stroke: C.wine, sw: 1.2 }) + c(x + 22, y + 17, 6.5, { fill: '#fff', stroke: C.wine, sw: 1.2 }) + p(`M${x + 11} ${y + 36} q11 -12 22 0`);
  s += l(x + 50, y + 18, x + w, y + 18, { stroke: C.edge, sw: 1.4 }) + label(x + 50, y + 28, 'Name', { fill: C.ink3 });
  s += r(x, y + 48, w, 26, { fill: C.blush2 }) + t(x + 6, y + 64, '“', { size: 18, fill: C.wine });
  const parts = ['Goals', 'Frustrations', 'Behaviours', 'From interviews'], bh = (h - 80) / parts.length;
  parts.forEach((n, i) => { s += field(x, y + 80 + i * bh, w, bh - 4, n); });
  return s;
}, { portrait: true });

T['problem-tree'] = () => sheet('Problem tree', ({ x, y, w, h }) => {
  const cx = x + w / 2, ty = y + h * 0.42, th = 26;
  let s = '';
  [-1, 0, 1].forEach((k) => { s += p(`M${cx} ${ty} C ${cx} ${ty - 20}, ${cx + k * 90} ${ty - 20}, ${cx + k * 100} ${y + 24}`, { stroke: C.edge, sw: 2 }); });
  [-1, 0, 1].forEach((k) => { s += p(`M${cx} ${ty + th} C ${cx} ${ty + th + 20}, ${cx + k * 90} ${ty + th + 20}, ${cx + k * 100} ${y + h - 30}`, { stroke: '#c9a28f', sw: 2 }); });
  [-1, 0, 1].forEach((k) => { s += r(cx + k * 100 - 40, y, 80, 24, { fill: C.mint }) + t(cx + k * 100, y + 15, 'EFFECT', { size: 6, anchor: 'middle', fill: '#1e7a55' }); });
  [-1, 0, 1].forEach((k) => { s += r(cx + k * 100 - 40, y + h - 30, 80, 24, { fill: '#f5ece6' }) + t(cx + k * 100, y + h - 15, 'ROOT CAUSE', { size: 6, anchor: 'middle', fill: '#8a5a3c' }); });
  s += r(cx - 70, ty, 140, th, { fill: C.wine, stroke: C.wine }) + t(cx, ty + 16, 'CORE PROBLEM', { size: 7.5, anchor: 'middle', fill: '#fff' });
  return s;
});

T['hmw-card'] = () => sheet('How Might We', ({ x, y, w, h }) =>
  t(x, y + 34, 'How might we', { size: 20, w: 900, italic: true, ls: false })
  + l(x, y + 66, x + w, y + 66, { stroke: C.edge, sw: 1.4 }) + l(x, y + 90, x + w, y + 90, { stroke: C.edge, sw: 1.4 })
  + t(x, y + 124, 'so that', { size: 12, w: 700, italic: true, ls: false })
  + l(x + 50, y + 124, x + w, y + 124, { stroke: C.edge, sw: 1.4 }) + l(x, y + 150, x + w, y + 150, { stroke: C.edge, sw: 1.4 })
  + t(x + w, y + 174, '?', { size: 20, anchor: 'end' }), { card: true });

T['brainstorm-rules'] = () => sheet('Brainstorm rules', ({ x, y, w, h }) => {
  const rules = ['Defer judgement', 'Encourage wild ideas', 'Build on the ideas of others', 'Stay focused on the topic', 'One conversation at a time', 'Be visual', 'Go for quantity'];
  const rh = h / rules.length;
  return rules.map((n, i) => c(x + 9, y + i * rh + rh / 2 - 2, 8, { fill: C.wine, stroke: C.wine }) + t(x + 9, y + i * rh + rh / 2 + 1, String(i + 1), { size: 8, anchor: 'middle', fill: '#fff' })
    + t(x + 24, y + i * rh + rh / 2 + 1, n, { size: 8.5, w: 700, fill: C.ink, ls: false })).join('');
}, { portrait: true });

T['circles-sheet'] = () => sheet('Let’s Circle Back', ({ x, y, w, h }) => {
  let s = '';
  const cols = 5, rows = 6, gx = w / cols, gy = h / rows, rad = Math.min(gx, gy) / 2 - 3;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) s += c(x + gx * i + gx / 2, y + gy * j + gy / 2, rad, { stroke: C.wine, sw: 1 });
  // A couple already turned into things.
  s += p(`M${x + gx / 2 - 5} ${y + gy / 2 + 3} q5 5 10 0`) + c(x + gx / 2 - 4, y + gy / 2 - 3, 0.8, { fill: C.wine, stroke: C.wine }) + c(x + gx / 2 + 4, y + gy / 2 - 3, 0.8, { fill: C.wine, stroke: C.wine });
  s += p(`M${x + gx * 1.5 - rad - 5} ${y + gy / 2} h-4 M${x + gx * 1.5 + rad + 5} ${y + gy / 2} h4 M${x + gx * 1.5} ${y + gy / 2 - rad - 5} v-3`, { sw: 1.2 });
  return s;
}, { portrait: true });

T['scamper'] = () => sheet('SCAMPER cards', ({ x, y, w, h }) => {
  const L = [['S', 'Substitute'], ['C', 'Combine'], ['A', 'Adapt'], ['M', 'Modify'], ['P', 'Put to use'], ['E', 'Eliminate'], ['R', 'Reverse']];
  const cw = (w - 3 * 6) / 4, ch = (h - 6) / 2;
  return L.map(([k, n], i) => {
    const xx = x + (i % 4) * (cw + 6) + (i >= 4 ? cw / 2 + 3 : 0), yy = y + Math.floor(i / 4) * (ch + 6);
    return r(xx, yy, cw, ch, { fill: i % 2 ? C.blush2 : '#fff' }) + t(xx + cw / 2, yy + ch / 2 + 6, k, { size: 26, anchor: 'middle', italic: true })
      + t(xx + cw / 2, yy + ch - 8, n.toUpperCase(), { size: 5.6, anchor: 'middle', fill: C.ink3 });
  }).join('');
});

function matrix(title, q, xl, yl, hot) {
  return sheet(title, ({ x, y, w, h }) => {
    const ax = x + 14, gw = w - 16, gh = h - 16, mx = ax + gw / 2, my = y + gh / 2;
    let s = hot != null ? `<rect x="${hot % 2 ? mx : ax}" y="${hot < 2 ? y : my}" width="${gw / 2}" height="${gh / 2}" fill="${C.blush}"/>` : '';
    s += l(ax, y, ax, y + gh, { stroke: C.wine, sw: 1.4 }) + l(ax, y + gh, ax + gw, y + gh, { stroke: C.wine, sw: 1.4 }) + l(mx, y, mx, y + gh, { stroke: C.edge }) + l(ax, my, ax + gw, my, { stroke: C.edge });
    q.forEach((n, i) => { s += t((i % 2 ? mx : ax) + gw / 4, (i < 2 ? y : my) + gh / 4 + 3, n.toUpperCase(), { size: 8.5, anchor: 'middle', fill: i === hot ? C.wine : C.ink3 }); });
    s += `<text transform="translate(${x + 6} ${y + gh / 2}) rotate(-90)" ${F} font-size="6" font-weight="900" fill="${C.wine}" text-anchor="middle" letter-spacing="0.6">${esc(yl)}</text>`;
    s += t(ax + gw / 2, y + gh + 11, xl, { size: 6, anchor: 'middle' });
    return s;
  });
}
T['prioritisation-matrix'] = () => matrix('Prioritisation matrix', ['Improve later', 'Do now', 'Park', 'Explore'], 'IMPACT →', 'NEED →', 1);
T['now-wow-how'] = () => matrix('Now, Wow, How', ['Wow', 'How', 'Now', '—'], 'EASY TODAY  →  HARD TODAY', 'ORIGINAL →', 0);

T['storyboard'] = () => sheet('Storyboard', ({ x, y, w, h }) => {
  let s = '';
  const cw = (w - 12) / 3, ch = (h - 8) / 2;
  for (let i = 0; i < 6; i++) {
    const xx = x + (i % 3) * (cw + 6), yy = y + Math.floor(i / 3) * (ch + 8);
    s += r(xx, yy, cw, ch - 20, { fill: '#fff' }) + t(xx + 5, yy + 10, String(i + 1), { size: 7 }) + l(xx, yy + ch - 12, xx + cw, yy + ch - 12) + l(xx, yy + ch - 4, xx + cw * 0.7, yy + ch - 4);
  }
  // A stick figure in frame one.
  return s + c(x + cw / 2, y + 18, 5, { stroke: C.wine, sw: 1.2 }) + p(`M${x + cw / 2} ${y + 23} v14 m-8 -8 h16 m-12 18 l4 -10 l4 10`, { sw: 1.2 });
});

T['concept-poster'] = () => sheet('Concept poster', ({ x, y, w, h }) => {
  let s = t(x, y + 16, 'Name', { size: 16, w: 900, italic: true, ls: false, fill: C.edge }) + l(x, y + 26, x + w, y + 26, { stroke: C.edge, sw: 1.4 }) + label(x, y + 36, 'One-line promise', { fill: C.ink3 });
  s += r(x, y + 44, w, 96, { fill: C.blush2 }) + label(x + 6, y + 55, 'How it works') + p(`M${x + 30} ${y + 110} q30 -40 60 -10 t60 -14`, { stroke: C.pink, sw: 3 });
  const bw = (w - 8) / 3;
  ['For', 'Why it works', 'To learn'].forEach((n, i) => { s += field(x + i * (bw + 4), y + 146, bw, h - 146, n); });
  return s;
}, { portrait: true });

T['service-blueprint'] = () => sheet('Service blueprint', ({ x, y, w, h }) => {
  const rows = ['Evidence', 'Customer', 'Front stage', 'Back stage', 'Support'], lw = 54, rh = h / rows.length, cols = 5, cw = (w - lw) / cols;
  let s = '';
  rows.forEach((n, j) => {
    const yy = y + j * rh;
    s += label(x, yy + rh / 2 + 2, n) + (j ? l(x + lw, yy, x + w, yy) : '');
    for (let i = 0; i < cols; i++) if ((i + j) % 2 === 0 || j === 1) s += r(x + lw + i * cw + 6, yy + 5, cw - 12, rh - 10, { fill: j === 1 ? C.blush : j === 0 ? C.blush2 : '#fff' });
  });
  s += l(x, y + rh * 3, x + w, y + rh * 3, { stroke: C.red, sw: 1.4, dash: '4 3' }) + t(x + w, y + rh * 3 - 3, 'LINE OF VISIBILITY', { size: 5.5, anchor: 'end', fill: C.red });
  for (let i = 0; i < cols - 1; i++) s += p(`M${x + lw + i * cw + cw - 6} ${y + rh * 1.5} h12`, { sw: 1 });
  return s;
});

T['feedback-grid'] = () => sheet('Feedback capture grid', ({ x, y, w, h }) => {
  const cw = (w - 6) / 2, ch = (h - 6) / 2;
  return [['+', 'Likes', C.mint], ['Δ', 'Changes', C.blush2], ['?', 'Questions', '#f1effc'], ['!', 'New ideas', '#fffaf0']].map(([k, n, f], i) => {
    const xx = x + (i % 2) * (cw + 6), yy = y + Math.floor(i / 2) * (ch + 6);
    return r(xx, yy, cw, ch, { fill: f }) + t(xx + 10, yy + 22, k, { size: 18, w: 900 }) + label(xx + 26, yy + 18, n);
  }).join('');
});

T['test-card'] = () => sheet('Test card', ({ x, y, w, h }) => {
  const rows = ['We believe that…', 'To verify that, we will…', 'And measure…', 'We are right if…'], rh = h / 4;
  return rows.map((n, i) => c(x + 7, y + i * rh + 8, 7, { fill: C.wine, stroke: C.wine }) + t(x + 7, y + i * rh + 10.5, String(i + 1), { size: 7, anchor: 'middle', fill: '#fff' })
    + label(x + 20, y + i * rh + 10.5, n) + l(x + 20, y + i * rh + 24, x + w, y + i * rh + 24, { stroke: C.edge, sw: 1.2 })).join('');
}, { card: true });

T['shareout-frame'] = () => sheet('Share-out frame', ({ x, y, w, h }) => {
  const beats = ['Discovery', 'Insight', 'HMW', 'Ideas', 'Direction', 'Prototype', 'Learn'], cw = w / beats.length;
  return beats.map((n, i) => {
    const xx = x + i * cw;
    return c(xx + cw / 2, y + 12, 9, { fill: C.wine, stroke: C.wine }) + t(xx + cw / 2, y + 15, String(i + 1), { size: 8, anchor: 'middle', fill: '#fff' })
      + (i < beats.length - 1 ? l(xx + cw / 2 + 10, y + 12, xx + cw * 1.5 - 10, y + 12, { stroke: C.pink, sw: 1.4 }) : '')
      + t(xx + cw / 2, y + 34, n.toUpperCase(), { size: 5.4, anchor: 'middle' }) + r(xx + 3, y + 42, cw - 6, h - 42, { fill: i % 2 ? C.blush2 : '#fff' }) + lines(xx + 7, y + 46, cw - 14, h - 46, 10);
  }).join('');
});

T['elevator-pitch'] = () => sheet('Elevator pitch', ({ x, y, w, h }) => {
  const rows = [['For', 34], ['who', 30], ['is a', 30], ['that', 30], ['Unlike', 40], ['ours', 30]], rh = h / rows.length;
  return rows.map(([n, off], i) => t(x, y + i * rh + 16, n, { size: 9, w: 700, italic: true, ls: false }) + l(x + off, y + i * rh + 17, x + w, y + i * rh + 17, { stroke: C.edge, sw: 1.3 })
    + (i === 2 ? r(x + off + 4, y + i * rh + 6, 50, 12, { fill: C.blush, stroke: C.blush, rx: 6 }) + t(x + off + 29, y + i * rh + 14.5, 'NAME', { size: 5.8, anchor: 'middle' }) : '')).join('');
}, { card: true });

T['dvf-scorecard'] = () => sheet('DVF scorecard', ({ x, y, w, h }) => {
  const heads = ['Idea', 'Desirable', 'Feasible', 'Viable'], ws = [0.31, 0.23, 0.23, 0.23], rows = 4, rh = (h - 16) / rows;
  let s = '', xx = x;
  heads.forEach((n, i) => {
    const cw = w * ws[i];
    s += r(xx, y, cw - 3, 12, { fill: i ? C.blush : C.wine, stroke: i ? C.blush : C.wine, rx: 3 }) + label(xx + 4, y + 8.5, n, { fill: i ? C.wine : '#fff' });
    for (let k = 0; k < rows; k++) {
      const yy = y + 16 + k * rh;
      s += r(xx, yy, cw - 3, rh - 4, { fill: '#fff' });
      if (i) for (let d = 0; d < 5; d++) s += c(xx + 9 + d * 10, yy + 10, 3.4, { fill: d < ((k + i) % 4) + 1 ? C.wine : 'none', stroke: C.wine, sw: 0.8 });
      if (i) s += l(xx + 5, yy + rh - 10, xx + cw - 9, yy + rh - 10);
    }
    xx += cw;
  });
  return s;
});

T['problem-card'] = () => sheet('Problem statement', ({ x, y, w, h }) => {
  const bw = (w - 8) / 3;
  return ['Who', 'Need / challenge', 'Insight / why it matters'].map((n, i) => field(x + i * (bw + 4), y, bw, h, n, { fill: i === 2 ? C.blush2 : '#fff' })).join('');
});

T['action-plan'] = () => sheet('Who, what, by when', ({ x, y, w, h }) => {
  const half = (w - 6) / 2;
  return field(x, y, w, h * 0.4, 'Next experiment') + field(x, y + h * 0.4 + 5, half, h * 0.24, 'Owner', { nolines: true }) + field(x + half + 6, y + h * 0.4 + 5, half, h * 0.24, 'By (date)', { nolines: true })
    + field(x, y + h * 0.68 + 5, w, h * 0.32 - 5, 'How we’ll know it worked', { fill: C.blush2 });
}, { card: true });

T['rose-bud-thorn'] = () => sheet('Rose, bud, thorn', ({ x, y, w, h }) => {
  const cw = (w - 12) / 3;
  const icons = [
    (cx, cy) => c(cx, cy, 7, { fill: C.pink, stroke: C.wine }) + p(`M${cx - 3} ${cy} q3 -5 6 0 q-3 4 -6 0`, { sw: 1 }),
    (cx, cy) => p(`M${cx} ${cy + 8} v-8 M${cx} ${cy} q-6 -2 -4 -9 q4 2 4 9 q0 -7 4 -9 q2 7 -4 9`, { stroke: '#1e7a55', sw: 1.2 }),
    (cx, cy) => p(`M${cx - 8} ${cy + 4} h16 M${cx - 3} ${cy + 4} l3 -9 l3 9`, { stroke: '#8a5a3c', sw: 1.4 }),
  ];
  return ['Rose', 'Bud', 'Thorn'].map((n, i) => {
    const xx = x + i * (cw + 6);
    return r(xx, y, cw, h, { fill: [C.blush2, C.mint, '#f8f1ec'][i] }) + icons[i](xx + cw / 2, y + 18) + t(xx + cw / 2, y + 40, n.toUpperCase(), { size: 8, anchor: 'middle' })
      + sticky(xx + 14, y + 54, C.sun, -3) + sticky(xx + cw - 34, y + 70, C.pink, 4) + sticky(xx + 24, y + 96, C.sun, 2);
  }).join('');
});

T['pre-survey'] = () => sheet('Pre-workshop survey', ({ x, y, w, h }) => {
  let s = field(x, y, w, 24, 'Name · role · team', { nolines: true });
  s += label(x, y + 38, 'Used design thinking before?');
  for (let i = 0; i < 5; i++) s += r(x + i * (w / 5), y + 42, w / 5 - 4, 12, { fill: i === 1 ? C.blush : '#fff', rx: 6 });
  s += t(x, y + 64, 'NEVER', { size: 5, fill: C.ink3 }) + t(x + w, y + 64, 'OFTEN', { size: 5, anchor: 'end', fill: C.ink3 });
  s += field(x, y + 72, w, 54, 'Worth your time if…') + field(x, y + 132, w, 54, 'A problem you’re close to');
  return s + field(x, y + 192, (w - 4) / 2, h - 192, 'Access', { nolines: true }) + field(x + (w + 4) / 2, y + 192, (w - 4) / 2, h - 192, 'Diet', { nolines: true });
}, { portrait: true });

T['run-sheet'] = () => sheet('Facilitator run sheet', ({ x, y, w, h }) => {
  const heads = ['Time', 'Block', 'Lead', 'What happens', 'Materials'], ws = [0.11, 0.2, 0.12, 0.37, 0.2], rows = 7, rh = (h - 16) / rows;
  const times = ['09:30', '09:45', '10:40', '10:55', '12:10', '12:55', '14:00'];
  let s = '', xx = x;
  heads.forEach((n, i) => {
    const cw = w * ws[i];
    s += label(xx + 2, y + 8, n);
    for (let k = 0; k < rows; k++) {
      const yy = y + 14 + k * rh;
      if (i === 0) s += t(xx + 2, yy + rh / 2 + 3, times[k], { size: 6.5, w: 700, fill: C.ink3, ls: false });
      else s += l(xx + 2, yy + rh / 2, xx + cw * (0.5 + ((k * 3 + i) % 4) * 0.12), yy + rh / 2, { stroke: k === 2 || k === 5 ? C.blush : C.rule, sw: 3 });
    }
    xx += cw;
  });
  for (let k = 0; k <= rows; k++) s += l(x, y + 14 + k * rh, x + w, y + 14 + k * rh, { stroke: C.rule });
  return s;
});

T['feedback-form'] = () => sheet('Feedback form', ({ x, y, w, h }) => {
  let s = label(x, y + 6, 'How likely to recommend? 0–10');
  const bw = w / 11;
  for (let i = 0; i <= 10; i++) s += r(x + i * bw, y + 11, bw - 2, 12, { fill: i === 9 ? C.wine : '#fff', stroke: i === 9 ? C.wine : C.edge, rx: 2 }) + t(x + i * bw + bw / 2 - 1, y + 19.5, String(i), { size: 5.5, w: 700, anchor: 'middle', fill: i === 9 ? '#fff' : C.ink3, ls: false });
  const parts = ['Most useful', 'Least useful', 'What you’ll use on Monday', 'Anything else'], bh = (h - 32) / parts.length;
  parts.forEach((n, i) => { s += field(x, y + 30 + i * bh, w, bh - 4, n); });
  return s;
}, { portrait: true });

let n = 0;
for (const [id, fn] of Object.entries(T)) {
  writeFileSync(join(OUT, `${id}.svg`), fn().replace(/\n\s*/g, '\n'));
  n++;
}
console.log(`Wrote ${n} template previews to public/img/templates/`);
