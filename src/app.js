// SWIM OS 2.0 · raíz de la aplicación: estado, persistencia y navegación.
import { html, useState, useEffect, useRef, useCallback, Icon, Logo, Sheet, Toast, fmtM, dateLong, clock } from './ui/kit.js';
import { Wizard } from './ui/wizard.js';
import { Hero, DistanceBadge, ReadOnlyBlocks, Editor } from './ui/workout.js';
import { Training, Summary } from './ui/training.js';
import { LibraryView } from './ui/library-view.js';
import { HistoryView } from './ui/history-view.js';
import { Settings } from './ui/settings.js';
import { generateAlternative, regenerateBlock, startCheck, newSeed, validateWorkout, plannedMeters } from './engine/index.js';
import * as S from './engine/session.js';
import * as H from './engine/history.js';
import { defaultWorkout } from './legacy.js';

const VERSION = '2.0';
const store = H.createStore();

function loadWorkout() {
  const raw = store.get(H.KEYS.workout, null);
  if (raw && raw.v === 2 && Array.isArray(raw.items) && raw.config) return raw;
  return (raw && H.migrateOldWorkout(raw)) || defaultWorkout();
}

function useStoredState(key, init) {
  const [v, setV] = useState(init);
  useEffect(() => { store.set(key, v); }, [v]);
  return [v, setV];
}

