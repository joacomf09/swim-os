// Tipos de SWIM OS 2.0. El código es JavaScript con comentarios JSDoc; este archivo
// documenta las estructuras y permite revisarlas con `tsc --noEmit --checkJs` si se quiere.

export type BlockId = 'warmup' | 'main' | 'endurance';
export type CategoryId = 'styles' | 'arms' | 'legs' | 'technique' | 'speed' | 'endurance';
export type EquipmentId = 'board' | 'buoy' | 'paddles' | 'fins' | 'snorkel';
export type GoalId = 'balanced' | 'endurance' | 'speed' | 'technique' | 'legs' | 'arms' | 'recovery' | 'mix';
export type Intensity = 'easy' | 'moderate' | 'hard';
export type RestMode = 'short' | 'normal' | 'long' | 'custom';
export type LevelId = 'beginner' | 'intermediate' | 'advanced';
export type DistributionId = 'balanced' | 'speed' | 'endurance' | 'technique' | 'custom';

export interface ArtSpec { pose: string; arms?: string; legs?: string; mark?: string }

export interface Variant {
  id: string; label: string; blocks: BlockId[]; rpe: [number, number]; dist: number[];
  reps: [number, number]; rest: [number, number]; kind: string; order: number; note: string;
}

export interface Exercise {
  id: string; name: string; shortName: string; category: CategoryId; stroke: string; desc: string; muscle: string;
  equipmentRequired: EquipmentId[]; equipmentOptional: EquipmentId[];
  noGearVariant: { suffix: string; note: string } | null;
  difficulty: 1 | 2 | 3; blocks: BlockId[]; rpe: [number, number]; dist: number[]; reps: [number, number];
  rest: [number, number]; kind: string; order: number; unitMult: number; paddles?: boolean; safety: string;
  instructions: string[]; mistakes: string[]; goal: string; art: ArtSpec; variants?: Partial<Variant>[];
}

export interface Selection { cats: CategoryId[]; ids: string[]; off: string[] }

export interface Config {
  total: number; pool: number; selection: Selection; equipment: EquipmentId[]; allowNoGear: boolean;
  distribution: DistributionId; blocks: Record<BlockId, number>; goal: GoalId; intensity: Intensity;
  restMode: RestMode; restCustom: number; level: LevelId; excluded: string[]; favorites: string[]; seed: number;
}

export interface Item {
  id: string; block: BlockId; exId: string; variantId: string; name: string; reps: number; dist: number;
  rest: number; rpe: number; rpeStart?: number; noGear?: boolean; manual?: boolean; note?: string;
}

export interface Issue { code: string; severity: 'error' | 'warn'; message: string; fixes: Fix[] }
export interface Fix { label: string; patch: { set?: Partial<Config>; addCats?: CategoryId[]; addIds?: string[]; addEquipment?: EquipmentId[]; removeExcluded?: string[] } }

export interface Workout {
  v: 2; id: string; name: string; createdAt: number; seed: number; pool: number; target: number;
  blockTargets: Record<BlockId, number>; config: Config; items: Item[]; edited: boolean;
  warnings: { code: string; message: string; itemId?: string }[]; skipped: { id: string; name: string; reason: string }[]; attempts: number;
}
