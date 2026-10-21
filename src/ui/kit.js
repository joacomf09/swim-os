// Piezas de interfaz compartidas. React, ReactDOM y htm llegan como globales
// (vendor/*.js), así que no hace falta empaquetador.
import { exerciseArt, FALLBACK_ART } from '../art.js';

export const { useState, useEffect, useRef, useMemo, useCallback } = React;
export const html = htm.bind(React.createElement);

/* ───────── formato ───────── */
export const fmtM = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const pad = (n) => String(n).padStart(2, '0');
export function clock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(sec % 60)}` : `${m}:${pad(sec % 60)}`;
}
export const clockMs = (ms) => clock(ms / 1000);
export const tenth = (ms) => Math.floor(Math.max(0, ms) % 1000 / 100);
export function laps(dist, pool) {
  const n = dist / pool;
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace('.', ',');
}
export const lapWord = (d, p) => (d / p === 1 ? 'largo' : 'largos');
export function dateLong(ts) {
  try { return new Date(ts).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return ''; }
}
export const dateShort = (ts) => { try { return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }); } catch (e) { return ''; } };
export const pace = (s) => (s ? clock(s) : '—');

/* ───────── iconos ───────── */
const IC = {
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14', upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  play: 'M7 4.5v15l12-7.5z', pause: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z', check: 'M4.5 12.5l5 5L19.5 7',
  next: 'M5 5l9 7-9 7zM17 5h2v14h-2z', prev: 'M19 5l-9 7 9 7zM5 5h2v14H5z', plus: 'M12 5v14M5 12h14',
  up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  timer: 'M12 8v5l3 2M9 2h6M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', hist: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', rest: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 7v5h4',
  x: 'M6 6l12 12M18 6L6 18', book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8l-1 3 2 1v2l-2 1 1 3 2-.5 1.5 1.5-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', dice: 'M5 5h14v14H5zM9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4', swap: 'M7 7h12l-3-3M17 17H5l3 3', warn: 'M12 4l9 16H3zM12 10v4M12 17.5h.01',
  copy: 'M9 9h10v11H9zM5 15V4h10', back: 'M15 5l-7 7 7 7', info: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 11v5M12 8h.01',
};
const FILLED = new Set(['play', 'pause', 'next', 'prev']);
export function Icon({ n }) {
  const f = FILLED.has(n);
  return html`<svg viewBox="0 0 24 24" aria-hidden="true" fill=${f ? 'currentColor' : 'none'} stroke=${f ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d=${IC[n] || IC.info}/></svg>`;
}
export function Logo() {
  return html`<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="22" cy="10" r="4" fill="var(--aqua)"/><path d="M4 18l9-6 6 4" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 25q4-4 8 0t8 0 8 0 4 0" fill="none" stroke="var(--electric)" strokeWidth="3" strokeLinecap="round"/></svg>`;
}

/* ───────── ilustraciones (SVG local, con respaldo) ───────── */
const artCache = new Map();
export function artSvg(ex, label) {
  const key = ex ? ex.id : 'fallback';
  if (!artCache.has(key)) {
    let svg;
    try { svg = exerciseArt(ex ? ex.art : FALLBACK_ART, { label: label || (ex && ex.name) || 'Ejercicio' }); }
    catch (e) { svg = exerciseArt(FALLBACK_ART, { label: 'Ejercicio' }); }
    artCache.set(key, svg);
  }
  return artCache.get(key);
}
export function Art({ ex, className }) {
  return html`<span className=${'art ' + (className || '')} dangerouslySetInnerHTML=${{ __html: artSvg(ex) }}/>`;
}

/* ───────── hooks ───────── */
/** Reloj de pantalla: se refresca a menudo y al volver a la pestaña. */
export function useNow(active, every = 200) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, every);
    const vis = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('focus', tick);
    window.addEventListener('pageshow', tick);
    tick();
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); window.removeEventListener('focus', tick); window.removeEventListener('pageshow', tick); };
  }, [active, every]);
  return now;
}

/* ───────── componentes ───────── */
export function Segmented({ value, options, onChange, label }) {
  return html`<div className="seg" role="group" aria-label=${label}>${options.map(([v, l]) => html`<button key=${v} type="button" aria-pressed=${value === v} onClick=${() => onChange(v)}>${l}</button>`)}</div>`;
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 99999, unit = '', label, format }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return html`<div className="stepper" role="group" aria-label=${label}>
    <button type="button" aria-label=${'Menos ' + label} onClick=${() => set(value - step)} disabled=${value <= min}>−</button>
    <span className="num"><b>${format ? format(value) : value}</b>${unit && html`<small>${unit}</small>`}</span>
    <button type="button" aria-label=${'Más ' + label} onClick=${() => set(value + step)} disabled=${value >= max}>+</button>
  </div>`;
}

/** Hoja inferior modal. */
export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return html`<div className="sheet-bg" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label=${title}>
      <div className="sheet-h"><h2>${title}</h2><button type="button" className="ghost" onClick=${onClose} aria-label="Cerrar"><${Icon} n="x"/></button></div>
      <div className="sheet-b">${children}</div>
    </div>
  </div>`;
}

export function Toast({ msg }) {
  return msg ? html`<div className="toast" role="status">${msg}</div>` : null;
}

/** Sugerencias de arreglo (diagnóstico). */
export function Issues({ issues, onFix, tone = 'bad' }) {
  if (!issues || !issues.length) return null;
  return html`<div className="issues">${issues.map((it, i) => html`<div key=${it.code + i} className=${'note ' + (it.severity === 'warn' ? 'bad' : 'err')}>
    <div className="note-t"><${Icon} n="warn"/><span>${it.message}</span></div>
    ${it.fixes && it.fixes.length > 0 && html`<div className="fixes">${it.fixes.map((f, j) => html`<button key=${j} type="button" className="btn small" onClick=${() => onFix(f)}>${f.label}</button>`)}</div>`}
  </div>`)}</div>`;
}

export function useStored(store, key, initial) {
  const [v, setV] = useState(() => store.get(key, initial));
  useEffect(() => { store.set(key, v); }, [key, v]);
  return [v, setV];
}

/* ───────── sonido y vibración ───────── */
let audio = null;
export function beep(freq = 880, ms = 140) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = audio || new AC();
    if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4, audio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + ms / 1000);
    o.connect(g); g.connect(audio.destination);
    o.start(); o.stop(audio.currentTime + ms / 1000 + 0.02);
  } catch (e) { /* sin audio */ }
}
export function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* iOS no vibra */ } }
