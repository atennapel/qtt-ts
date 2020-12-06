import { List, map, range, zipWith } from './utils/list';

export type Usage = '0' | '1' | '*';

export const multiply = (a: Usage, b: Usage): Usage => {
  if (a === '0' || b === '0') return '0';
  if (a === '1') return b;
  if (b === '1') return a;
  return '*';
};

export const add = (a: Usage, b: Usage): Usage => {
  if (a === '*' || b === '*') return '*';
  if (a === '0') return b;
  if (b === '0') return b;
  return '*';
};

export type Uses = List<Usage>;

export const noUses = (size: number): Uses => map(range(size), _ => '0');

export const addUses = (a: Uses, b: Uses): Uses => zipWith(add, a, b);
export const multiplyUses = (a: Usage, b: Uses): Uses => map(b, x => multiply(a, x));

export const checkUse = (ex: Usage, act: Usage): boolean => {
  if (ex === '0' && act !== '0') return false;
  if (ex === '1' && act !== '1') return false;
  return true;
};
