// Pantalla "Hoy" (resumen + acciones) y "Rutina" (editor manual).
import { html, useState, useMemo, Icon, Art, Sheet, Stepper, Issues, fmtM, laps, lapWord, dateLong, clock } from './kit.js';
import { BLOCKS, BLOCK_ORDER, BY_ID, EXERCISES, CATEGORIES, EQUIPMENT, variantsOf, intensityText, resolveItem, DIFFICULTY_LABEL } from '../library.js';
import { plannedMeters, blockMeters, distanceStatus, validateWorkout, estimateItems, updateItem, swapExercise, removeItem, moveItem, moveToBlock, addItem, fitToTarget, acceptPlanned, startCheck, measuredPace, GOALS, INTENSITIES } from '../engine/index.js';

export function DistanceBadge({ w }) {
  const s = distanceStatus(w);
  return html`<div className=${'planned ' + (s.ok ? 'ok' : 'bad')} role="status" aria-live="polite">
    <span className="eyebrow">DISTANCIA PLANIFICADA</span>
    <b className="num">${fmtM(s.planned)} / ${fmtM(s.target)} m</b>
    <span className="chip">${s.ok ? '✓ completa' : s.diff > 0 ? `+${fmtM(s.diff)} m de más` : `faltan ${fmtM(-s.diff)} m`}</span>
  </div>`;
}

function BlockStack({ w }) {
  const by = blockMeters(w.items);
  const total = plannedMeters(w.items) || 1;
  return html`<div>
    <div className="stack" role="img" aria-label="Reparto por bloques">${BLOCK_ORDER.map((b) => by[b] > 0 && html`<span key=${b} style=${{ width: (by[b] / total * 100) + '%', background: BLOCKS[b].color }}></span>`)}</div>
    <div className="legend">${BLOCK_ORDER.map((b) => html`<div key=${b}><b className="num">${fmtM(by[b])} m</b><span><i style=${{ background: BLOCKS[b].color }}></i>${BLOCKS[b].name}</span></div>`)}</div>
  </div>`;
}

export function Hero({ w, history }) {
  const est = estimateItems(w.items, { level: w.config.level, history });
  const sets = w.items.reduce((a, i) => a + i.reps, 0);
  return html`<section className="hero">
    <div className="row"><span className="eyebrow">${w.name}</span>${w.edited && html`<span className="chip">editada</span>`}</div>
    <div className="bigm num">${fmtM(plannedMeters(w.items))}<small>m</small></div>
    <div className="meta">
      <div><b className="num">${w.pool} m</b><span>piscina</span></div>
      <div><b className="num">${sets}</b><span>series</span></div>
      <div><b className="num">~${est.minutes} min</b><span>${est.source === 'history' ? 'según tu ritmo' : 'orientativo'}</span></div>
    </div>
    <${BlockStack} w=${w}/>
    <div className="tags">${[GOALS[w.config.goal] && GOALS[w.config.goal].name, INTENSITIES[w.config.intensity] && 'Intensidad ' + INTENSITIES[w.config.intensity].name.toLowerCase()].filter(Boolean).map((t) => html`<span key=${t} className="chip">${t}</span>`)}</div>
  </section>`;
}

function ItemLine({ it, pool, onOpen }) {
  const { ex } = resolveItem(it);
  return html`<li><button type="button" className="line" onClick=${onOpen} disabled=${!onOpen}>
    <span className="thumb"><${Art} ex=${ex}/></span>
    <span><span className="nm">${it.name}</span><span className="sub">${laps(it.dist, pool)} ${lapWord(it.dist, pool)} · ${intensityText(it)} · descanso ${it.rest}s</span></span>
    <span className="qty num">${it.reps}×${it.dist}</span></button></li>`;
}

export function ReadOnlyBlocks({ w, onOpen }) {
  const by = blockMeters(w.items);
  return html`<div className="blocks">${BLOCK_ORDER.map((b) => {
    const list = w.items.filter((i) => i.block === b);
    if (!list.length) return null;
    return html`<section key=${b}><div className="block-h"><h3><i style=${{ background: BLOCKS[b].color }}></i>${BLOCKS[b].name}</h3><span className="num">${fmtM(by[b])} m</span></div>
      <ul className="exl">${list.map((it) => html`<${ItemLine} key=${it.id} it=${it} pool=${w.pool} onOpen=${onOpen && (() => onOpen(it))}/>`)}</ul></section>`;
  })}</div>`;
}

