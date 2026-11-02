import { describe, expect, it } from 'vitest';
import { APP_NAME } from '../src/meta';

describe('meta', () => {
  it('exposes the app name', () => {
    expect(APP_NAME).toBe('OpenSoko');
  });
});
