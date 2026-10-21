// MI HISTORIAL DE NATACIÓN: métricas, gráficos interactivos y sesiones repetibles.
import { html, useState, useMemo, Icon, fmtM, clock, dateLong, dateShort } from './kit.js';
import { BLOCKS, BLOCK_ORDER, BY_ID } from '../library.js';
import { computeStats, GOALS } from '../engine/index.js';

const W = 320, H = 150, PAD = { l: 38, r: 8, t: 10, b: 24 };

function WeeklyChart({ data, sel, setSel }) {
  const rows = data.slice(-12);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.meters), 1);
  const bw = (W - PAD.l - PAD.r) / rows.length;
  const y = (m) => PAD.t + (H - PAD.t - PAD.b) * (1 - m / max);
  return html`<svg className="chart" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Metros por semana">
    ${[0, 0.5, 1].map((f) => html`<g key=${f}><line x1=${PAD.l} x2=${W - PAD.r} y1=${y(max * f)} y2=${y(max * f)} stroke="var(--line)"/><text x=${PAD.l - 6} y=${y(max * f) + 4} textAnchor="end">${fmtM(max * f)}</text></g>`)}
    ${rows.map((r, i) => html`<g key=${r.t} onClick=${() => setSel(sel === r.t ? null : r.t)} style=${{ cursor: 'pointer' }}>
      <rect x=${PAD.l + i * bw + (bw - Math.min(bw - 6, 44)) / 2} y=${y(r.meters)} width=${Math.min(bw - 6, 44)} height=${H - PAD.b - y(r.meters)} rx="3" fill=${sel === r.t ? 'var(--aqua)' : 'var(--electric)'}/>
      <rect x=${PAD.l + i * bw} y=${PAD.t} width=${bw} height=${H - PAD.t - PAD.b} fill="transparent"/>
      ${(rows.length <= 6 || i % 2 === 0) && html`<text x=${PAD.l + i * bw + bw / 2} y=${H - 6} textAnchor="middle">${dateShort(r.t)}</text>`}</g>`)}
  </svg>`;
}

