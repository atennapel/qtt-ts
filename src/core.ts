import { Ix, Name } from './names';

/*
t ::=
  Type                -- universe
  x                   -- variable
  (x : t) -> t        -- function type
  \(x : t). t         -- lambda
  t t                 -- application
  let x : t = t; t  -- let
*/
export type Term = Type | Var | Pi | Abs | App | Let;

export interface Type { readonly tag: 'Type' }
export const Type: Type = { tag: 'Type' };
export interface Var { readonly tag: 'Var'; readonly index: Ix }
export const Var = (index: Ix): Var => ({ tag: 'Var', index });
export interface Pi { readonly tag: 'Pi'; readonly name: Name; readonly type: Term; readonly body: Term }
export const Pi = (name: Name, type: Term, body: Term): Pi => ({ tag: 'Pi', name, type, body });
export interface Abs { readonly tag: 'Abs'; readonly name: Name; readonly type: Term; readonly body: Term }
export const Abs = (name: Name, type: Term, body: Term): Abs => ({ tag: 'Abs', name, type, body });
export interface App { readonly tag: 'App'; readonly fn: Term; readonly arg: Term }
export const App = (fn: Term, arg: Term): App => ({ tag: 'App', fn, arg });
export interface Let { readonly tag: 'Let'; readonly name: Name; readonly type: Term; readonly val: Term; readonly body: Term }
export const Let = (name: Name, type: Term, val: Term, body: Term): Let => ({ tag: 'Let', name, type, val, body });

export const flattenPi = (t: Term): [[Name, Term][], Term] => {
  const params: [Name, Term][] = [];
  let c = t;  
  while (c.tag === 'Pi') {
    params.push([c.name, c.type]);
    c = c.body;
  }
  return [params, c];
};
export const flattenAbs = (t: Term): [[Name, Term][], Term] => {
  const params: [Name, Term][] = [];
  let c = t;  
  while (c.tag === 'Abs') {
    params.push([c.name, c.type]);
    c = c.body;
  }
  return [params, c];
};
export const flattenApp = (t: Term): [Term, Term[]] => {
  const args: Term[] = [];
  let c = t;  
  while (c.tag === 'App') {
    args.push(c.arg);
    c = c.fn;
  }
  return [c, args.reverse()];
};

const showP = (b: boolean, t: Term) => b ? `(${show(t)})` : show(t);
const isSimple = (t: Term) => t.tag === 'Type' || t.tag === 'Var'; 
export const show = (t: Term): string => {
  if (t.tag === 'Var') return `${t.index}`;
  if (t.tag === 'Type') return 'Type';
  if (t.tag === 'Pi') {
    const [params, ret] = flattenPi(t);
    return `${params.map(([x, t]) => x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Let', t) : `(${x} : ${show(t)})`).join(' -> ')} -> ${show(ret)}`;
  }
  if (t.tag === 'Abs') {
    const [params, body] = flattenAbs(t);
    return `\\${params.map(([x, t]) => `(${x} : ${show(t)})`).join(' ')}. ${show(body)}`;
  }
  if (t.tag === 'App') {
    const [fn, args] = flattenApp(t);
    return `${showP(!isSimple(fn), fn)} ${args.map(t => showP(!isSimple(t), t)).join(' ')}`;
  }
  if (t.tag === 'Let')
    return `let ${t.name} : ${showP(t.type.tag === 'Let', t.type)} = ${showP(t.val.tag === 'Let', t.val)}; ${show(t.body)}`;
  return t;
};
