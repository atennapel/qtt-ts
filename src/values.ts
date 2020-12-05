import { Usage, Abs, App, Pi, Term, Type, Var } from './core';
import * as C from './core';
import { Ix, Name } from './names';
import { Cons, foldr, index, List, Nil } from './utils/list';
import { impossible } from './utils/utils';

export type Lvl = number;

export type Head = HVar;

export interface HVar { readonly tag: 'HVar'; readonly level: Lvl }
export const HVar = (level: Lvl): HVar => ({ tag: 'HVar', level });

export type Elim = EApp;

export interface EApp { readonly tag: 'EApp'; readonly arg: Val }
export const EApp = (arg: Val): EApp => ({ tag: 'EApp', arg });

export type Spine = List<Elim>;
export type EnvV = List<Val>;
export type Clos = (val: Val) => Val;

export type Val = VType | VNe | VAbs | VPi;

export interface VType { readonly tag: 'VType' }
export const VType: VType = { tag: 'VType' };
export interface VNe { readonly tag: 'VNe'; readonly head: Head; readonly spine: Spine }
export const VNe = (head: Head, spine: Spine): VNe => ({ tag: 'VNe', head, spine });
export interface VAbs { readonly tag: 'VAbs'; readonly usage: Usage; readonly name: Name; readonly type: Val; readonly clos: Clos }
export const VAbs = (usage: Usage, name: Name, type: Val, clos: Clos): VAbs => ({ tag: 'VAbs', usage, name, type, clos });
export interface VPi { readonly tag: 'VPi'; readonly usage: Usage; readonly name: Name; readonly type: Val; readonly clos: Clos }
export const VPi = (usage: Usage, name: Name, type: Val, clos: Clos): VPi => ({ tag: 'VPi', usage, name, type, clos });

export type ValWithClosure = Val & { tag: 'VAbs' | 'VPi' };

export const VVar = (level: Lvl, spine: Spine = Nil): Val => VNe(HVar(level), spine);

export const vinst = (val: ValWithClosure, arg: Val): Val => val.clos(arg);

export const vapp = (left: Val, right: Val): Val => {
  if (left.tag === 'VAbs') return vinst(left, right);
  if (left.tag === 'VNe') return VNe(left.head, Cons(EApp(right), left.spine));
  return impossible(`vapp: ${left.tag}`);
};

export const evaluate = (t: Term, vs: EnvV): Val => {
  if (t.tag === 'Type') return VType;
  if (t.tag === 'Abs')
    return VAbs(t.usage, t.name, evaluate(t.type, vs), v => evaluate(t.body, Cons(v, vs)));
  if (t.tag === 'Pi')
    return VPi(t.usage, t.name, evaluate(t.type, vs), v => evaluate(t.body, Cons(v, vs)));
  if (t.tag === 'Var') 
    return index(vs, t.index) || impossible(`evaluate: var ${t.index} has no value`);
  if (t.tag === 'App')
    return vapp(evaluate(t.fn, vs), evaluate(t.arg, vs));
  if (t.tag === 'Let')
    return evaluate(t.body, Cons(evaluate(t.val, vs), vs));
  return t;
};

const quoteHead = (h: Head, k: Ix): Term => {
  if (h.tag === 'HVar') return Var(k - (h.level + 1));
  return h.tag;
};
const quoteElim = (t: Term, e: Elim, k: Ix): Term => {
  if (e.tag === 'EApp') return App(t, quote(e.arg, k));
  return e.tag;
};
export const quote = (v: Val, k: Ix): Term => {
  if (v.tag === 'VType') return Type;
  if (v.tag === 'VNe')
    return foldr(
      (x, y) => quoteElim(y, x, k),
      quoteHead(v.head, k),
      v.spine,
    );
  if (v.tag === 'VAbs')
    return Abs(v.usage, v.name, quote(v.type, k), quote(vinst(v, VVar(k)), k + 1));
  if (v.tag === 'VPi')
    return Pi(v.usage, v.name, quote(v.type, k), quote(vinst(v, VVar(k)), k + 1));
  return v;
};

export const normalize = (t: Term, vs: EnvV = Nil): Term => quote(evaluate(t, vs), 0);

export const show = (v: Val, k: Lvl): string => C.show(quote(v, k));
