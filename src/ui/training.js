// Modo entrenamiento en vivo y resumen final. Los tiempos salen siempre de
// marcas de reloj reales (session.js), nunca de contadores que se pierdan al
// bloquear la pantalla o cambiar de pestaña.
import { html, useState, useEffect, useRef, Icon, Art, useNow, beep, buzz, fmtM, laps, lapWord, clock, clockMs, tenth, pace } from './kit.js';
import { BLOCKS, BLOCK_ORDER, BY_ID, intensityText, RPE_LABEL, exerciseById } from '../library.js';
import * as S from '../engine/session.js';

function useWakeLock(on) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return undefined;
    let lock = null, dead = false;
    const get = async () => { try { lock = await navigator.wakeLock.request('screen'); } catch (e) { /* no disponible */ } };
    get();
    const vis = () => { if (!document.hidden && !dead) get(); };
    document.addEventListener('visibilitychange', vis);
    return () => { dead = true; document.removeEventListener('visibilitychange', vis); try { lock && lock.release(); } catch (e) { /* ya liberado */ } };
  }, [on]);
}

/**
 * Anillo de descanso fluido: se redibuja en cada fotograma (requestAnimationFrame)
 * a partir de marcas de tiempo reales, sin depender del reloj de 200 ms de la pantalla.
 */
function Ring({ phaseStart, restMs, pausedAt, children, go }) {
  const R = 92, C = 2 * Math.PI * R;
  const arc = useRef(null);
  const frac = () => {
    if (!restMs) return 0;
    const t = pausedAt != null ? pausedAt : Date.now();
    return Math.min(1, Math.max(0, 1 - (t - phaseStart) / restMs));
  };
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const f = frac();
      if (arc.current) {
        arc.current.style.strokeDashoffset = String(C * (1 - f));
        arc.current.style.opacity = f <= 0.002 ? '0' : '1';
      }
      if (pausedAt == null && f > 0) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [phaseStart, restMs, pausedAt]);
  const f0 = frac();
  return html`<div className=${'ring' + (go ? ' go' : '')}><svg viewBox="0 0 210 210" aria-hidden="true">
    <circle cx="105" cy="105" r=${R} fill="none" stroke="var(--surface-2)" strokeWidth="12"/>
    <circle ref=${arc} cx="105" cy="105" r=${R} fill="none" stroke=${go ? 'var(--aqua)' : 'var(--electric)'} strokeWidth="12" strokeLinecap="round" strokeDasharray=${C} style=${{ strokeDashoffset: C * (1 - f0), willChange: 'stroke-dashoffset' }}/></svg>
    <div className="c">${children}</div></div>`;
}

/**
 * Carril: el nadador va hasta la pared del fondo y vuelve al celular (una ida y vuelta).
 * Posición calculada en cada fotograma desde el tiempo real de la serie.
 */
function Lane({ phase, getElapsed, cycleMs, paused }) {
  const sw = useRef(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      let x = 22, flip = false;
      if (phase === 'swim') {
        const p = (getElapsed() % cycleMs) / cycleMs;
        x = 22 + (p < 0.5 ? p * 2 : (1 - p) * 2) * 270; flip = p >= 0.5;
      }
      if (sw.current) sw.current.setAttribute('transform', `translate(${x.toFixed(1)} 65)${flip ? ' scale(-1 1)' : ''}`);
      if (phase === 'swim' && !paused) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [phase, cycleMs, paused]);
  return html`<svg className="lane" viewBox="0 0 320 130" role="img" aria-label="Carril de la piscina: el celular está en la pared de salida">
    <rect x="0" y="20" width="320" height="90" rx="10" fill="#0a2a5a"/>
    <g stroke="#2a6fd0" strokeWidth="3" strokeDasharray="3 7"><line x1="0" y1="42" x2="320" y2="42"/><line x1="0" y1="88" x2="320" y2="88"/></g>
    <line x1="14" y1="65" x2="306" y2="65" stroke="#1d4b8f" strokeWidth="2" strokeDasharray="14 10"/>
    <rect x="2" y="18" width="12" height="94" rx="3" fill="#22d3c5"/>
    <g transform="translate(26 8)" fill="none" stroke="#22d3c5" strokeWidth="1.6"><rect width="14" height="22" rx="3"/><circle cx="7" cy="17.5" r="1.1" fill="#22d3c5"/></g>
    <g ref=${sw} transform="translate(22 65)"><rect x="-16" y="-8" width="32" height="16" rx="8" fill="#eaf2ff"/><circle cx="10" cy="0" r="5" fill="#22d3c5"/></g>
    <text x="160" y="125" textAnchor="middle" fill="#8ea6d6" fontSize="11">celular en la pared · ida y vuelta</text>
  </svg>`;
}

