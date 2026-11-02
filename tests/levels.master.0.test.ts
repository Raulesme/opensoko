import { describe } from 'vitest';
import { MASTER_LEVELS } from '../src/levels/master';
import { verifyLevels } from './helpers/verifyPack';

// Sharded (index % 2 === 0) so the heavy solver runs happen in parallel test workers.
describe('master pack, shard 0', () =>
  verifyLevels(MASTER_LEVELS.filter((_, index) => index % 2 === 0)));
