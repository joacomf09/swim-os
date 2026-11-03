// Aviso de instalación para iPhone: la primera vez que se abre en Safari (fuera
// de la pantalla de inicio) explica cómo añadirla, con los iconos de iOS dibujados en SVG.
import { html, useState, Icon } from './kit.js';

const SEEN_KEY = 'swimos.installSeen';

export function isIos() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
export function isStandalone() {
  try { return !!navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); } catch (e) { return false; }
}
export function shouldShowInstall() {
  if (!isIos() || isStandalone()) return false;
  try { return localStorage.getItem(SEEN_KEY) !== '1'; } catch (e) { return true; }
}
export function markInstallSeen() { try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* sin almacenamiento */ } }

/** Botón Compartir de iOS: cuadrado abierto con flecha hacia arriba. */
export function ShareIcon({ size = 28 }) {
  return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 15V3.5M8.2 7.2 12 3.4l3.8 3.8"/><path d="M8 10H6.8A2.3 2.3 0 0 0 4.5 12.3v6.9a2.3 2.3 0 0 0 2.3 2.3h10.4a2.3 2.3 0 0 0 2.3-2.3v-6.9A2.3 2.3 0 0 0 17.2 10H16"/></svg>`;
}
/** Icono de "Añadir a pantalla de inicio": cuadrado redondeado con un más. */
export function AddHomeIcon({ size = 28 }) {
  return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.2"/><path d="M12 8v8M8 12h8"/></svg>`;
}

function SafariBar() {
  return html`<div className="sbar" aria-hidden="true">
    <span className="sb-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg></span>
    <span className="sb-ic dim"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg></span>
    <span className="sb-ic hot"><${ShareIcon} size=${26}/><span className="pulse"></span></span>
    <span className="sb-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg></span>
    <span className="sb-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="7.5" width="12" height="12" rx="2.5"/><path d="M8.5 7.5V5.7A2.2 2.2 0 0 1 10.7 3.5h7.6a2.2 2.2 0 0 1 2.2 2.2v7.6a2.2 2.2 0 0 1-2.2 2.2h-2.8"/></svg></span>
    <span className="arrow"><svg width="22" height="30" viewBox="0 0 22 30" fill="none" stroke="var(--aqua)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3v22M4 18l7 8 7-8"/></svg></span>
  </div>`;
}

export function InstallPrompt({ onDone, onLater, firstTime = true }) {
  const [step, setStep] = useState(0);
  return html`<div className="sheet-bg" onClick=${(e) => { if (e.target === e.currentTarget) onLater(); }}>
    <div className="sheet install" role="dialog" aria-modal="true" aria-label="Instalar SWIM OS en el iPhone">
      <div className="sheet-h"><h2>${firstTime ? 'Instalá SWIM OS en tu iPhone' : 'Cómo instalarla en el iPhone'}</h2><button type="button" className="ghost" onClick=${onLater} aria-label="Cerrar"><${Icon} n="x"/></button></div>
      <div className="sheet-b">
        <p className="hint">${firstTime ? 'Si es la primera vez que la instalás, hacelo ahora: se abre a pantalla completa, funciona sin conexión y no se borra al cerrar Safari.' : 'Se abre a pantalla completa y funciona sin conexión.'}</p>
        <ol className="ins-steps">
          <li className=${step === 0 ? 'on' : ''}><span className="n">1</span><div><b>Tocá el botón Compartir</b><small>Está en la barra de abajo de Safari (en iPad, arriba a la derecha).</small>
            <div className="ins-demo"><${SafariBar}/></div>
            <div className="ins-key"><span className="key"><${ShareIcon}/></span><span>Compartir</span></div></div></li>
          <li className=${step === 1 ? 'on' : ''}><span className="n">2</span><div><b>Elegí «Añadir a pantalla de inicio»</b><small>Deslizá hacia arriba la lista de opciones hasta encontrarla.</small>
            <div className="ins-row"><span>Añadir a pantalla de inicio</span><span className="ric"><${AddHomeIcon} size=${26}/></span></div></div></li>
          <li className=${step === 2 ? 'on' : ''}><span className="n">3</span><div><b>Tocá «Añadir»</b><small>Arriba a la derecha. Después abrila desde el ícono SWIM OS de tu pantalla de inicio.</small>
            <div className="ins-add"><span>Cancelar</span><b>Añadir</b></div></div></li>
        </ol>
        <p className="hint">Tenés que hacerlo desde <b>Safari</b>. Tus entrenamientos se guardan en el dispositivo: si ya usabas la web, exportá una copia en Ajustes antes de instalar, porque el ícono tiene su propio almacenamiento.</p>
        <div className="tools"><button type="button" className="btn primary" onClick=${onDone}>Entendido, no mostrar más</button><button type="button" className="btn" onClick=${onLater}>Más tarde</button></div>
      </div>
    </div>
  </div>`;
}
