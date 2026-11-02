import { describe } from 'vitest';
import { BUILTIN_LEVELS } from '../src/levels/builtin';
import { verifyLevels } from './helpers/verifyPack';

describe('starter pack', () => verifyLevels(BUILTIN_LEVELS));