function PaceChart({ data, sel, setSel }) {
  const rows = data.slice(-20);
  if (rows.length < 2) return html`<div className="empty">El gráfico de ritmo aparece con al menos 2 sesiones medidas.</div>`;
  const lo = Math.min(...rows.map((r) => r.pace)), hi = Math.max(...rows.map((r) => r.pace));
  const span = Math.max(hi - lo, 5);
  const x = (i) => PAD.l + (W - PAD.l - PAD.r) * (i / (rows.length - 1));
  const y = (p) => PAD.t + (H - PAD.t - PAD.b) * ((p - lo + span * 0.1) / (span * 1.2));
  const path = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(r.pace).toFixed(1)}`).join(' ');
  return html`<svg className="chart" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Ritmo por sesión (más abajo es más rápido)">
    ${[lo, (lo + hi) / 2, hi].map((p, i) => html`<g key=${i}><line x1=${PAD.l} x2=${W - PAD.r} y1=${y(p)} y2=${y(p)} stroke="var(--line)"/><text x=${PAD.l - 6} y=${y(p) + 4} textAnchor="end">${clock(p)}</text></g>`)}
    <path d=${path} fill="none" stroke="var(--electric)" strokeWidth="2.5" strokeLinejoin="round"/>
    ${rows.map((r, i) => html`<g key=${r.t} onClick=${() => setSel(sel === r.t ? null : r.t)} style=${{ cursor: 'pointer' }}>
      <circle cx=${x(i)} cy=${y(r.pace)} r=${sel === r.t ? 6 : 4} fill=${sel === r.t ? 'var(--aqua)' : 'var(--electric)'} stroke="var(--bg)" strokeWidth="2"/>
      <circle cx=${x(i)} cy=${y(r.pace)} r="14" fill="transparent"/></g>`)}
    <text x=${PAD.l} y=${H - 6}>${dateShort(rows[0].t)}</text><text x=${W - PAD.r} y=${H - 6} textAnchor="end">${dateShort(rows[rows.length - 1].t)}</text>
  </svg>`;
}

function Bars({ rows, total }) {
  return html`<div className="hbars">${rows.map((r) => html`<div key=${r.id} className="bp"><span>${r.name}</span><div className="bar"><span style=${{ width: (r.meters / total * 100) + '%' }}></span></div><span className="v num">${fmtM(r.meters)} m</span></div>`)}</div>`;
}

function Entry({ e, onRepeat, onBase, onDelete }) {
  const [open, setOpen] = useState(false);
  const goal = e.goal && GOALS[e.goal] ? GOALS[e.goal].name : null;
  return html`<li className="he">
    <button type="button" className="he-h" aria-expanded=${open} onClick=${() => setOpen(!open)}>
      <span><span className="d">${dateLong(e.date)}</span><span className="s num">${e.name}${goal ? ' · ' + goal : ''} · piscina ${e.pool} m</span>
        <span className="s num">${e.activeSeconds ? 'nado ' + clock(e.activeSeconds) : 'sin tiempo de nado'} · total ${clock(e.totalSeconds)}${e.pace100 ? ' · ' + clock(e.pace100) + ' /100 m' : ''}</span></span>
      <span><b className="m num">${fmtM(e.meters)} m</b><span className=${'chip ' + (e.compliance >= 100 ? 'ok' : 'warn')}>${e.compliance} %</span></span></button>
    ${open && html`<div className="he-b">
      <div className="tags"><span className="chip ok">tiempos medidos</span>${e.legacy && html`<span className="chip">de la versión 1</span>`}</div>
      ${e.workout && html`<ul className="mini">${BLOCK_ORDER.map((b) => { const list = e.workout.items.filter((i) => i.block === b); return list.length ? html`<li key=${b}><b>${BLOCKS[b].name}</b> ${list.map((i) => `${i.reps}×${i.dist} ${i.name}`).join(' · ')}</li>` : null; })}</ul>`}
      <div className="tools">
        ${e.workout && html`<button type="button" className="btn small primary" onClick=${() => onRepeat(e)}><${Icon} n="play"/>Repetir sesión</button><button type="button" className="btn small" onClick=${() => onBase(e)}><${Icon} n="dice"/>Usar como base</button>`}
        <button type="button" className="btn small danger" onClick=${() => onDelete(e)}><${Icon} n="trash"/>Borrar</button></div>
    </div>`}
  </li>`;
}

export function HistoryView({ history, onRepeat, onBase, onDelete }) {
  const [range, setRange] = useState(90);
  const [selW, setSelW] = useState(null);
  const [selP, setSelP] = useState(null);
  const st = useMemo(() => computeStats(history, { days: range || undefined }), [history, range]);
  const wk = st.weekly.find((r) => r.t === selW);
  const pp = st.paceSeries.find((r) => r.t === selP);
  const strokeTotal = st.strokes.reduce((a, r) => a + r.meters, 0);
  return html`<div className="hist-v">
    <div className="top"><h1 className="h1">Mi historial</h1>
      <div className="seg" role="group" aria-label="Período">${[[30, '30 d'], [90, '90 d'], [0, 'Todo']].map(([v, l]) => html`<button key=${v} type="button" aria-pressed=${range === v} onClick=${() => setRange(v)}>${l}</button>`)}</div></div>
    ${history.length === 0 ? html`<div className="empty">Todavía no hay sesiones. Cuando termines un entrenamiento se guarda acá con los tiempos que mediste.</div>` : html`
    <div className="kpis">
      <div className="kpi"><b className="num">${st.sessions}</b><span>sesiones · ${st.activeDays} ${st.activeDays === 1 ? 'día' : 'días'}</span></div>
      <div className="kpi"><b className="num">${fmtM(st.meters)} m</b><span>metros nadados</span></div>
      <div className="kpi"><b className="num">${fmtM(st.avgMeters)} m</b><span>promedio por sesión</span></div>
      <div className="kpi"><b className="num">${st.avgPace ? clock(st.avgPace) : '—'}</b><span>ritmo medio /100 m${st.bestPace ? ' · mejor ' + clock(st.bestPace) : ''}</span></div>
    </div>
    <section className="card"><div className="row"><h2>Metros por semana</h2><span className="chip ok">medido</span></div>
      <${WeeklyChart} data=${st.weekly} sel=${selW} setSel=${setSelW}/>
      <p className="hint" aria-live="polite">${wk ? `Semana del ${dateShort(wk.t)}: ${fmtM(wk.meters)} m` : 'Tocá una barra para ver el detalle.'}</p></section>
    <section className="card"><div className="row"><h2>Ritmo por sesión</h2><span className="chip ok">medido</span></div>
      <${PaceChart} data=${st.paceSeries} sel=${selP} setSel=${setSelP}/>
      <p className="hint" aria-live="polite">${pp ? `${dateShort(pp.t)}: ${clock(pp.pace)} cada 100 m` : 'Más abajo es más rápido. Tocá un punto para ver el valor.'}</p></section>
    ${st.strokes.length > 0 && html`<section className="card"><div className="row"><h2>Por estilo</h2><span className="chip">series nadadas</span></div><${Bars} rows=${st.strokes} total=${strokeTotal}/></section>`}
    ${st.topExercises.length > 0 && html`<section className="card"><h2>Ejercicios más nadados</h2><${Bars} rows=${st.topExercises} total=${st.topExercises[0].meters}/></section>`}
    <p className="muted small">La app no mide pulsaciones ni calorías, así que no las muestra. Los ritmos salen de tus tiempos reales por serie.</p>
    <ul className="hist">${history.filter((e) => !range || e.date >= Date.now() - range * 86400000).map((e) => html`<${Entry} key=${e.id} e=${e} onRepeat=${onRepeat} onBase=${onBase} onDelete=${onDelete}/>`)}</ul>`}
  </div>`;
}
