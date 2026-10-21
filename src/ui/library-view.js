// BIBLIOTECA DE EJERCICIOS: fichas con imagen, instrucciones, errores comunes y datos de uso.
import { html, useState, Icon, Art, Sheet } from './kit.js';
import { EXERCISES, CATEGORIES, EQUIPMENT, DIFFICULTY_LABEL, variantsOf, RPE_LABEL } from '../library.js';

function Sheet1({ ex, prefs, setPrefs, onClose }) {
  const vs = variantsOf(ex);
  const lo = Math.min(...vs.map((v) => v.rpe[0])), hi = Math.max(...vs.map((v) => v.rpe[1]));
  const dists = Array.from(new Set(vs.flatMap((v) => v.dist))).sort((a, b) => a - b);
  const excluded = prefs.excluded.includes(ex.id);
  const cat = CATEGORIES.find((c) => c.id === ex.category);
  return html`<${Sheet} title=${ex.name} onClose=${onClose}>
    <div className="big-art"><${Art} ex=${ex}/></div>
    <div className="tags"><span className="chip">${cat.name}</span><span className="chip">${DIFFICULTY_LABEL[ex.difficulty]}</span>
      ${ex.equipmentRequired.length ? ex.equipmentRequired.map((e) => html`<span key=${e} className="chip warn">${EQUIPMENT[e].name}</span>`) : html`<span className="chip ok">Sin material</span>`}
      ${ex.equipmentOptional.map((e) => html`<span key=${e} className="chip">opcional: ${EQUIPMENT[e].short.toLowerCase()}</span>`)}</div>
    <p>${ex.desc}</p>
    <dl className="facts-l">
      <div><dt>Objetivo técnico</dt><dd>${ex.goal}</dd></div>
      <div><dt>Qué trabaja</dt><dd>${ex.muscle}</dd></div>
      <div><dt>Intensidad recomendada</dt><dd className="num">${lo === hi ? lo : lo + '–' + hi}/10 · ${RPE_LABEL[lo]}${hi > lo ? ' a ' + RPE_LABEL[hi].toLowerCase() : ''}</dd></div>
      <div><dt>Distancias sugeridas</dt><dd className="num">${dists.join(' · ')} m</dd></div>
    </dl>
    <h3 className="h3">Cómo se hace</h3><ol className="steps">${ex.instructions.map((t, i) => html`<li key=${i}>${t}</li>`)}</ol>
    ${ex.mistakes.length > 0 && html`<h3 className="h3">Errores comunes</h3><ul className="steps">${ex.mistakes.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul>`}
    ${ex.noGearVariant && html`<div className="note ok"><b>Sin el material:</b> ${ex.noGearVariant.note}</div>`}
    ${ex.safety && html`<div className="safety"><${Icon} n="shield"/><span>${ex.safety}</span></div>`}
    <div className="tools"><button type="button" className=${'btn' + (excluded ? ' primary' : '')} onClick=${() => setPrefs({ ...prefs, excluded: excluded ? prefs.excluded.filter((i) => i !== ex.id) : [...prefs.excluded, ex.id] })}>${excluded ? 'Volver a permitirlo en mis rutinas' : 'No usar nunca en mis rutinas'}</button></div>
  <//>`;
}

export function LibraryView({ prefs, setPrefs }) {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [mine, setMine] = useState(false);
  const [open, setOpen] = useState(null);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = EXERCISES.filter((e) => (cat === 'all' || e.category === cat)
    && (!q || norm(e.name + ' ' + e.desc).includes(norm(q)))
    && (!mine || e.equipmentRequired.every((x) => prefs.equipment.includes(x)) || (prefs.allowNoGear && e.noGearVariant)));
  return html`<div className="lib">
    <div className="top"><h1 className="h1">Biblioteca</h1><span className="muted num">${list.length} ejercicios</span></div>
    <div className="field"><label htmlFor="q">Buscar</label><input id="q" type="search" value=${q} placeholder="Ej.: delfín, pull buoy…" onInput=${(e) => setQ(e.target.value)}/></div>
    <div className="chips scroll"><button type="button" className="chip-btn" aria-pressed=${cat === 'all'} onClick=${() => setCat('all')}>Todos</button>
      ${CATEGORIES.map((c) => html`<button key=${c.id} type="button" className="chip-btn" aria-pressed=${cat === c.id} onClick=${() => setCat(c.id)}>${c.short}</button>`)}
      <button type="button" className="chip-btn" aria-pressed=${mine} onClick=${() => setMine(!mine)}>Con mi material</button></div>
    <div className="xgrid lib-grid">${list.map((ex) => html`<button key=${ex.id} type="button" className="xc" onClick=${() => setOpen(ex)}>
      <${Art} ex=${ex}/><span className="xc-t"><b>${ex.name}</b><small>${DIFFICULTY_LABEL[ex.difficulty]}${ex.equipmentRequired.length ? ' · ' + ex.equipmentRequired.map((e) => EQUIPMENT[e].short).join(' + ') : ' · sin material'}${prefs.excluded.includes(ex.id) ? ' · excluido' : ''}</small></span></button>`)}</div>
    ${list.length === 0 && html`<div className="empty">No hay ejercicios con ese filtro.</div>`}
    ${open && html`<${Sheet1} ex=${open} prefs=${prefs} setPrefs=${setPrefs} onClose=${() => setOpen(null)}/>`}
  </div>`;
}
