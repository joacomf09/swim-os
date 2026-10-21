// @ts-check
// Ilustraciones SVG locales, una por ejercicio. Se componen a partir de una
// especificación (postura, brazos, piernas, material, marca) para que cada
// ejercicio muestre su propio movimiento y su propio material.
// No hay imágenes externas: nada puede romperse sin conexión.

const INK = 'var(--fig-ink)';
const AQ = 'var(--aqua)';
const EL = 'var(--electric)';
const WARN = 'var(--warn)';
const ICE = 'var(--ice)';

let uid = 0;

const attrs = (o) =>
  (o.op != null ? ` opacity="${o.op}"` : '') + (o.dash ? ` stroke-dasharray="${o.dash}"` : '');
const pl = (pts, w, o = {}) =>
  `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${o.c || INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${attrs(o)}/>`;
const pa = (d, w, o = {}) =>
  `<path d="${d}" fill="none" stroke="${o.c || INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${attrs(o)}/>`;
const dot = (x, y, r, fill, op) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${op != null ? ` opacity="${op}"` : ''}/>`;
const head = (x, y) =>
  dot(x, y, 11, INK) + `<path d="M${x - 11} ${y - 1} a11 11 0 0 1 22 0z" fill="${AQ}"/>`;
const text = (x, y, s, size = 16, fill = INK, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="var(--f-display),sans-serif" font-weight="700" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${s}</text>`;

/* ───────── postura boca abajo (mira a la derecha) ───────── */
function legsProne(s) {
  const eq = s.eq || [];
  let o = '';
  /** @type {number[][]} */
  let feet = [];
  switch (s.legs) {
    case 'frog':
      o += pl([[142, 79], [114, 104], [88, 90]], 10) + pl([[140, 76], [120, 98], [96, 106]], 9, { op: 0.45 });
      o += pa('M80 112 Q66 96 78 78', 2.5, { c: AQ, dash: '4 4' });
      feet = [[88, 90], [96, 106]];
      break;
    case 'dolphin':
      o += pa('M146 80 C124 94 106 62 84 76 S58 92 46 80', 12);
      feet = [[46, 80]];
      break;
    case 'side':
      o += pl([[142, 76], [104, 62], [68, 62]], 10) + pl([[142, 79], [106, 96], [72, 98]], 9, { op: 0.7 });
      feet = [[68, 62], [72, 98]];
      break;
    case 'still':
      o += pl([[142, 78], [70, 80]], 11);
      feet = [[70, 80]];
      break;
    default:
      o += pl([[142, 76], [72, 72]], 10) + pl([[140, 79], [76, 92]], 9, { op: 0.7 });
      feet = [[72, 72], [76, 92]];
  }
  if (eq.includes('fins')) {
    for (const [fx, fy] of feet) {
      o += `<polygon points="${fx},${fy - 4} ${fx - 26},${fy - 11} ${fx - 26},${fy + 11} ${fx},${fy + 4}" fill="${WARN}"/>`;
    }
  }
  if (s.splash) {
    o += dot(52, 62, 3, AQ, 0.85) + dot(44, 70, 2.5, AQ, 0.85) + dot(58, 54, 2, AQ, 0.85) + dot(46, 56, 1.8, AQ, 0.85);
  }
  if (s.wave) {
    o += pa('M64 104 C80 94 92 114 108 104 S136 94 152 104', 2.5, { c: AQ, dash: '5 5' });
  }
  return o;
}

