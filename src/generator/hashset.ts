/**
 * An allocation-free set of 64-bit keys (two 32-bit halves), using open addressing with linear
 * probing in typed arrays. Much faster than `Set<number>` for the solver's millions of states and
 * avoids packing keys into 53 bits.
 */
export class HashSet64 {
  private mask: number;
  private lo: Int32Array;
  private hi: Int32Array;
  private used: Uint8Array;
  private count = 0;

  constructor(initialCapacity = 1 << 12) {
    let cap = 16;
    while (cap < initialCapacity) cap <<= 1;
    this.mask = cap - 1;
    this.lo = new Int32Array(cap);
    this.hi = new Int32Array(cap);
    this.used = new Uint8Array(cap);
  }

  get size(): number {
    return this.count;
  }

  /** Insert a key; returns true if it was new, false if already present. */
  add(lo: number, hi: number): boolean {
    if ((this.count + 1) * 2 > this.mask + 1) this.grow();
    return this.insert(lo | 0, hi | 0);
  }

  has(lo: number, hi: number): boolean {
    lo |= 0;
    hi |= 0;
    let i = this.slot(lo, hi);
    while (this.used[i] === 1) {
      if (this.lo[i] === lo && this.hi[i] === hi) return true;
      i = (i + 1) & this.mask;
    }
    return false;
  }

  private slot(lo: number, hi: number): number {
    // Mix both halves so keys that differ in few bits still spread out.
    let h = Math.imul(lo, 0x9e3779b1) ^ Math.imul(hi ^ (hi >>> 15), 0x85ebca77);
    h ^= h >>> 13;
    return h & this.mask;
  }

  private insert(lo: number, hi: number): boolean {
    let i = this.slot(lo, hi);
    while (this.used[i] === 1) {
      if (this.lo[i] === lo && this.hi[i] === hi) return false;
      i = (i + 1) & this.mask;
    }
    this.used[i] = 1;
    this.lo[i] = lo;
    this.hi[i] = hi;
    this.count++;
    return true;
  }

  private grow(): void {
    const oldLo = this.lo;
    const oldHi = this.hi;
    const oldUsed = this.used;
    const cap = (this.mask + 1) * 2;
    this.mask = cap - 1;
    this.lo = new Int32Array(cap);
    this.hi = new Int32Array(cap);
    this.used = new Uint8Array(cap);
    this.count = 0;
    for (let i = 0; i < oldUsed.length; i++) {
      if (oldUsed[i] === 1) this.insert(oldLo[i]!, oldHi[i]!);
    }
  }
}
