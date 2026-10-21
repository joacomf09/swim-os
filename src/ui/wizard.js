// CONFIGURADOR "+ CREAR NUEVO ENTRENAMIENTO": 6 pasos con resumen siempre visible.
import { html, useState, useMemo, Icon, Art, Segmented, Stepper, Issues, fmtM } from './kit.js';
import { EXERCISES, CATEGORIES, EQUIPMENT, EQUIPMENT_ORDER, LEVELS, BLOCKS, BLOCK_ORDER, DIFFICULTY_LABEL, BY_ID } from '../library.js';
import { GOALS, INTENSITIES, REST_MODES, DISTRIBUTIONS, QUICK_DISTANCES, POOL_MIN, POOL_MAX, resolveSelection, toggleExercise, setCategoryAll, applyFix, normalizeConfig, splitBlocks, blockSum, diagnose, estimateFromTotal, generateWorkout } from '../engine/index.js';

const STEPS = ['Distancia', 'Piscina', 'Ejercicios', 'Material', 'Bloques', 'Objetivo'];

function EstimateLine({ total, level, history }) {
  const e = estimateFromTotal(total, { level, history });
  return html`<p className="hint">⏱ Duración estimada: <b>~${e.minutes} min</b> <span className=${'chip ' + (e.source === 'history' ? 'ok' : '')}>${e.source === 'history' ? 'según tus entrenamientos' : 'orientativa'}</span></p>`;
}

function StepDistance({ cfg, set, history, fixIssues }) {
  const custom = !QUICK_DISTANCES.includes(cfg.total);
  const issues = fixIssues.filter((i) => i.code.startsWith('TOTAL'));
  return html`<div className="step">
    <h2>¿Cuántos metros querés nadar?</h2>
    <div className="chips">${QUICK_DISTANCES.map((d) => html`<button key=${d} type="button" className="opt" aria-pressed=${cfg.total === d} onClick=${() => set({ total: d })}><b className="num">${fmtM(d)}</b><small>m</small></button>`)}</div>
    <div className="field"><label htmlFor="tot">Otra distancia</label>
      <input id="tot" type="number" inputMode="numeric" min="25" step=${cfg.pool} value=${custom ? cfg.total : ''} placeholder="Ej.: 1.350" onChange=${(e) => set({ total: Math.round(Number(e.target.value)) || 0 })}/></div>
    <${EstimateLine} total=${cfg.total} level=${cfg.level} history=${history}/>
    <${Issues} issues=${issues} onFix=${(f) => set(null, f)}/>
  </div>`;
}

function StepPool({ cfg, set, fixIssues }) {
  const custom = cfg.pool !== 25 && cfg.pool !== 50;
  const n = cfg.total / cfg.pool;
  const issues = fixIssues.filter((i) => i.code === 'TOTAL_MULTIPLE' || i.code === 'POOL');
  return html`<div className="step">
    <h2>¿De cuánto es la piscina?</h2>
    <div className="chips two">${[25, 50].map((p) => html`<button key=${p} type="button" className="opt" aria-pressed=${cfg.pool === p} onClick=${() => set({ pool: p })}><b className="num">${p}</b><small>metros</small></button>`)}</div>
    <div className="field"><label htmlFor="pool">Otra medida (${POOL_MIN}–${POOL_MAX} m)</label>
      <input id="pool" type="number" inputMode="numeric" min=${POOL_MIN} max=${POOL_MAX} value=${custom ? cfg.pool : ''} placeholder="Ej.: 20" onChange=${(e) => set({ pool: Math.round(Number(e.target.value)) || 0 })}/></div>
    ${Number.isInteger(n) && n > 0 && html`<p className="hint"><b className="num">${fmtM(cfg.total)} m</b> = <b className="num">${fmtM(n)} largos</b> de ${cfg.pool} m. Todas las series van a ser múltiplos exactos.</p>`}
    ${custom && html`<p className="hint">Con medidas poco comunes las distancias de los ejercicios se adaptan a largos enteros.</p>`}
    <${Issues} issues=${issues} onFix=${(f) => set(null, f)}/>
  </div>`;
}