export function Training({ session, setSession, pool, onExit }) {
  const s = session;
  const running = s.phase === 'swim' || s.phase === 'rest';
  const now = useNow(running || s.phase === 'ready', 200);
  useWakeLock(true);
  const step = S.current(s);
  const nxt = S.upcoming(s, 1)[0];
  const ex = step ? exerciseById(step.exId) : null;
  const paused = S.isPaused(s);
  const sRef = useRef(s); sRef.current = s;
  const getElapsed = () => S.phaseElapsed(sRef.current, Date.now());
  const el = S.phaseElapsed(s, now);
  const remain = S.restRemainingMs(s, now);
  const prog = S.progress(s);
  const [sure, setSure] = useState(false);
  const beeped = useRef({ key: '', n: -1 });

  // pitidos de los últimos 3 segundos del descanso y al terminar
  useEffect(() => {
    if (s.phase !== 'rest' || paused) return;
    const sec = Math.ceil(remain / 1000);
    const key = s.idx + ':' + s.phase;
    if (beeped.current.key !== key) beeped.current = { key, n: 99 };
    if (sec <= 3 && sec >= 1 && beeped.current.n !== sec) { beeped.current.n = sec; beep(700, 90); }
    if (remain <= 0 && beeped.current.n !== 0) { beeped.current.n = 0; beep(1040, 420); buzz([200, 100, 200]); }
  }, [Math.ceil(remain / 1000), s.phase, s.idx, paused]);

  const act = (fn) => () => setSession((cur) => fn(cur, Date.now()));
  const start = act(S.start);
  const finish = () => { beep(660, 120); buzz(60); setSession((cur) => S.finishRep(cur, Date.now())); };

  let main;
  if (paused) main = html`<button type="button" className="main-btn resume" onClick=${act(S.resume)}><${Icon} n="play"/><span>REANUDAR</span></button>`;
  else if (s.phase === 'ready') main = html`<button type="button" className="main-btn start" onClick=${() => { beep(880, 100); start(); }}><${Icon} n="play"/><span>INICIAR</span></button>`;
  else if (s.phase === 'swim') main = html`<button type="button" className="main-btn finish" onClick=${finish}><${Icon} n="check"/><span>FINALIZAR<br/>SERIE</span></button>`;
  else main = remain <= 0
    ? html`<button type="button" className="main-btn start" onClick=${() => setSession((cur) => S.start(S.skipRest(cur, Date.now()), Date.now()))}><${Icon} n="play"/><span>INICIAR</span></button>`
    : html`<button type="button" className="main-btn finish" onClick=${act(S.skipRest)}><${Icon} n="next"/><span>SALTAR<br/>DESCANSO</span></button>`;

  const lastStep = s.idx >= s.steps.length - 1;
  return html`<div className="ov" role="dialog" aria-modal="true" aria-label="Entrenamiento en curso"><div className="ov-in">
    <div className="ov-top">
      <div className="clock num">Total <b>${clockMs(S.totalElapsed(s, now))}</b></div>
      <button type="button" className="ghost" onClick=${() => setSure(true)}>Salir</button>
    </div>
    <div className="prog">
      <div className="row"><b className="num">${fmtM(prog.meters)} / ${fmtM(prog.planned)} m</b><span className="num">faltan ${fmtM(prog.remaining)} m · serie ${Math.min(s.idx + 1, s.steps.length)}/${s.steps.length}</span></div>
      <div className="bar" role="progressbar" aria-valuenow=${Math.round(prog.pct * 100)} aria-valuemin="0" aria-valuemax="100"><span style=${{ width: prog.pct * 100 + '%' }}></span></div>
      <div className="bblocks">${BLOCK_ORDER.filter((b) => prog.blocks[b].total > 0).map((b) => html`<div key=${b} className=${step && step.block === b ? 'cur' : ''}><span>${BLOCKS[b].name}</span><div className="bar thin"><span style=${{ width: prog.blocks[b].pct * 100 + '%', background: BLOCKS[b].color }}></span></div></div>`)}</div>
    </div>
    ${step && html`<section className="active">
      <div className="body">
        <span className="eyebrow">${BLOCKS[step.block].name} · repetición ${step.rep} de ${step.reps}</span>
        <div className="ex-name">${step.name}</div>
        <div className="facts">
          <div><b className="num">${step.dist} m</b><span>${step.dist / (2 * pool)} ${step.dist / (2 * pool) === 1 ? 'ida y vuelta' : 'idas y vueltas'}</span></div>
          <div><b className="num">${step.rep}/${step.reps}</b><span>repetición</span></div>
          <div><b className="num">${intensityText(step)}</b><span>${RPE_LABEL[step.rpe]}</span></div>
          <div><b className="num">${step.rest}s</b><span>descanso</span></div>
        </div>
        <${Lane} phase=${s.phase === 'swim' ? 'swim' : 'wall'} getElapsed=${getElapsed} cycleMs=${2 * pool * 1200} paused=${paused}/>
        <div className=${'timer' + (paused ? ' paused' : '')}>
          ${s.phase === 'rest'
            ? html`<${Ring} phaseStart=${s.phaseStart} restMs=${step.rest * 1000} pausedAt=${s.pausedAt} go=${remain <= 0}>
                <b className="num">${remain > 0 ? Math.ceil(remain / 1000) : '¡YA!'}</b><span>${remain > 0 ? 'descanso' : 'a nadar'}</span><//>`
            : html`<div className="t num">${clockMs(el)}<small>.${tenth(el)}</small></div><div className="l">${paused ? 'En pausa' : s.phase === 'swim' ? 'Tiempo de esta serie' : 'Listo para salir'}</div>`}
        </div>
        ${step.note && html`<p className="muted small">${step.note}</p>`}
        ${ex && ex.safety && html`<div className="safety"><${Icon} n="shield"/><span>${ex.safety}</span></div>`}
      </div>
    </section>`}
    <div className="dock">
      ${main}
      <div className="sec">
        <button type="button" onClick=${act(S.prev)} disabled=${paused || (s.idx === 0 && s.phase === 'ready')}><${Icon} n="prev"/>ANTERIOR</button>
        ${paused ? html`<button type="button" disabled><${Icon} n="pause"/>EN PAUSA</button>` : html`<button type="button" onClick=${act(S.pause)} disabled=${s.phase === 'ready'}><${Icon} n="pause"/>PAUSAR</button>`}
        <button type="button" onClick=${act(S.next)} disabled=${paused}><${Icon} n="next"/>${lastStep ? 'TERMINAR' : 'SIGUIENTE'}</button>
      </div>
    </div>
    ${nxt && html`<div className="nextc"><span className="eyebrow">Después</span><div className="row"><b>${nxt.name}</b><span className="num">${nxt.dist} m · ${intensityText(nxt)}</span></div></div>`}
    ${ex && html`<details className="more"><summary>Cómo se hace<${Icon} n="down"/></summary><div className="in">
      <ul>${ex.instructions.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul>
      ${ex.mistakes.length > 0 && html`<div><b>Errores comunes</b><ul>${ex.mistakes.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul></div>`}</div></details>`}
    ${sure && html`<div className="confirm"><span>¿Terminar el entrenamiento?</span><div>
      <button type="button" className="btn" onClick=${() => setSure(false)}>Seguir</button>
      <button type="button" className="btn primary" onClick=${() => { setSure(false); setSession((cur) => S.finishSession(cur, Date.now())); }}>Terminar y guardar</button>
      <button type="button" className="btn danger" onClick=${onExit}>Descartar</button></div></div>`}
  </div></div>`;
}

export function Summary({ summary, entry, onClose, onRepeat, onDelete }) {
  const s = summary;
  return html`<div className="ov" role="dialog" aria-modal="true" aria-label="Resumen"><div className="ov-in">
    <div className="ov-top"><span className="eyebrow">${s.completed ? 'Entrenamiento completo' : 'Entrenamiento terminado antes'}</span></div>
    <div className="kpis">
      <div className="kpi hl"><b className="num">${fmtM(s.meters)} m</b><span>nadados de ${fmtM(s.plannedMeters)} m planificados (${s.compliance} %)</span></div>
      <div className="kpi"><b className="num">${clock(s.totalSeconds)}</b><span>tiempo total</span></div>
      <div className="kpi"><b className="num">${clock(s.activeSeconds)}</b><span>nadando (medido)</span></div>
      <div className="kpi"><b className="num">${clock(s.restSeconds)}</b><span>descansando (medido)</span></div>
      <div className="kpi"><b className="num">${s.pace100 ? clock(s.pace100) : '—'}</b><span>ritmo medio /100 m</span></div>
      <div className="kpi"><b className="num">${s.reps}/${s.plannedReps}</b><span>series hechas${s.skipped ? ` · ${s.skipped} saltadas` : ''}</span></div>
    </div>
    ${!s.pace100 && html`<p className="muted small">El ritmo aparece cuando hay al menos 10 s de nado registrado. No se muestran pulsaciones ni calorías porque la app no las mide.</p>`}
    ${s.autoClosed && html`<div className="note bad"><${Icon} n="timer"/><span>El entrenamiento se cerró solo: llevaba más de 2 horas abierto. Se guardó hasta ese punto y las series que quedaron corriendo no cuentan.</span></div>`}
    <p className="msg">✓ Guardado en tu historial</p>
    <div className="tools"><button type="button" className="btn big primary" onClick=${onClose}>LISTO</button>
      <button type="button" className="btn" onClick=${onRepeat}><${Icon} n="hist"/>Repetir este entrenamiento</button>
      <button type="button" className="btn danger" onClick=${onDelete}><${Icon} n="trash"/>Quitar del historial</button></div>
  </div></div>`;
}