function armsProne(s) {
  const eq = s.eq || [];
  const pad = eq.includes('paddles');
  let o = '';
  /** @type {number[][]} */
  let hands = [];
  switch (s.arms) {
    case 'extended':
      o += pl([[206, 74], [294, 77]], 7) + pl([[206, 77], [290, 81]], 7, { op: 0.55 });
      hands = [[294, 77]];
      break;
    case 'streamline':
      o += pl([[206, 74], [298, 76]], 9);
      hands = [[298, 76]];
      break;
    case 'catchup':
      o += pl([[206, 76], [292, 79]], 7, { op: 0.9 }) + pl([[206, 73], [190, 38], [164, 46]], 7);
      break;
    case 'fingertip':
      o += pl([[206, 73], [192, 40], [166, 68]], 7);
      o += `<ellipse cx="164" cy="73" rx="12" ry="3" fill="none" stroke="${AQ}" stroke-width="2"/>`;
      o += dot(158, 66, 2, AQ) + dot(172, 64, 1.8, AQ);
      break;
    case 'onearm':
      o += pl([[206, 73], [188, 36], [160, 44]], 7) + pl([[206, 78], [150, 84]], 6, { op: 0.55 });
      break;
    case 'onearm-fwd':
      o += pl([[206, 76], [292, 79]], 7) + pl([[206, 76], [224, 102], [196, 118]], 7, { c: AQ });
      break;
    case 'catch':
      o += pl([[206, 74], [292, 78]], 7, { op: 0.6 }) + pl([[206, 77], [234, 92], [232, 124]], 7, { c: AQ });
      break;
    case 'recovery':
      o += pl([[206, 73], [190, 28], [160, 42]], 7);
      o += `<circle cx="190" cy="28" r="7" fill="none" stroke="${AQ}" stroke-width="2.5"/>`;
      break;
    case 'side':
      o += pl([[206, 76], [292, 80]], 7) + pl([[206, 70], [150, 72]], 6, { op: 0.6 });
      break;
    case 'sweep':
      o += pl([[216, 82], [250, 98], [274, 86]], 7);
      break;
    case 'fly':
      o += pl([[206, 72], [236, 30], [270, 50]], 7) + pl([[206, 74], [232, 34], [266, 56]], 7, { op: 0.5 });
      break;
    case 'none':
      break;
    default: // crawl
      o += pl([[206, 73], [188, 36], [160, 44]], 7) + pl([[206, 76], [216, 102], [190, 114]], 7, { op: 0.5 });
      hands = [[160, 44], [190, 114]];
  }
  if (pad) {
    for (const [hx, hy] of hands) {
      o += `<rect x="${hx - 7}" y="${hy - 4}" width="15" height="24" rx="4" fill="${AQ}" transform="rotate(-20 ${hx} ${hy})"/>`;
    }
  }
  return o;
}

function proneFigure(s) {
  const eq = s.eq || [];
  const curved = s.legs === 'dolphin' || s.pose === 'fly';
  let o = legsProne(s);
  o += curved ? pa('M146 82 C168 66 186 82 206 73', 16) : pl([[146, 77], [206, 73]], 16);
  if (eq.includes('buoy')) o += `<ellipse cx="124" cy="81" rx="16" ry="9" fill="${WARN}"/>`;
  o += armsProne(s);
  if (eq.includes('board')) o += `<rect x="262" y="61" width="52" height="18" rx="7" fill="${EL}"/>`;
  o += head(228, 69);
  if (eq.includes('snorkel')) {
    o += pa('M238 62 Q250 40 240 26', 3.5, { c: WARN }) + dot(240, 25, 4, WARN);
  }
  if (s.rotate) {
    o += pa('M172 48 A24 24 0 0 1 172 100', 3, { c: AQ, dash: '5 4' });
    o += `<polygon points="172,104 164,96 182,94" fill="${AQ}"/>`;
  }
  return o;
}

