// AJUSTES: preferencias persistentes, nivel, copia de seguridad y datos.
import { html, useState, Icon, Segmented, Stepper } from './kit.js';
import { LEVELS, EQUIPMENT, EQUIPMENT_ORDER, BY_ID } from '../library.js';
import { INTENSITIES, REST_MODES, GOALS } from '../engine/index.js';

export function Settings({ prefs, setPrefs, onExport, onImport, onReset, msg, version }) {
  const [confirm, setConfirm] = useState(false);
  const set = (p) => setPrefs({ ...prefs, ...p });
  const toggleEq = (e) => set({ equipment: prefs.equipment.includes(e) ? prefs.equipment.filter((x) => x !== e) : [...prefs.equipment, e] });
  return html`<div className="settings">
    <div className="top"><h1 className="h1">Ajustes</h1></div>
    <section className="card"><h2>Tu nivel</h2><${Segmented} label="Nivel" value=${prefs.level} options=${Object.values(LEVELS).map((l) => [l.id, l.name])} onChange=${(v) => set({ level: v })}/>
      <p className="hint">Con las categorías, solo entran ejercicios hasta tu nivel. Los principiantes tienen menos repeticiones de sprint y palas más limitadas.</p></section>
    <section className="card"><h2>Piscina habitual</h2><${Segmented} label="Piscina" value=${[25, 50].includes(prefs.pool) ? prefs.pool : 0} options=${[[25, '25 m'], [50, '50 m']]} onChange=${(v) => set({ pool: v })}/></section>
    <section className="card"><h2>Material que tenés</h2>
      <div className="eqgrid">${EQUIPMENT_ORDER.map((e) => html`<button key=${e} type="button" className=${'opt eq' + (prefs.equipment.includes(e) ? ' on' : '')} aria-pressed=${prefs.equipment.includes(e)} onClick=${() => toggleEq(e)}><b>${EQUIPMENT[e].name}</b></button>`)}</div>
      <label className="check"><input type="checkbox" checked=${prefs.allowNoGear} onChange=${(e) => set({ allowNoGear: e.target.checked })}/><span><b>Permitir alternativas sin material</b><small>Ejercicios equivalentes cuando falta algo.</small></span></label></section>
    <section className="card"><h2>Preferencias por defecto</h2>
      <div className="field"><label>Objetivo</label><select value=${prefs.goal} onChange=${(e) => set({ goal: e.target.value })}>${Object.values(GOALS).map((g) => html`<option key=${g.id} value=${g.id}>${g.name}</option>`)}</select></div>
      <div className="field"><label>Intensidad</label><${Segmented} label="Intensidad" value=${prefs.intensity} options=${Object.values(INTENSITIES).map((i) => [i.id, i.name])} onChange=${(v) => set({ intensity: v })}/></div>
      <div className="field"><label>Descansos</label><${Segmented} label="Descansos" value=${prefs.restMode} options=${Object.values(REST_MODES).map((i) => [i.id, i.name])} onChange=${(v) => set({ restMode: v })}/></div></section>
    ${prefs.excluded.length > 0 && html`<section className="card"><h2>Ejercicios excluidos</h2><ul className="mini">${prefs.excluded.map((id) => html`<li key=${id}>${BY_ID[id] ? BY_ID[id].name : id} <button type="button" className="btn small" onClick=${() => set({ excluded: prefs.excluded.filter((x) => x !== id) })}>Permitir</button></li>`)}</ul></section>`}
    <section className="card"><h2>Tus datos</h2>
      <p className="muted small">Todo vive en este dispositivo. Exportá una copia antes de cambiar de móvil o borrar los datos del navegador.</p>
      <div className="tools"><button type="button" className="btn" onClick=${onExport}><${Icon} n="download"/>Exportar copia</button>
        <span className="btn file-btn"><${Icon} n="upload"/>Importar copia<input type="file" accept="application/json,.json" aria-label="Importar copia" onChange=${onImport}/></span></div>
      ${msg && html`<p className=${'msg' + (msg.err ? ' err' : '')} role="status">${msg.text}</p>`}
      ${confirm ? html`<div className="confirm"><span>¿Borrar historial, favoritos y preferencias?</span><div><button type="button" className="btn" onClick=${() => setConfirm(false)}>No</button><button type="button" className="btn danger" onClick=${() => { setConfirm(false); onReset(); }}>Borrar todo</button></div></div>`
        : html`<button type="button" className="btn danger" onClick=${() => setConfirm(true)}><${Icon} n="trash"/>Borrar todos los datos</button>`}</section>
    <p className="muted small">SWIM OS ${version}. Funciona sin conexión una vez cargada. Las recomendaciones son orientativas: si tenés dudas médicas, consultá con un profesional.</p>
  </div>`;
}
