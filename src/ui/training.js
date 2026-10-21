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

function Ring({ frac, children, go }) {
  const R = 92, C = 2 * Math.PI * R;
  return html`<div className=${'ring' + (go ? ' go' : '')}><svg viewBox="0 0 210 210" aria-hidden="true">
    <circle cx="105" cy="105" r=${R} fill="none" stroke="var(--surface-2)" strokeWidth="12"/>
    <circle cx="105" cy="105" r=${R} fill="none" stroke=${go ? 'var(--aqua)' : 'var(--electric)'} strokeWidth="12" strokeLinecap="round" strokeDasharray=${C} strokeDashoffset=${C * (1 - Math.min(1, Math.max(0, frac)))}/></svg>
    <div className="c">${children}</div></div>`;
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
  if (paused) main = html`<button type="button" className="main-btn resume" onClick=${act(S.resume)}><${Icon} n="play"/>REANUDAR</button>`;
  else if (s.phase === 'ready') main = html`<button type="button" className="main-btn start" onClick=${() => { beep(880, 100); start(); }}><${Icon} n="play"/>INICIAR</button>`;
  else if (s.phase === 'swim') main = html`<button type="button" className="main-btn finish" onClick=${finish}><${Icon} n="check"/>FINALIZAR SERIE</button>`;
  else main = remain <= 0
    ? html`<button type="button" className="main-btn start" onClick=${() => setSession((cur) => S.start(S.skipRest(cur, Date.now()), Date.now()))}><${Icon} n="play"/>INICIAR</button>`
    : html`<button type="button" className="main-btn finish" onClick=${act(S.skipRest)}><${Icon} n="next"/>SALTAR DESCANSO</button>`;

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
      <div className="pic"><${Art} ex=${ex}/></div>
      <div className="body">
        <span className="eyebrow">${BLOCKS[step.block].name} · repetición ${step.rep} de ${step.reps}</span>
        <div className="ex-name">${step.name}</div>
        <div className="facts">
          <div><b className="num">${step.dist} m</b><span>${laps(step.dist, pool)} ${lapWord(step.dist, pool)}</span></div>
          <div><b className="num">${step.rep}/${step.reps}</b><span>repetición</span></div>
          <div><b className="num">${intensityText(step)}</b><span>${RPE_LABEL[step.rpe]}</span></div>
          <div><b className="num">${step.rest}s</b><span>descanso</span></div>
        </div>
        <div className=${'timer' + (paused ? ' paused' : '')}>
          ${s.phase === 'rest'
            ? html`<${Ring} frac=${step.rest ? Math.max(0, remain) / (step.rest * 1000) : 0} go=${remain <= 0}>
                <b className="num">${remain > 0 ? Math.ceil(remain / 1000) : '¡YA!'}</b><span>${remain > 0 ? 'descanso' : 'a nadar'}</span><//>`
            : html`<div className="t num">${clockMs(el)}<small>.${tenth(el)}</small></div><div className="l">${paused ? 'En pausa' : s.phase === 'swim' ? 'Tiempo de esta serie' : 'Listo para salir'}</div>`}
        </div>
        ${main}
        <div className="sec">
          <button type="button" onClick=${act(S.prev)} disabled=${paused || (s.idx === 0 && s.phase === 'ready')}><${Icon} n="prev"/>ANTERIOR</button>
          ${paused ? html`<button type="button" disabled><${Icon} n="pause"/>EN PAUSA</button>` : html`<button type="button" onClick=${act(S.pause)} disabled=${s.phase === 'ready'}><${Icon} n="pause"/>PAUSAR</button>`}
          <button type="button" onClick=${act(S.next)} disabled=${paused}><${Icon} n="next"/>${lastStep ? 'TERMINAR' : 'SIGUIENTE'}</button>
        </div>
        ${step.note && html`<p className="muted small">${step.note}</p>`}
        ${ex && ex.safety && html`<div className="safety"><${Icon} n="shield"/><span>${ex.safety}</span></div>`}
      </div>
    </section>`}
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
    <p className="msg">✓ Guardado en tu historial</p>
    <div className="tools"><button type="button" className="btn big primary" onClick=${onClose}>LISTO</button>
      <button type="button" className="btn" onClick=${onRepeat}><${Icon} n="hist"/>Repetir este entrenamiento</button>
      <button type="button" className="btn danger" onClick=${onDelete}><${Icon} n="trash"/>Quitar del historial</button></div>
  </div></div>`;
}