/* ───────── selector de ejercicio (cambiar / agregar) ───────── */
export function ExercisePicker({ title, equipment, allowNoGear, onPick, onClose, block }) {
  const [cat, setCat] = useState('all');
  const list = EXERCISES.filter((e) => cat === 'all' || e.category === cat);
  return html`<${Sheet} title=${title} onClose=${onClose}>
    <div className="chips scroll"><button type="button" className="chip-btn" aria-pressed=${cat === 'all'} onClick=${() => setCat('all')}>Todos</button>
      ${CATEGORIES.map((c) => html`<button key=${c.id} type="button" className="chip-btn" aria-pressed=${cat === c.id} onClick=${() => setCat(c.id)}>${c.short}</button>`)}</div>
    <ul className="pick">${list.map((ex) => {
      const missing = ex.equipmentRequired.filter((e) => !equipment.includes(e));
      const v = variantsOf(ex).find((x) => !block || x.blocks.includes(block)) || variantsOf(ex)[0];
      const ok = !missing.length || (allowNoGear && ex.noGearVariant);
      return html`<li key=${ex.id}><button type="button" className="line" onClick=${() => onPick(ex.id, v.id)}>
        <span className="thumb"><${Art} ex=${ex}/></span>
        <span><span className="nm">${ex.name}</span><span className="sub">${DIFFICULTY_LABEL[ex.difficulty]}${missing.length ? ' · necesita ' + missing.map((m) => EQUIPMENT[m].short.toLowerCase()).join(' y ') : ''}</span></span>
        <span className=${'chip ' + (ok ? 'ok' : 'warn')}>${ok ? (missing.length ? 'alternativa' : 'ok') : 'sin material'}</span></button></li>`;
    })}</ul>
  <//>`;
}

/* ───────── editor ───────── */
function ItemEditor({ w, it, index, count, onChange, onSwap, onRemove, onMove, onBlock }) {
  const [open, setOpen] = useState(false);
  const { ex } = resolveItem(it);
  const unit = w.pool * ((ex && ex.unitMult) || 1);
  const m = it.reps * it.dist;
  return html`<li className="ed">
    <button type="button" className="ed-h" aria-expanded=${open} onClick=${() => setOpen(!open)}>
      <span className="thumb"><${Art} ex=${ex}/></span>
      <span><span className="nm">${it.name}</span><span className="sub">${intensityText(it)} · descanso ${it.rest}s · ${fmtM(m)} m</span></span>
      <span className="qty num">${it.reps}×${it.dist}</span></button>
    ${open && html`<div className="ed-b">
      <div className="grid2">
        <div className="field"><label>Repeticiones</label><${Stepper} label="repeticiones" value=${it.reps} min=${1} max=${40} onChange=${(v) => onChange({ reps: v })}/></div>
        <div className="field"><label>Distancia</label><${Stepper} label="distancia" value=${it.dist} step=${unit} min=${unit} max=${2000} unit="m" onChange=${(v) => onChange({ dist: v })}/></div>
        <div className="field"><label>Descanso</label><${Stepper} label="descanso" value=${it.rest} step=${5} min=${0} max=${300} unit="s" onChange=${(v) => onChange({ rest: v })}/></div>
        <div className="field"><label>Esfuerzo (1–10)</label><${Stepper} label="esfuerzo" value=${it.rpe} min=${1} max=${10} onChange=${(v) => onChange({ rpe: v })}/></div>
      </div>
      <div className="tools">
        <button type="button" className="btn small" onClick=${onSwap}><${Icon} n="swap"/>Cambiar ejercicio</button>
        <button type="button" className="btn small" onClick=${() => onMove(-1)} disabled=${index === 0} aria-label="Subir"><${Icon} n="up"/></button>
        <button type="button" className="btn small" onClick=${() => onMove(1)} disabled=${index === count - 1} aria-label="Bajar"><${Icon} n="down"/></button>
        <select aria-label="Mover a otro bloque" value=${it.block} onChange=${(e) => onBlock(e.target.value)}>${BLOCK_ORDER.map((b) => html`<option key=${b} value=${b}>${BLOCKS[b].name}</option>`)}</select>
        <button type="button" className="btn small danger" onClick=${onRemove}><${Icon} n="trash"/>Quitar</button>
      </div>
    </div>`}
  </li>`;
}

