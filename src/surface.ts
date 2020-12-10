import { chooseName, Name } from './names';
import * as C from './core';
import { Cons, index, List, Nil } from './utils/list';
import { impossible } from './utils/utils';
import { Lvl, quote, Val } from './values';
import { Usage, UsageRig } from './usage';

export type Term = Type | Var | Pi | Abs | App | Let | Void | UnitType | Unit | Sigma | Pair | Sum | Inj;

export interface Type { readonly tag: 'Type' }
export const Type: Type = { tag: 'Type' };
export interface Var { readonly tag: 'Var'; readonly name: Name }
export const Var = (name: Name): Var => ({ tag: 'Var', name });
export interface Pi { readonly tag: 'Pi'; readonly usage: Usage; readonly name: Name; readonly type: Term; readonly body: Term }
export const Pi = (usage: Usage, name: Name, type: Term, body: Term): Pi => ({ tag: 'Pi', usage, name, type, body });
export interface Abs { readonly tag: 'Abs'; readonly usage: Usage; readonly name: Name; readonly type: Term | null; readonly body: Term }
export const Abs = (usage: Usage, name: Name, type: Term | null, body: Term): Abs => ({ tag: 'Abs', usage, name, type, body });
export interface App { readonly tag: 'App'; readonly fn: Term; readonly arg: Term }
export const App = (fn: Term, arg: Term): App => ({ tag: 'App', fn, arg });
export interface Let { readonly tag: 'Let'; readonly usage: Usage; readonly name: Name; readonly type: Term | null; readonly val: Term; readonly body: Term }
export const Let = (usage: Usage, name: Name, type: Term | null, val: Term, body: Term): Let => ({ tag: 'Let', usage, name, type, val, body });
export interface Void { readonly tag: 'Void' }
export const Void: Void = { tag: 'Void' };
export interface UnitType { readonly tag: 'UnitType' }
export const UnitType: UnitType = { tag: 'UnitType' };
export interface Unit { readonly tag: 'Unit' }
export const Unit: Unit = { tag: 'Unit' };
export interface Sigma { readonly tag: 'Sigma'; readonly usage: Usage; readonly name: Name; readonly type: Term; readonly body: Term }
export const Sigma = (usage: Usage, name: Name, type: Term, body: Term): Sigma => ({ tag: 'Sigma', usage, name, type, body });
export interface Pair { readonly tag: 'Pair'; readonly fst: Term; readonly snd: Term }
export const Pair = (fst: Term, snd: Term): Pair => ({ tag: 'Pair', fst, snd });
export interface Sum { readonly tag: 'Sum'; readonly left: Term; readonly right: Term }
export const Sum = (left: Term, right: Term): Sum => ({ tag: 'Sum', left, right });
export interface Inj { readonly tag: 'Inj'; readonly which: 'Left' | 'Right'; readonly val: Term }
export const Inj = (which: 'Left' | 'Right', val: Term): Inj => ({ tag: 'Inj', which, val });

