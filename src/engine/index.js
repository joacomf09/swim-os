// @ts-check
// Fachada del motor: todo lo que la interfaz necesita, sin React ni DOM.
export * from './config.js';
export * from './rng.js';
export { generateWorkout, generateAlternative, regenerateBlock } from './generator.js';
export { diagnose } from './diagnose.js';
export { validateWorkout, plannedMeters, blockMeters, meters, prepMeters } from './validator.js';
export * from './editing.js';
export * from './estimate.js';
export { buildCandidates } from './candidates.js';
export * from './history.js';