export function Editor({ w, setW, onRegenBlock, onAlternative, history, sessionActive }) {
  const [picker, setPicker] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const check = useMemo(() => validateWorkout(w, { config: w.config }), [w]);
  const status = distanceStatus(w);
  const by = blockMeters(w.items);
  const apply = (fn) => setW(fn(w));

  const fit = () => { const r = fitToTarget(w); if (r) setW(r); else setConfirm({ msg: 'No encontré una forma exacta de llegar al objetivo cambiando una sola serie. Podés ajustar los metros a mano o usar la distancia planificada como objetivo.' }); };

  return html`<div className="editor">
    <div className="sticky"><${DistanceBadge} w=${w}/></div>
    ${sessionActive && html`<div className="note bad"><${Icon} n="info"/> Hay una sesión en curso: los cambios no la afectan hasta que la reinicies.</div>`}
    ${!status.ok && html`<div className="note bad"><${Icon} n="warn"/><span>La rutina no coincide con el objetivo.</span>
      <div className="fixes"><button type="button" className="btn small" onClick=${fit}>Ajustar al objetivo (${fmtM(w.target)} m)</button>
      <button type="button" className="btn small" onClick=${() => apply(acceptPlanned)}>Usar ${fmtM(status.planned)} m como objetivo</button></div></div>`}
    ${confirm && html`<div className="note bad">${confirm.msg}<div className="fixes"><button type="button" className="btn small" onClick=${() => setConfirm(null)}>Entendido</button></div></div>`}
    ${check.errors.filter((e) => e.code !== 'SUM').length > 0 && html`<${Issues} issues=${check.errors.filter((e) => e.code !== 'SUM').map((e) => ({ ...e, severity: 'error', fixes: [] }))} onFix=${() => {}}/>`}
    ${check.warnings.length > 0 && html`<details className="more"><summary>Avisos de seguridad y calidad (${check.warnings.length})<${Icon} n="down"/></summary><div className="in"><ul>${check.warnings.map((x, i) => html`<li key=${i}>${x.message}</li>`)}</ul></div></details>`}
    ${BLOCK_ORDER.map((b) => {
      const list = w.items.filter((i) => i.block === b);
      return html`<section key=${b}><div className="block-h"><h3><i style=${{ background: BLOCKS[b].color }}></i>${BLOCKS[b].name}</h3><span className="num">${fmtM(by[b])} m</span></div>
        <ul className="eds">${list.map((it, i) => html`<${ItemEditor} key=${it.id} w=${w} it=${it} index=${i} count=${list.length}
          onChange=${(p) => apply((x) => updateItem(x, it.id, p))} onSwap=${() => setPicker({ mode: 'swap', id: it.id, block: b })}
          onRemove=${() => apply((x) => removeItem(x, it.id))} onMove=${(d) => apply((x) => moveItem(x, it.id, d))} onBlock=${(nb) => apply((x) => moveToBlock(x, it.id, nb))}/>`)}</ul>
        <div className="tools"><button type="button" className="btn small" onClick=${() => setPicker({ mode: 'add', block: b })}><${Icon} n="plus"/>Agregar ejercicio</button>
          ${by[b] > 0 && html`<button type="button" className="btn small" onClick=${() => w.edited ? setConfirm({ block: b, msg: `Vas a reemplazar el ${BLOCKS[b].name.toLowerCase()} (incluidos tus cambios en ese bloque). Los demás bloques no se tocan.`, action: () => onRegenBlock(b) }) : onRegenBlock(b)}><${Icon} n="dice"/>Regenerar bloque</button>`}</div></section>`;
    })}
    ${confirm && confirm.action && html`<${Sheet} title="¿Regenerar bloque?" onClose=${() => setConfirm(null)}><p>${confirm.msg}</p><div className="tools"><button type="button" className="btn" onClick=${() => setConfirm(null)}>Cancelar</button><button type="button" className="btn primary" onClick=${() => { const a = confirm.action; setConfirm(null); a(); }}>Regenerar</button></div><//>`}
    <div className="tools"><button type="button" className="btn" onClick=${onAlternative}><${Icon} n="dice"/>Generar otra opción</button></div>
    ${picker && html`<${ExercisePicker} title=${picker.mode === 'swap' ? 'Cambiar ejercicio' : 'Agregar ejercicio'} block=${picker.block} equipment=${w.config.equipment} allowNoGear=${w.config.allowNoGear}
      onClose=${() => setPicker(null)} onPick=${(exId, vId) => { apply((x) => (picker.mode === 'swap' ? swapExercise(x, picker.id, exId, vId) : addItem(x, picker.block, exId, vId))); setPicker(null); }}/>`}
  </div>`;
}