function ExerciseCard({ ex, on, locked, onToggle }) {
  const eq = ex.equipmentRequired.map((e) => EQUIPMENT[e].short).join(' + ');
  return html`<button type="button" className=${'xc' + (on ? ' on' : '')} aria-pressed=${on} onClick=${onToggle}>
    <${Art} ex=${ex}/>
    <span className="xc-t"><b>${ex.shortName === ex.name ? ex.name : ex.name}</b>
      <small>${DIFFICULTY_LABEL[ex.difficulty]}${eq ? ' · ' + eq : ' · sin material'}</small></span>
    <span className="tick" aria-hidden="true">${on ? html`<${Icon} n="check"/>` : ''}</span>
  </button>`;
}

function StepExercises({ cfg, setCfg }) {
  const selected = useMemo(() => resolveSelection(cfg), [cfg]);
  const [open, setOpen] = useState('styles');
  return html`<div className="step">
    <h2>¿Qué querés practicar?</h2>
    <p className="hint">Solo van a aparecer los ejercicios que marques. Elegí categorías enteras o ejercicios sueltos.</p>
    ${CATEGORIES.map((c) => {
      const list = EXERCISES.filter((e) => e.category === c.id && !cfg.excluded.includes(e.id));
      const n = list.filter((e) => selected.has(e.id)).length;
      const isOpen = open === c.id;
      return html`<section key=${c.id} className="cat">
        <div className="cat-h">
          <button type="button" className=${'catbtn' + (n ? ' on' : '')} aria-pressed=${n === list.length && n > 0} onClick=${() => setCfg(setCategoryAll(cfg, c.id, n !== list.length))}>
            <span>${c.name}</span><span className="num cnt">${n}/${list.length}</span></button>
          <button type="button" className="ghost sq" aria-expanded=${isOpen} aria-label=${'Ver ejercicios de ' + c.name} onClick=${() => setOpen(isOpen ? '' : c.id)}><${Icon} n=${isOpen ? 'up' : 'down'}/></button>
        </div>
        ${isOpen && html`<div className="xgrid">${list.map((ex) => html`<${ExerciseCard} key=${ex.id} ex=${ex} on=${selected.has(ex.id)} onToggle=${() => setCfg(toggleExercise(cfg, ex.id))}/>`)}</div>`}
      </section>`;
    })}
    ${selected.size === 0 && html`<div className="note bad"><${Icon} n="warn"/> No hay ningún ejercicio elegido.</div>`}
  </div>`;
}

function StepEquipment({ cfg, set, skipped }) {
  const none = cfg.equipment.length === 0;
  const toggle = (e) => set({ equipment: cfg.equipment.includes(e) ? cfg.equipment.filter((x) => x !== e) : [...cfg.equipment, e] });
  return html`<div className="step">
    <h2>¿Qué material tenés hoy?</h2>
    <div className="eqgrid">${EQUIPMENT_ORDER.map((e) => html`<button key=${e} type="button" className=${'opt eq' + (cfg.equipment.includes(e) ? ' on' : '')} aria-pressed=${cfg.equipment.includes(e)} onClick=${() => toggle(e)}><b>${EQUIPMENT[e].name}</b></button>`)}
      <button type="button" className=${'opt eq' + (none ? ' on' : '')} aria-pressed=${none} onClick=${() => set({ equipment: [] })}><b>Sin equipamiento</b></button></div>
    <label className="check"><input type="checkbox" checked=${cfg.allowNoGear} onChange=${(e) => set({ allowNoGear: e.target.checked })}/>
      <span><b>Permitir alternativas sin material</b><small>Si falta el material, usar una versión equivalente (por ejemplo, brazos con puños cerrados en lugar de palas). Si lo dejás apagado, esos ejercicios no aparecen.</small></span></label>
    ${skipped.length > 0 && html`<div className="note bad"><b>No van a aparecer:</b><ul>${skipped.slice(0, 8).map((s) => html`<li key=${s.id}>${s.name} <span className="muted">— ${s.reason.toLowerCase()}</span></li>`)}</ul></div>`}
  </div>`;
}