/* ───────── postura boca arriba ───────── */
function supineFigure(s) {
  let o = '';
  switch (s.legs) {
    case 'dolphin':
      o += pa('M148 80 C128 66 110 94 88 80 S62 68 48 80', 12);
      o += pa('M70 108 C86 98 98 118 114 108 S142 98 158 108', 2.5, { c: AQ, dash: '5 5' });
      break;
    case 'still':
      o += pl([[142, 78], [72, 80]], 11);
      break;
    default:
      o += pl([[142, 78], [74, 72]], 10) + pl([[142, 81], [78, 92]], 9, { op: 0.7 });
      if (s.splash) o += dot(54, 62, 3, AQ, 0.85) + dot(46, 70, 2.5, AQ, 0.85) + dot(60, 54, 2, AQ, 0.85);
  }
  o += pa('M146 78 C168 76 188 80 206 76', 16);
  switch (s.arms) {
    case 'overhead':
      o += pl([[214, 76], [298, 74]], 8);
      break;
    case 'none':
      break;
    default: // backcrawl
      o += pl([[206, 74], [214, 40], [212, 12]], 7) + pl([[206, 79], [238, 98], [264, 94]], 7, { op: 0.5 });
  }
  o += head(230, 74);
  if (s.rotate) {
    o += pa('M172 52 A24 24 0 0 1 172 100', 3, { c: AQ, dash: '5 4' });
    o += `<polygon points="172,104 164,96 182,94" fill="${AQ}"/>`;
  }
  return o;
}

/* ───────── braza ───────── */
function breastFigure(s) {
  let o = '';
  o += pl([[144, 92], [118, 112], [92, 98]], 10) + pl([[142, 90], [124, 106], [100, 112]], 9, { op: 0.45 });
  o += pl([[146, 90], [206, 76]], 16);
  o += pl([[216, 84], [250, 100], [274, 88]], 7);
  o += pl([[216, 84], [244, 110]], 7, { op: 0.5 });
  o += head(228, 58);
  return o;
}

/* ───────── composiciones (IM y mixto): paneles con un mini nadador por estilo ───────── */
function panel(spec, x, y, w, h, label) {
  const inner = spec.pose === 'supine' ? supineFigure(spec) : spec.pose === 'breast' ? breastFigure(spec) : spec.pose === 'fly' ? proneFigure(spec) : proneFigure(spec);
  const k = 0.46;
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="var(--surface-2)" opacity=".9"/>` +
    `<g transform="translate(${f(x + w / 2 - 172 * k)} ${f(y + 4 - 10 * k)}) scale(${k})">${inner}</g>` +
    text(x + 10, y + h - 7, label, 13, ICE)
  );
}
const f = (n) => Math.round(n * 10) / 10;
function compositeIM() {
  return (
    panel({ pose: 'fly', arms: 'fly', legs: 'dolphin' }, 4, 2, 154, 70, '1 MARIPOSA') +
    panel({ pose: 'supine', arms: 'backcrawl', legs: 'flutter' }, 162, 2, 154, 70, '2 ESPALDA') +
    panel({ pose: 'breast', arms: 'sweep', legs: 'frog' }, 4, 76, 154, 70, '3 BRAZA') +
    panel({ pose: 'prone', arms: 'crawl', legs: 'flutter' }, 162, 76, 154, 70, '4 CROL')
  );
}
function compositeMixed() {
  return (
    panel({ pose: 'prone', arms: 'crawl', legs: 'flutter' }, 4, 40, 154, 70, 'CROL') +
    panel({ pose: 'supine', arms: 'backcrawl', legs: 'flutter' }, 162, 40, 154, 70, 'ESPALDA') +
    text(160, 82, '+', 30, AQ, 'middle')
  );
}

/* ───────── marcas: informan del tipo de serie ───────── */
function mark(m) {
  if (!m) return '';
  if (m.includes('+')) return m.split('+').map(mark).join('');
  if (m.startsWith('dist:')) {
    const n = m.slice(5);
    return `<rect x="232" y="10" width="76" height="28" rx="14" fill="var(--surface-2)" stroke="${AQ}" stroke-width="1.5"/>` + text(270, 31, `${n} m`, 19, INK, 'middle');
  }
  switch (m) {
    case 'sprint':
      return `<g stroke="${AQ}" stroke-width="3" stroke-linecap="round" opacity=".85"><line x1="14" y1="58" x2="54" y2="58"/><line x1="4" y1="76" x2="48" y2="76"/><line x1="18" y1="94" x2="56" y2="94"/></g>`;
    case 'build':
      return [0, 1, 2, 3].map((i) => `<rect x="${16 + i * 15}" y="${46 - (i + 1) * 8}" width="10" height="${(i + 1) * 8}" rx="2" fill="${AQ}" opacity="${0.4 + i * 0.2}"/>`).join('');
    case 'descend':
      return (
        `<circle cx="34" cy="30" r="15" fill="none" stroke="${INK}" stroke-width="3"/><line x1="34" y1="30" x2="34" y2="20" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><line x1="34" y1="30" x2="42" y2="34" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
        `<line x1="66" y1="16" x2="66" y2="42" stroke="${AQ}" stroke-width="4" stroke-linecap="round"/><polyline points="58,34 66,44 74,34" fill="none" stroke="${AQ}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
      );
    case 'intervals':
      return (
        [0, 1, 2].map((i) => `<rect x="${14 + i * 12}" y="16" width="7" height="26" rx="2" fill="${AQ}"/>`).join('') +
        [0, 1].map((i) => `<rect x="${64 + i * 12}" y="26" width="7" height="16" rx="2" fill="${ICE}" opacity=".5"/>`).join('')
      );
    case 'pace':
      return pa('M12 34 q6 -16 12 0 t12 0 t12 0 q4 -6 8 0 t8 0 t8 0', 3.5, { c: AQ });
    case 'lane':
      return Array.from({ length: 20 }, (_, i) => `<rect x="${i * 16 + 2}" y="20" width="12" height="9" rx="4.5" fill="${i % 4 === 0 ? 'var(--danger)' : i % 2 ? EL : ICE}" opacity=".85"/>`).join('');
    case 'rate':
      return `<polygon points="30,44 50,44 44,12 36,12" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><line x1="40" y1="40" x2="48" y2="16" stroke="${AQ}" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="22" r="3" fill="${AQ}"/>`;
    case 'coord':
      return pa('M150 38 a16 16 0 1 1 -12 14', 3, { c: AQ, dash: '4 4' }) + pa('M90 118 a14 14 0 1 0 12 -12', 3, { c: AQ, dash: '4 4' });
    case 'glide':
      return `<g fill="none" stroke="${AQ}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="16,20 26,30 16,40"/><polyline points="34,20 44,30 34,40" opacity=".7"/><polyline points="52,20 62,30 52,40" opacity=".45"/></g>`;
    default:
      return '';
  }
}

