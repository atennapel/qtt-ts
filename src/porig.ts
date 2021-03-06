import { List, map, range, zipWith, and } from './utils/list';

// partially ordered semiring
// laws:
// + 0 commutative monoid
// * 1 monoid
// multiplication left/right distributive over addition
// zero annihilates multiplication
// if a <= b then
//   x + a <= x + b
//   x * a <= x * b
//   a * x <= b * x
// for linear types:
//   0 <= 1 should not hold
//   x + 1 = 0 must have no solution
//   x + 1 <= 0 must not hold
export interface PORig<T> {
  zero: T;
  one: T;
  default: T;
  add(a: T, b: T): T;
  multiply(a: T, b: T): T;
  sub(a: T, b: T): boolean;
  lub(a: T, b: T): T | null;
}

export type UsesRig<T> = List<T>;

export const noUsesRig = <T>(rig: PORig<T>, size: number): UsesRig<T> =>
  map(range(size), () => rig.zero);

export const addUsesRig = <T>(rig: PORig<T>, a: UsesRig<T>, b: UsesRig<T>): UsesRig<T> =>
  zipWith(rig.add, a, b);
export const multiplyUsesRig = <T>(rig: PORig<T>, a: T, b: UsesRig<T>): UsesRig<T> =>
  map(b, x => rig.multiply(a, x));

export const lubUsesRig = <T>(rig: PORig<T>, a: UsesRig<T>, b: UsesRig<T>): UsesRig<T> | null => {
  const l = zipWith(rig.lub, a, b);
  return and(map(l, x => x !== null)) ? l as UsesRig<T> : null;
};

// trivial semiring (regular dependent types)
export type Triv = '1';
export const Triv = ['1'];
export const trivial : PORig<Triv> = {
  zero: '1',
  one: '1',
  default: '1',
  add(_a: '1', _b: '1') { return '1' },
  multiply(_a: '1', _b: '1') { return '1' },
  sub(_a: '1', _b: '1') { return true },
  lub(_a: '1', _b: '1') { return '1' },
};

// boolean semiring (0s must be unused, * may or may not be used)
export type Bool = '0' | '*';
export const Bool = ['0', '*'];
export const bool : PORig<Bool> = {
  zero: '0',
  one: '*',
  default: '*',
  add(a: Bool, b: Bool) { return (a === '*') || (b === '*') ? '*' : '0' },
  multiply(a: Bool, b: Bool) { return (a === '*') && (b === '*') ? '*' : '0' },
  sub(a: Bool, b: Bool) { return a === b || a === '0' },
  lub(a: Bool, b: Bool) { return a === b ? a : '*' },
};

// boolean semiring 2 (1s must be used)
export type Bool2 = '0' | '1';
export const Bool2 = ['0', '1'];
export const bool2 : PORig<Bool2> = {
  zero: '0',
  one: '1',
  default: '1',
  add(a: Bool2, b: Bool2) { return (a === '1') || (b === '1') ? '1' : '0' },
  multiply(a: Bool2, b: Bool2) { return (a === '1') && (b === '1') ? '1' : '0' },
  sub(a: Bool2, b: Bool2) { return a === b },
  lub(a: Bool2, b: Bool2) { return a === b ? a : null },
};

// linearity semiring
export type Lin = '0' | '1' | '*';
export const Lin = ['0', '1', '*'];
export const linear : PORig<Lin> = {
  zero: '0',
  one: '1',
  default: '*',
  add(a: Lin, b: Lin) {
    if (a === '*' || b === '*') return '*';
    if (a === '1' && b === '1') return '*';
    if (a === '1' || b === '1') return '1';
    return '0';
  },
  multiply(a: Lin, b: Lin) {
    if (a === '0' || b === '0') return '0';
    if (a === '1') return b;
    if (b === '1') return a;
    return '*';
  },
  sub(a: Lin, b: Lin) {
    if (a === b) return true;
    if (a === '0' && b === '*') return true;
    if (a === '1' && b === '*') return true;
    return false;
  },
  lub(a: Lin, b: Lin) {
    if (a === b) return a;
    return '*';
  },
};

export type FiveLin = '0' | '1-' | '1' | '1+' | '*';
export const FiveLin = ['0', '1-', '1', '1+', '*'];
export const fiveLinear : PORig<FiveLin> = {
  zero: '0',
  one: '1',
  default: '*',
  add(a: FiveLin, b: FiveLin) {
    /*
    +  0  1-  1  1+  *
    0  0  1-  1  *   *
    1- 1- *   *  *   *
    1  1  *   *  1+  *
    1+ *  *   1+ 1+  *
    *  *  *   *  *   *
    */
    if (a === '*' || b === '*') return '*';
    if (a === '1' && b === '1') return '*';
    if (a === '1-' && b === '1-') return '*';
    if (a === '1+' && b === '0') return '*';
    if (a === '0' && b === '1+') return '*';
    if (a === '1-' && b === '1+') return '*';
    if (a === '1+' && b === '1-') return '*';
    if (a === '1' && b === '1-') return '*';
    if (a === '1-' && b === '1') return '*';
    if (a === '0' && b === '0') return '0';
    if (a === '1' && b === '0') return '1';
    if (a === '0' && b === '1') return '1';
    if (a === '1-' && b === '0') return '1-';
    if (a === '0' && b === '1-') return '1-';
    if (a === '1+' && b === '1') return '1+';
    if (a === '1' && b === '1+') return '1+';
    return '0';
  },
  multiply(a: FiveLin, b: FiveLin) {
    /*
    *  0  1-  1  1+  *
    0  0  0   0  0   0
    1- 0  1-  1- *   *
    1  0  1-  1  1+  *
    1+ 0  *   1+ 1+  *
    *  0  *   *  *   *
    */
    if (a === '0' || b === '0') return '0';
    if (a === '1') return b;
    if (b === '1') return a;
    if (a === '1-' && b === '1-') return '1-';
    if (a === '1+' && b === '1+') return '1+';
    if (a === '1+' && b === '1-') return '*';
    if (a === '1-' && b === '1+') return '*';
    return '*';
  },
  sub(a: FiveLin, b: FiveLin) {
    /*
    0  1-
    0  *
    1- *
    1  1-
    1  1+
    1  *
    1+ *
    */
    if (a === b) return true;
    if (a === '0' && b === '1-') return true;
    if (a === '0' && b === '*') return true;
    if (a === '1-' && b === '*') return true;
    if (a === '1' && b === '1-') return true;
    if (a === '1' && b === '1+') return true;
    if (a === '1' && b === '*') return true;
    if (a === '1+' && b === '*') return true;
    return false;
  },
  lub(a: FiveLin, b: FiveLin) {
    /*
    0  1-  1-
    1- 1   1-
    1  1+  1+
    _  _   *
    */
    if (a === b) return a;
    if ((a === '0' && b === '1-') || (a === '1-' && b === '0')) return '1-';
    if ((a === '1' && b === '1-') || (a === '1' && b === '1-')) return '1-';
    if ((a === '1' && b === '1+') || (a === '1+' && b === '1')) return '1+';
    return '*';
  },
};

