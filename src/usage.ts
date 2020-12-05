export type Usage = '0' | '1' | '*';
export type SubUsage = '0' | '1';

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