export const flattenPi = (t: Term): [[Usage, Name, Term][], Term] => {
  const params: [Usage, Name, Term][] = [];
  let c = t;  
  while (c.tag === 'Pi') {
    params.push([c.usage, c.name, c.type]);
    c = c.body;
  }
  return [params, c];
};
export const flattenAbs = (t: Term): [[Usage, Name, Term | null][], Term] => {
  const params: [Usage, Name, Term | null][] = [];
  let c = t;  
  while (c.tag === 'Abs') {
    params.push([c.usage, c.name, c.type]);
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
export const flattenSigma = (t: Term): [[Usage, Name, Term][], Term] => {
  const params: [Usage, Name, Term][] = [];
  let c = t;  
  while (c.tag === 'Sigma') {
    params.push([c.usage, c.name, c.type]);
    c = c.body;
  }
  return [params, c];
};
export const flattenPair = (t: Term): Term[] => {
  const r: Term[] = [];
  while (t.tag === 'Pair') {
    r.push(t.fst);
    t = t.snd;
  }
  r.push(t);
  return r;
};
export const flattenSum = (t: Term): Term[] => {
  const r: Term[] = [];
  while (t.tag === 'Sum') {
    r.push(t.left);
    t = t.right;
  }
  r.push(t);
  return r;
};

const showP = (b: boolean, t: Term) => b ? `(${show(t)})` : show(t);
const isSimple = (t: Term) => t.tag === 'Type' || t.tag === 'Var' || t.tag === 'Void' || t.tag === 'UnitType' || t.tag === 'Unit' || t.tag === 'Pair'; 
export const show = (t: Term): string => {
  if (t.tag === 'Type') return 'Type';
  if (t.tag === 'Void') return 'Void';
  if (t.tag === 'UnitType') return '()';
  if (t.tag === 'Unit') return '*';
  if (t.tag === 'Var') return t.name;
  if (t.tag === 'Pi') {
    const [params, ret] = flattenPi(t);
    return `${params.map(([u, x, t]) => u === UsageRig.default && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Sigma' || t.tag === 'Let', t) : `(${u === UsageRig.default ? '' : `${u} `}${x} : ${show(t)})`).join(' -> ')} -> ${show(ret)}`;
  }
  if (t.tag === 'Sigma') {
    const [params, ret] = flattenSigma(t);
    return `${params.map(([u, x, t]) => u === UsageRig.default && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Sigma' || t.tag === 'Let', t) : `(${u === UsageRig.default ? '' : `${u} `}${x} : ${show(t)})`).join(' ** ')} ** ${show(ret)}`;
  }
  if (t.tag === 'Abs') {
    const [params, body] = flattenAbs(t);
    return `\\${params.map(([u, x, t]) => t ? `(${u === UsageRig.default ? '' : `${u} `}${x} : ${show(t)})` : x).join(' ')}. ${show(body)}`;
  }
  if (t.tag === 'App') {
    const [fn, args] = flattenApp(t);
    return `${showP(!isSimple(fn), fn)} ${args.map(t => showP(!isSimple(t), t)).join(' ')}`;
  }
  if (t.tag === 'Let')
    return `let ${t.usage === UsageRig.default ? '' : `${t.usage} `}${t.name}${t.type ? ` : ${showP(t.type.tag === 'Let', t.type)}` : ''} = ${showP(t.val.tag === 'Let', t.val)}; ${show(t.body)}`;
  if (t.tag === 'Pair') {
    const ps = flattenPair(t);
    return `(${ps.map(show).join(', ')})`;
  }
  if (t.tag === 'Sum')
    return flattenSum(t).map(x => showP(!isSimple(x) && x.tag !== 'App', x)).join(' ++ ');
  if (t.tag === 'Inj')
    return `${t.which} ${showP(!isSimple(t.val), t.val)}`;
  return t;
};

export const fromCore = (t: C.Term, ns: List<Name> = Nil): Term => {
  if (t.tag === 'Type') return Type;
  if (t.tag === 'Void') return Void;
  if (t.tag === 'UnitType') return UnitType;
  if (t.tag === 'Unit') return Unit;
  if (t.tag === 'Var') return Var(index(ns, t.index) || impossible(`var out of scope in fromCore: ${t.index}`));
  if (t.tag === 'App') return App(fromCore(t.fn, ns), fromCore(t.arg, ns));
  if (t.tag === 'Pi') {
    const x = chooseName(t.name, ns);
    return Pi(t.usage, x, fromCore(t.type, ns), fromCore(t.body, Cons(x, ns)));
  }
  if (t.tag === 'Sigma') {
    const x = chooseName(t.name, ns);
    return Sigma(t.usage, x, fromCore(t.type, ns), fromCore(t.body, Cons(x, ns)));
  }
  if (t.tag === 'Abs') {
    const x = chooseName(t.name, ns);
    return Abs(t.usage, x, fromCore(t.type, ns), fromCore(t.body, Cons(x, ns)));
  }
  if (t.tag === 'Let') {
    const x = chooseName(t.name, ns);
    return Let(t.usage, x, fromCore(t.type, ns), fromCore(t.val, ns), fromCore(t.body, Cons(x, ns)));
  }
  if (t.tag === 'Pair') return Pair(fromCore(t.fst, ns), fromCore(t.snd, ns));
  if (t.tag === 'Sum') return Sum(fromCore(t.left, ns), fromCore(t.right, ns));
  if (t.tag === 'Inj') return Inj(t.which, fromCore(t.val, ns));
  return t;
};

export const showCore = (t: C.Term, ns: List<Name> = Nil): string => show(fromCore(t, ns));
export const showVal = (v: Val, k: Lvl = 0, ns: List<Name> = Nil): string => show(fromCore(quote(v, k), ns));
