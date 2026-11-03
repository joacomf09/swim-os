// Entrenamiento aleatorio: elegís estilos, material e intensidad; el resto sale al azar.
import { html, useState, Icon, Segmented, Stepper, fmtM } from './kit.js';
import { EQUIPMENT, EQUIPMENT_ORDER } from '../library.js';
import { INTENSITIES, QUICK_DISTANCES, STROKES, cycleOf } from '../engine/index.js';

export function QuickSheet({ initial, onGenerate, onClose }) {
  const [strokes, setStrokes] = useState(initial.strokes || []);
  const [equipment, setEquipment] = useState(initial.equipment);
  const [intensity, setIntensity] = useState(initial.intensity);
  const [total, setTotal] = useState(initial.total);
  const cy = cycleOf(initial.pool);
  const flip = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const pick = () => ({ strokes, equipment, intensity, total });
  return html`<div className="sheet-bg" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Entrenamiento aleatorio">
      <div className="sheet-h"><h2>Entrenamiento aleatorio</h2><button type="button" className="ghost" onClick=${onClose} aria-label="Cerrar"><${Icon} n="x"/></button></div>
      <div className="sheet-b">
        <p className="hint">Elegí lo que querés y el resto lo arma al azar. Sin estilos marcados, entran todos.</p>
        <div className="field"><label>Estilos</label>
          <div className="pills">${STROKES.map((s) => html`<button key=${s.id} type="button" className="pill" aria-pressed=${strokes.includes(s.id)} onClick=${() => flip(strokes, setStrokes, s.id)}>${s.name}</button>`)}</div></div>
        <div className="field"><label>Material disponible</label>
          <div className="pills">${EQUIPMENT_ORDER.map((e) => html`<button key=${e} type="button" className="pill" aria-pressed=${equipment.includes(e)} onClick=${() => flip(equipment, setEquipment, e)}>${EQUIPMENT[e].short}</button>`)}</div>
          <small className="hint">Sin material marcado solo salen ejercicios sin accesorios.</small></div>
        <div className="field"><label>Intensidad</label>
          <${Segmented} label="Intensidad" value=${intensity} options=${Object.values(INTENSITIES).map((i) => [i.id, i.name])} onChange=${setIntensity}/></div>
        <div className="field"><label>Distancia</label>
          <${Stepper} label="distancia" value=${total} step=${cy * 5 >= 250 ? cy * 5 : 250} min=${cy * 5} max=${5000} unit="m" format=${fmtM} onChange=${setTotal}/>
          <small className="hint">Siempre en múltiplos de ${cy} m (ida y vuelta hasta el celular).</small></div>
        <div className="tools"><button type="button" className="btn primary" onClick=${() => onGenerate(pick(), false)}><${Icon} n="dice"/>Generar</button><button type="button" className="btn" onClick=${() => onGenerate(pick(), true)}><${Icon} n="play"/>Generar y empezar</button></div>
      </div>
    </div>
  </div>`;
}

export function SaveSheet({ initialName, onSave, onClose }) {
  const [name, setName] = useState(initialName || '');
  return html`<div className="sheet-bg" onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Guardar entrenamiento">
      <div className="sheet-h"><h2>Guardar entrenamiento</h2><button type="button" className="ghost" onClick=${onClose} aria-label="Cerrar"><${Icon} n="x"/></button></div>
      <div className="sheet-b">
        <div className="field"><label htmlFor="sv">Nombre</label><input id="sv" type="text" maxLength="60" value=${name} onChange=${(e) => setName(e.target.value)} placeholder="Ej.: Martes de piernas"/></div>
        <div className="tools"><button type="button" className="btn primary" onClick=${() => onSave(name.trim())}>Guardar</button><button type="button" className="btn" onClick=${onClose}>Cancelar</button></div>
      </div>
    </div>
  </div>`;
}