function StepBlocks({ cfg, set }) {
  const custom = cfg.distribution === 'custom';
  const sum = blockSum(cfg.blocks);
  const diff = cfg.total - sum;
  const setBlock = (b, v) => set({ distribution: 'custom', blocks: { ...cfg.blocks, [b]: v } });
  const bad = cfg.total % cfg.pool !== 0;
  return html`<div className="step">
    <h2>¿Cómo repartimos los metros?</h2>
    <div className="dist">${Object.values(DISTRIBUTIONS).map((d) => {
      const m = bad ? null : splitBlocks(cfg.total, cfg.pool, d.pct);
      return html`<button key=${d.id} type="button" className=${'opt dist-o' + (cfg.distribution === d.id ? ' on' : '')} aria-pressed=${cfg.distribution === d.id} onClick=${() => set({ distribution: d.id })}>
        <b>${d.name}</b><small className="num">${d.pct.join(' / ')}</small>${m && html`<small className="num">${m.warmup} · ${m.main} · ${m.endurance} m</small>`}</button>`;
    })}
      <button type="button" className=${'opt dist-o' + (custom ? ' on' : '')} aria-pressed=${custom} onClick=${() => set({ distribution: 'custom' })}><b>Personalizado</b><small>Metros exactos</small></button></div>
    <div className="blocks-ed">${BLOCK_ORDER.map((b) => html`<div key=${b} className="blk-row"><span><i style=${{ background: BLOCKS[b].color }}></i>${BLOCKS[b].name}</span>
      ${custom ? html`<${Stepper} label=${BLOCKS[b].name} value=${cfg.blocks[b]} step=${cfg.pool} min=${0} max=${cfg.total} unit="m" onChange=${(v) => setBlock(b, v)}/>` : html`<b className="num">${fmtM(cfg.blocks[b])} m</b>`}</div>`)}</div>
    <div className=${'note ' + (diff === 0 ? 'ok' : 'bad')}>${diff === 0 ? html`<${Icon} n="check"/> Suman exactamente ${fmtM(cfg.total)} m.` : html`<${Icon} n="warn"/> Asignaste ${fmtM(sum)} m de ${fmtM(cfg.total)} m — ${diff > 0 ? 'faltan' : 'sobran'} ${fmtM(Math.abs(diff))} m.`}</div>
  </div>`;
}

function StepGoal({ cfg, set }) {
  return html`<div className="step">
    <h2>¿Cuál es el objetivo?</h2>
    <div className="goals">${Object.values(GOALS).map((g) => html`<button key=${g.id} type="button" className=${'opt goal' + (cfg.goal === g.id ? ' on' : '')} aria-pressed=${cfg.goal === g.id} onClick=${() => set({ goal: g.id })}><b>${g.name}</b><small>${g.hint}</small></button>`)}</div>
    <div className="field"><label>Intensidad</label>
      <${Segmented} label="Intensidad" value=${cfg.intensity} options=${Object.values(INTENSITIES).map((i) => [i.id, i.name])} onChange=${(v) => set({ intensity: v })}/>
      <small className="hint">${INTENSITIES[cfg.intensity].hint}</small></div>
    <div className="field"><label>Descansos</label>
      <${Segmented} label="Descansos" value=${cfg.restMode} options=${Object.values(REST_MODES).map((i) => [i.id, i.name])} onChange=${(v) => set({ restMode: v })}/>
      ${cfg.restMode === 'custom' && html`<${Stepper} label="descanso" value=${cfg.restCustom} step=${5} min=${0} max=${180} unit="s" onChange=${(v) => set({ restCustom: v })}/>`}</div>
    <div className="field"><label>Tu nivel</label>
      <${Segmented} label="Nivel" value=${cfg.level} options=${Object.values(LEVELS).map((l) => [l.id, l.name])} onChange=${(v) => set({ level: v })}/>
      <small className="hint">Define qué ejercicios entran por categoría y cuánto esfuerzo se permite.</small></div>
  </div>`;
}