export function App() {
  const [tab, setTab] = useState('hoy');
  const [w, setW] = useStoredState(H.KEYS.workout, loadWorkout);
  const [prefs, setPrefs] = useStoredState(H.KEYS.prefs, () => H.loadPrefs(store));
  const [history, setHistory] = useState(() => H.loadHistory(store));
  const [favs, setFavs] = useState(() => H.loadFavorites(store));
  const [session, setSession] = useState(() => S.restoreSession(store.get(H.KEYS.session, null)));
  const [training, setTraining] = useState(() => !!S.restoreSession(store.get(H.KEYS.session, null)));
  const [wizard, setWizard] = useState(null);
  const [toast, setToast] = useState('');
  const [summary, setSummary] = useState(null);
  const [warn, setWarn] = useState(null);
  const [dataMsg, setDataMsg] = useState(null);
  const toastTimer = useRef(0);

  const say = useCallback((m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3200); }, []);

  // la sesión viva se guarda en cada cambio (sobrevive a recargas y a cerrar la pestaña)
  useEffect(() => {
    if (session && session.phase !== 'done') store.set(H.KEYS.session, session);
    else store.remove(H.KEYS.session);
  }, [session]);

  // al terminar: guardar en el historial y mostrar el resumen
  useEffect(() => {
    if (!session || session.phase !== 'done') return;
    const sum = S.summarize(session);
    const entry = H.makeEntry(session, sum);
    setHistory(H.saveEntry(store, entry));
    setSummary({ summary: sum, entry });
    setSession(null);
    setTraining(false);
  }, [session && session.phase === 'done']);

  const savePrefs = (p) => { setPrefs(p); };
  const edit = (next) => setW(next);
  const sessionActive = !!session;

  const accept = (nw) => { setW(nw); setWizard(null); setTab('hoy'); say('Entrenamiento listo: ' + fmtM(plannedMeters(nw.items)) + ' m'); window.scrollTo(0, 0); };
  const openWizard = (base) => setWizard(H.configFromPrefs({ ...prefs, lastConfig: base || prefs.lastConfig }));

  const alternative = () => {
    const r = generateAlternative(w);
    if (r.ok) { setW(r.workout); say('Nueva opción con los mismos parámetros'); } else say('No pude generar otra opción: ' + r.diagnosis.errors[0].message);
  };
  const regen = (b) => {
    const r = regenerateBlock(w, b);
    if (r.ok) { setW(r.workout); say('Bloque regenerado'); } else say(r.message);
  };
  const favorite = () => { setFavs(H.addFavorite(store, w)); say('Guardado en favoritos'); };

  const begin = (force) => {
    const chk = startCheck(w);
    if (!chk.ok && !force) { setWarn(chk); return; }
    setWarn(null);
    setSession(S.createSession(w));
    setTraining(true);
  };

  const repeat = (e) => {
    const src = e.workout;
    const nw = { v: 2, id: 'w' + Date.now().toString(36), name: src.name || e.name, createdAt: Date.now(), seed: src.seed, pool: src.pool, target: src.target, blockTargets: src.blockTargets, config: src.config, items: src.items, edited: true, warnings: [], skipped: [], attempts: 1 };
    setW(nw); setTab('hoy'); say('Sesión cargada: lista para repetir'); window.scrollTo(0, 0);
  };
  const asBase = (e) => { setTab('hoy'); setWizard(H.configFromPrefs({ ...prefs, lastConfig: { ...e.workout.config, seed: newSeed() } })); };
  const delEntry = (e) => { const list = history.filter((x) => x.id !== e.id); store.set(H.KEYS.history, list); setHistory(list); };

  // copia de seguridad
  const exportData = () => {
    const data = { app: 'swim-os', version: 2, exported: new Date().toISOString(), workout: w, history, favorites: favs, prefs };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'swim-os-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setDataMsg({ text: 'Copia exportada.' });
  };
  const importData = (ev) => {
    const f = ev.target.files && ev.target.files[0]; ev.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result));
        if (!d || d.app !== 'swim-os') throw new Error('x');
        const hs = (Array.isArray(d.history) ? d.history : []).map(H.migrateEntry).filter(Boolean);
        const merged = [...hs, ...history.filter((e) => !hs.some((h) => h.id === e.id))].sort((a, b) => b.date - a.date).slice(0, 500);
        store.set(H.KEYS.history, merged); setHistory(merged);
        if (d.workout) { const nw = d.workout.v === 2 ? d.workout : H.migrateOldWorkout(d.workout); if (nw) setW(nw); }
        if (Array.isArray(d.favorites)) { store.set(H.KEYS.favorites, d.favorites); setFavs(H.loadFavorites(store)); }
        if (d.prefs) setPrefs({ ...H.defaultPrefs(), ...d.prefs });
        setDataMsg({ text: `Importado: ${hs.length} sesiones.` });
      } catch (e) { setDataMsg({ text: 'Ese archivo no es una copia de SWIM OS.', err: true }); }
    };
    r.readAsText(f);
  };
  const resetAll = () => {
    for (const k of Object.values(H.KEYS)) store.remove(k);
    setHistory([]); setFavs([]); setPrefs(H.defaultPrefs()); setW(defaultWorkout()); setSession(null); setTraining(false);
    setDataMsg({ text: 'Datos borrados.' });
  };

  const check = validateWorkout(w, { config: w.config });
  const tabs = [['hoy', 'home', 'Hoy'], ['rutina', 'list', 'Rutina'], ['lib', 'book', 'Ejercicios'], ['hist', 'hist', 'Historial'], ['ajustes', 'gear', 'Ajustes']];

  return html`<div className="app">
    ${tab === 'hoy' && html`<div className="page">
      <div className="top"><div className="mark"><${Logo}/>SWIM<i>OS</i></div><span className="date">${dateLong(Date.now())}</span></div>
      ${session && !training && html`<div className="note ok"><b>Tenés un entrenamiento en curso.</b><div className="fixes"><button type="button" className="btn small primary" onClick=${() => setTraining(true)}>Continuar</button><button type="button" className="btn small danger" onClick=${() => setSession(null)}>Descartar</button></div></div>`}
      <button type="button" className="create" onClick=${() => openWizard()}><${Icon} n="plus"/>CREAR NUEVO ENTRENAMIENTO</button>
      <${Hero} w=${w} history=${history}/>
      <${DistanceBadge} w=${w}/>
      <div className="actions">
        <button type="button" className="btn" onClick=${alternative}><${Icon} n="dice"/>Otra opción</button>
        <button type="button" className="btn" onClick=${favorite}><${Icon} n="star"/>Favorito</button>
        <button type="button" className="btn" onClick=${() => { setTab('rutina'); window.scrollTo(0, 0); }}><${Icon} n="edit"/>Editar</button>
      </div>
      ${check.warnings.length > 0 && html`<details className="more"><summary>Avisos (${check.warnings.length})<${Icon} n="down"/></summary><div className="in"><ul>${check.warnings.map((x, i) => html`<li key=${i}>${x.message}</li>`)}</ul></div></details>`}
      <${ReadOnlyBlocks} w=${w}/>
      ${favs.length > 0 && html`<section><div className="block-h"><h3>Favoritos</h3></div><ul className="favs">${favs.map((f) => html`<li key=${f.id}><button type="button" className="line" onClick=${() => { setW(f.workout); say('Favorito cargado'); window.scrollTo(0, 0); }}><span><span className="nm">${f.name}</span><span className="sub num">${fmtM(plannedMeters(f.workout.items))} m · piscina ${f.workout.pool} m</span></span><span className="chip">Cargar</span></button>
        <button type="button" className="ghost sq" aria-label=${'Quitar ' + f.name} onClick=${() => setFavs(H.removeFavorite(store, f.id))}><${Icon} n="x"/></button></li>`)}</ul></section>`}
    </div>`}
    ${tab === 'rutina' && html`<div className="page"><div className="top"><h1 className="h1">Rutina</h1><button type="button" className="btn small" onClick=${() => openWizard()}><${Icon} n="plus"/>Nuevo</button></div>
      <${Editor} w=${w} setW=${edit} onRegenBlock=${regen} onAlternative=${alternative} history=${history} sessionActive=${sessionActive}/></div>`}
    ${tab === 'lib' && html`<div className="page"><${LibraryView} prefs=${prefs} setPrefs=${savePrefs}/></div>`}
    ${tab === 'hist' && html`<div className="page"><${HistoryView} history=${history} onRepeat=${repeat} onBase=${asBase} onDelete=${delEntry}/></div>`}
    ${tab === 'ajustes' && html`<div className="page"><${Settings} prefs=${prefs} setPrefs=${savePrefs} onExport=${exportData} onImport=${importData} onReset=${resetAll} msg=${dataMsg} version=${VERSION}/></div>`}

    ${(tab === 'hoy' || tab === 'rutina') && !session && html`<div className="cta-wrap"><button type="button" className="cta" onClick=${() => begin(false)}><${Icon} n="play"/>INICIAR ENTRENAMIENTO</button></div>`}
    ${(tab === 'hoy' || tab === 'rutina') && session && !training && html`<div className="cta-wrap"><button type="button" className="cta" onClick=${() => setTraining(true)}><${Icon} n="play"/>CONTINUAR ENTRENAMIENTO</button></div>`}

    <div className="tabs"><nav aria-label="Secciones">${tabs.map(([k, ic, l]) => html`<button key=${k} type="button" aria-current=${tab === k ? 'page' : undefined} onClick=${() => { setTab(k); window.scrollTo(0, 0); }}><${Icon} n=${ic}/>${l}</button>`)}</nav></div>

    ${wizard && html`<${Wizard} initial=${wizard} history=${history} onCancel=${() => setWizard(null)} onDone=${accept} saveLast=${(c) => setPrefs({ ...prefs, lastConfig: { ...c, seed: undefined } })}/>`}
    ${training && session && html`<${Training} session=${session} setSession=${setSession} pool=${session.workout.pool} onExit=${() => { setSession(null); setTraining(false); }}/>`}
    ${summary && html`<${Summary} summary=${summary.summary} entry=${summary.entry} onClose=${() => { setSummary(null); setTab('hist'); }}
      onRepeat=${() => { const e = summary.entry; setSummary(null); repeat(e); }} onDelete=${() => { delEntry(summary.entry); setSummary(null); say('Quitado del historial'); }}/>`}
    ${warn && html`<${Sheet} title="La rutina no está completa" onClose=${() => setWarn(null)}>
      <p>${warn.errors.length ? warn.errors.map((e) => e.message).join(' ') : 'Hay diferencias con lo planificado.'}</p>
      <div className="tools"><button type="button" className="btn primary" onClick=${() => { setWarn(null); setTab('rutina'); }}>Corregir</button><button type="button" className="btn" onClick=${() => begin(true)}>Empezar igual</button><button type="button" className="btn" onClick=${() => setWarn(null)}>Cancelar</button></div><//>`}
    <${Toast} msg=${toast}/>
  </div>`;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
