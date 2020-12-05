import { chooseName, Name } from './names';
import * as C from './core';
import { Cons, index, List, Nil } from './utils/list';
import { impossible } from './utils/utils';
import { Lvl, quote, Val } from './values';
import { Usage } from './usage';

export type Term = Type | Var | Pi | Abs | App | Let;

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

const showP = (b: boolean, t: Term) => b ? `(${show(t)})` : show(t);
const isSimple = (t: Term) => t.tag === 'Type' || t.tag === 'Var'; 
export const show = (t: Term): string => {
  if (t.tag === 'Var') return t.name;
  if (t.tag === 'Type') return 'Type';
  if (t.tag === 'Pi') {
    const [params, ret] = flattenPi(t);
    return `${params.map(([u, x, t]) => u === '*' && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Let', t) : `(${u === '*' ? '' : `${u} `}${x} : ${show(t)})`).join(' -> ')} -> ${show(ret)}`;
  }
  if (t.tag === 'Abs') {
    const [params, body] = flattenAbs(t);
    return `\\${params.map(([u, x, t]) => t ? `(${u === '*' ? '' : `${u} `}${x} : ${show(t)})` : x).join(' ')}. ${show(body)}`;
  }
  if (t.tag === 'App') {
    const [fn, args] = flattenApp(t);
    return `${showP(!isSimple(fn), fn)} ${args.map(t => showP(!isSimple(t), t)).join(' ')}`;
  }
  if (t.tag === 'Let')
    return `let ${t.usage === '*' ? '' : `${t.usage} `}${t.name}${t.type ? ` : ${showP(t.type.tag === 'Let', t.type)}` : ''} = ${showP(t.val.tag === 'Let', t.val)}; ${show(t.body)}`;
  return t;
};

export const fromCore = (t: C.Term, ns: List<Name> = Nil): Term => {
  if (t.tag === 'Var') return Var(index(ns, t.index) || impossible(`var out of scope in fromCore: ${t.index}`));
  if (t.tag === 'Type') return Type;
  if (t.tag === 'App') return App(fromCore(t.fn, ns), fromCore(t.arg, ns));
  if (t.tag === 'Pi') {
    const x = chooseName(t.name, ns);
    return Pi(t.usage, x, fromCore(t.type, ns), fromCore(t.body, Cons(x, ns)));
  }
  if (t.tag === 'Abs') {
    const x = chooseName(t.name, ns);
    return Abs(t.usage, x, fromCore(t.type, ns), fromCore(t.body, Cons(x, ns)));
  }
  if (t.tag === 'Let') {
    const x = chooseName(t.name, ns);
    return Let(t.usage, x, fromCore(t.type, ns), fromCore(t.val, ns), fromCore(t.body, Cons(x, ns)));
  }
  return t;
};

export const showCore = (t: C.Term, ns: List<Name> = Nil): string => show(fromCore(t, ns));
export const showVal = (v: Val, k: Lvl = 0, ns: List<Name> = Nil): string => show(fromCore(quote(v, k), ns));
