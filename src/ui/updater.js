// Actualización dentro de la app: avisa de la versión nueva, muestra el progreso con
// un nadador animado y confirma al terminar. Los entrenamientos guardados no se tocan:
// solo se renuevan los archivos de la app (caché), nunca el almacenamiento de datos.
import { html, useState, useEffect, useRef, useCallback, Icon } from './kit.js';
import { VERSION } from '../version.js';
import { isNewer, parseRemote } from '../update.js';

const DONE_KEY = 'swimos.updated';
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Consulta version.json (siempre a la red) y dice si hay una versión más nueva. */
export function useUpdateCheck() {
  const [remote, setRemote] = useState(null);
  const [state, setState] = useState('idle'); // idle | checking | uptodate | offline
  const check = useCallback(async () => {
    setState('checking');
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      const v = parseRemote(await r.json());
      if (v && isNewer(v, VERSION)) { setRemote(v); setState('idle'); } else { setRemote(null); setState('uptodate'); }
    } catch (e) { setState('offline'); }
  }, []);
  useEffect(() => {
    check();
    const vis = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', vis);
    const id = setInterval(check, 15 * 60 * 1000);
    return () => { document.removeEventListener('visibilitychange', vis); clearInterval(id); };
  }, [check]);
  return { remote, state, check };
}

/** Qué pasó en la actualización anterior (se lee una sola vez al abrir). */
export function takeUpdateResult() {
  const d = read(DONE_KEY);
  if (!d) return null;
  write(DONE_KEY, null);
  return { ...d, ok: d.to === VERSION || isNewer(VERSION, d.to) };
}

const STEPS = ['Buscando archivos nuevos', 'Descargando la versión', 'Reemplazando la anterior', 'Reiniciando SWIM OS'];

export async function runUpdate(to, onStep) {
  onStep(0); await sleep(600);
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    onStep(1); if (reg) { try { await reg.update(); } catch (e) { /* sin red */ } } await sleep(700);
    onStep(2);
    if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
    await sleep(700);
  } catch (e) { /* si algo falla, igual recargamos */ }
  write(DONE_KEY, { from: VERSION, to });
  onStep(3); await sleep(700);
  location.replace(location.pathname + '?u=' + Date.now());
}

export function UpdateOverlay({ from, to }) {
  const [step, setStep] = useState(0);
  const [fast, setFast] = useState(false);
  const started = useRef(false);
  useEffect(() => { if (started.current) return; started.current = true; runUpdate(to, setStep); }, []);
  return html`<div className="upd" role="alertdialog" aria-modal="true" aria-live="polite" aria-label="Actualizando SWIM OS">
    <div className="upd-in">
      <div className="upd-ver"><span>${from}</span><span className="arr" aria-hidden="true">→</span><b>${to}</b></div>
      <h2>Actualizando SWIM OS…</h2>
      <button type="button" className=${'upd-lane' + (fast ? ' fast' : '')} onClick=${() => setFast(!fast)} aria-label="Tocá para que nade más rápido">
        <svg viewBox="0 0 320 110" aria-hidden="true">
          <rect width="320" height="110" rx="16" fill="#0a2a5a"/>
          <g stroke="#2a6fd0" strokeWidth="3" strokeDasharray="3 7"><line x1="0" y1="28" x2="320" y2="28"/><line x1="0" y1="82" x2="320" y2="82"/></g>
          <line x1="10" y1="55" x2="310" y2="55" stroke="#1d4b8f" strokeWidth="2" strokeDasharray="14 10"/>
          <g className="sw"><rect x="-18" y="-9" width="36" height="18" rx="9" fill="#eaf2ff"/><circle cx="11" cy="0" r="6" fill="#22d3c5"/></g>
          <g className="bub" fill="none" stroke="#7fe9ff" strokeWidth="1.5"><circle cx="60" cy="40" r="3"/><circle cx="130" cy="70" r="2.5"/><circle cx="210" cy="38" r="3.5"/><circle cx="270" cy="72" r="2.5"/></g>
        </svg>
      </button>
      <p className="upd-hint">Tocá el carril para que nade más rápido.</p>
      <ol className="upd-steps">${STEPS.map((t, i) => html`<li key=${i} className=${i < step ? 'done' : i === step ? 'now' : ''}><i>${i < step ? '✓' : ''}</i>${t}</li>`)}</ol>
      <p className="upd-hint">Tus entrenamientos e historial no se tocan.</p>
    </div>
  </div>`;
}

export function UpdateDone({ from, to, ok, onClose }) {
  return html`<div className="sheet-bg" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet" role="alertdialog" aria-modal="true">
      <div className="sheet-b upd-done">
        <div className=${'badge' + (ok ? '' : ' bad')}>${ok ? '✓' : '!'}</div>
        <h2>${ok ? 'Actualizado a la versión ' + to : 'No se pudo actualizar'}</h2>
        <p className="muted">${ok ? 'Venías de la ' + from + '. Ya estás usando lo último.' : 'Sigue la versión ' + from + '. Revisá la conexión y probá de nuevo desde Ajustes.'}</p>
        <button type="button" className="btn big primary" onClick=${onClose}>LISTO</button>
      </div>
    </div>
  </div>`;
}

export function UpdateBanner({ from, to, onUpdate }) {
  return html`<div className="note ok upd-banner"><b>Hay una versión nueva: ${from} → ${to}</b>
    <div className="fixes"><button type="button" className="btn small primary" onClick=${onUpdate}><${Icon} n="download"/>Actualizar ahora</button></div></div>`;
}
