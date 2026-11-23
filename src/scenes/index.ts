import type { SceneDefinition } from '../engine/scene';
import { spinningCube } from './spinning-cube';

// Register new experiments here. The first entry is the default scene.
export const scenes: SceneDefinition[] = [
  spinningCube,
];