/**
 * @param {import('./types').ArtSpec} spec
 * @param {{label?: string}} [opts]
 * @returns {string} Cadena SVG completa.
 */
export function exerciseArt(spec, opts = {}) {
  const gid = `wg${++uid}`;
  const m = spec.mark || '';
  let fig;
  if (m === 'im') fig = compositeIM();
  else if (m === 'mixed') fig = compositeMixed();
  else if (spec.pose === 'supine') fig = supineFigure(spec);
  else if (spec.pose === 'breast') fig = breastFigure(spec);
  else fig = proneFigure(spec);
  const label = (opts.label || 'Ejercicio de natación').replace(/"/g, '&quot;');
  return (
    `<svg viewBox="0 0 320 150" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F3F7A"/><stop offset="1" stop-color="#051029"/></linearGradient></defs>` +
    `<rect width="320" height="150" fill="var(--sky)"/>` +
    `<rect y="72" width="320" height="78" fill="url(#${gid})"/>` +
    `<rect y="136" width="300" height="5" fill="#020A1E"/><rect x="296" y="128" width="5" height="21" fill="#020A1E"/>` +
    fig +
    mark(m === 'im' || m === 'mixed' ? '' : m) +
    (m === 'im' || m === 'mixed' ? '' : `<path d="M0 72 ${Array.from({ length: 16 }, (_, i) => `Q${i * 20 + 10} ${i % 2 ? 77 : 67} ${i * 20 + 20} 72`).join(' ')}" fill="none" stroke="${AQ}" stroke-opacity=".5" stroke-width="2"/>`) +
    `</svg>`
  );
}

/** Ilustración genérica de reserva (nunca se muestra una imagen rota). */
export const FALLBACK_ART = /** @type {import('./types').ArtSpec} */ ({ pose: 'prone', arms: 'crawl', legs: 'flutter' });