export function Wizard({ initial, history, onCancel, onDone, saveLast }) {
  const [cfg, setCfgRaw] = useState(() => normalizeConfig(initial));
  const [step, setStep] = useState(0);
  const [failure, setFailure] = useState(null);
  const setCfg = (c) => { setCfgRaw(normalizeConfig(c)); setFailure(null); };
  const set = (patch, fix) => setCfg(fix ? applyFix(cfg, fix) : { ...cfg, ...patch });
  const diag = useMemo(() => diagnose(cfg), [cfg]);
  const selected = useMemo(() => resolveSelection(cfg), [cfg]);
  const issues = [...diag.errors, ...diag.warnings.filter((w) => w.code !== 'SKIPPED')];
  const blockers = diag.errors;
  const last = step === STEPS.length - 1;

  const generate = () => {
    const r = generateWorkout(cfg);
    if (!r.ok) { setFailure(r.diagnosis.errors); return; }
    saveLast(cfg);
    onDone(r.workout);
  };

  const stepOk = [
    () => cfg.total > 0 && !diag.errors.some((e) => e.code === 'TOTAL'),
    () => !diag.errors.some((e) => e.code === 'POOL' || e.code === 'TOTAL_MULTIPLE'),
    () => selected.size > 0,
    () => true,
    () => !diag.errors.some((e) => e.code.startsWith('BLOCK_') && e.code !== 'BLOCK_EMPTY' && e.code !== 'BLOCK_UNREACHABLE'),
    () => true,
  ][step]();

  return html`<div className="ov wiz" role="dialog" aria-modal="true" aria-label="Crear entrenamiento">
    <div className="ov-in">
      <div className="ov-top"><button type="button" className="ghost" onClick=${step === 0 ? onCancel : () => setStep(step - 1)}><${Icon} n="back"/>${step === 0 ? 'Cancelar' : 'Atrás'}</button>
        <span className="eyebrow">Paso ${step + 1} de ${STEPS.length} · ${STEPS[step]}</span></div>
      <div className="dots" role="tablist">${STEPS.map((s, i) => html`<button key=${s} type="button" className=${i === step ? 'on' : i < step ? 'past' : ''} aria-label=${s} aria-selected=${i === step} onClick=${() => setStep(i)}></button>`)}</div>
      <div className="strip" aria-label="Resumen">
        <button type="button" onClick=${() => setStep(0)}>${fmtM(cfg.total)} m</button>
        <button type="button" onClick=${() => setStep(1)}>${cfg.pool} m</button>
        <button type="button" onClick=${() => setStep(2)}>${selected.size} ejerc.</button>
        <button type="button" onClick=${() => setStep(3)}>${cfg.equipment.length ? cfg.equipment.length + ' material' : 'sin material'}</button>
        <button type="button" onClick=${() => setStep(4)}>${DISTRIBUTIONS[cfg.distribution] ? DISTRIBUTIONS[cfg.distribution].name : 'Personalizado'}</button>
        <button type="button" onClick=${() => setStep(5)}>${GOALS[cfg.goal].name}</button>
      </div>
      ${step === 0 && html`<${StepDistance} cfg=${cfg} set=${set} history=${history} fixIssues=${issues}/>`}
      ${step === 1 && html`<${StepPool} cfg=${cfg} set=${set} fixIssues=${issues}/>`}
      ${step === 2 && html`<${StepExercises} cfg=${cfg} setCfg=${setCfg}/>`}
      ${step === 3 && html`<${StepEquipment} cfg=${cfg} set=${set} skipped=${diag.skipped || []}/>`}
      ${step === 4 && html`<${StepBlocks} cfg=${cfg} set=${set}/>`}
      ${step === 5 && html`<${StepGoal} cfg=${cfg} set=${set}/>`}
      ${last && (failure || blockers.length > 0) && html`<${Issues} issues=${failure || blockers} onFix=${(f) => set(null, f)}/>`}
      ${last && !failure && blockers.length === 0 && diag.warnings.filter((w) => w.code !== 'SKIPPED').length > 0 && html`<${Issues} issues=${diag.warnings.filter((w) => w.code !== 'SKIPPED')} onFix=${(f) => set(null, f)}/>`}
    </div>
    <div className="wiz-foot"><div className="wiz-in">
      ${last
        ? html`<button type="button" className="cta" onClick=${generate} disabled=${blockers.length > 0 && !failure}><${Icon} n="dice"/>GENERAR ENTRENAMIENTO</button>`
        : html`<button type="button" className="cta" onClick=${() => setStep(step + 1)} disabled=${!stepOk}>CONTINUAR</button>`}
    </div></div>
  </div>`;
}
