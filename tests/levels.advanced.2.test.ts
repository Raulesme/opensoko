import { describe } from 'vitest';
import { ADVANCED_LEVELS } from '../src/levels/advanced';
import { verifyLevels } from './helpers/verifyPack';

// Sharded (index % 4 === 2) so the heavy solver runs happen in parallel test workers.
describe('advanced pack, shard 2', () =>
  verifyLevels(ADVANCED_LEVELS.filter((_, index) => index % 4 === 2)));
