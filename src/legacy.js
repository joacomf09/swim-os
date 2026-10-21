// La rutina de 1.500 m que traía SWIM OS 1.x. Se usa como rutina inicial y
// pasa por la misma migración que las rutinas guardadas por la versión anterior.
import { migrateOldWorkout } from './engine/history.js';

export const DEFAULT_V1 = { target: 1500, pool: 25, exercises: [
  { id: 'e1', block: 'w', type: 'crol', name: 'Crol suave', reps: 1, dist: 100, intensity: '3/10', rest: 15 },
  { id: 'e2', block: 'w', type: 'pull', name: 'Solo brazos con pull buoy', reps: 1, dist: 100, intensity: '4/10', rest: 20 },
  { id: 'e3', block: 'w', type: 'kick', name: 'Pataleo de crol con tabla', reps: 2, dist: 50, intensity: '4/10', rest: 15 },
  { id: 'e4', block: 't', type: 'breast', name: 'Patada de rana con tabla', reps: 2, dist: 50, intensity: '5/10', rest: 20 },
  { id: 'e5', block: 't', type: 'dolphin', name: 'Patada de delfín boca arriba', reps: 2, dist: 50, intensity: '5/10', rest: 25 },
  { id: 'e6', block: 't', type: 'pull', name: 'Brazos con pull buoy', reps: 1, dist: 100, intensity: 'Moderada 6/10', rest: 20 },
  { id: 'e7', block: 't', type: 'crol', name: 'Crol progresivo', reps: 1, dist: 100, intensity: '5 → 8/10', rest: 30 },
  { id: 'e8', block: 't', type: 'sprint', name: 'Sprint crol', reps: 4, dist: 25, intensity: '90–95%', rest: 30 },
  { id: 'e9', block: 't', type: 'sprint', name: 'Sprint crol', reps: 2, dist: 50, intensity: '85–90%', rest: 40 },
  { id: 'e10', block: 'r', type: 'endurance', name: 'Crol continuo', reps: 1, dist: 300, intensity: '65–75%', rest: 45 },
  { id: 'e11', block: 'r', type: 'endurance', name: 'Crol progresivo', reps: 1, dist: 300, intensity: '65 → 85%', rest: 0 },
] };

export function defaultWorkout() {
  const w = migrateOldWorkout(DEFAULT_V1);
  return { ...w, id: 'wdefault', name: 'Rutina inicial · 1.500 m' };
}
