import { Abs, App, Pi, Term, Type, Var, Void, UnitType, Unit, Sigma, Pair, Sum, Inj, IndVoid, IndUnit, IndSigma, IndSum, IndFix, Con, Fix, World, WorldToken, HelloWorld } from './core';
import * as C from './core';
import { Ix, Name } from './names';
import { Cons, foldr, index, List, Nil } from './utils/list';
import { impossible } from './utils/utils';
import { Usage, UsageRig } from './usage';

export type Lvl = number;

export type Head = HVar;

export interface HVar { readonly tag: 'HVar'; readonly level: Lvl }
export const HVar = (level: Lvl): HVar => ({ tag: 'HVar', level });

export type Elim = EApp | EIndVoid | EIndUnit | EIndSigma | EIndSum | EIndFix | EHelloWorld;

export interface EApp { readonly tag: 'EApp'; readonly arg: Val }
export const EApp = (arg: Val): EApp => ({ tag: 'EApp', arg });
export interface EIndVoid { readonly tag: 'EIndVoid'; readonly motive: Val }
export const EIndVoid = (motive: Val): EIndVoid => ({ tag: 'EIndVoid', motive });
export interface EIndUnit { readonly tag: 'EIndUnit'; readonly motive: Val; readonly cas: Val }
export const EIndUnit = (motive: Val, cas: Val): EIndUnit => ({ tag: 'EIndUnit', motive, cas });
export interface EIndSigma { readonly tag: 'EIndSigma'; readonly usage: Usage; readonly motive: Val; readonly cas: Val }
export const EIndSigma = (usage: Usage, motive: Val, cas: Val): EIndSigma => ({ tag: 'EIndSigma', usage, motive, cas });
export interface EIndSum { readonly tag: 'EIndSum'; readonly usage: Usage; readonly motive: Val; readonly caseLeft: Val; readonly caseRight: Val }
export const EIndSum = (usage: Usage, motive: Val, caseLeft: Val, caseRight: Val): EIndSum => ({ tag: 'EIndSum', usage, motive, caseLeft, caseRight });
export interface EIndFix { readonly tag: 'EIndFix'; readonly usage: Usage; readonly motive: Val; readonly cas: Val }
export const EIndFix = (usage: Usage, motive: Val, cas: Val): EIndFix => ({ tag: 'EIndFix', usage, motive, cas });
export interface EHelloWorld { readonly tag: 'EHelloWorld' }
export const EHelloWorld: EHelloWorld = { tag: 'EHelloWorld' };

export type Spine = List<Elim>;
export type EnvV = List<Val>;
export type Clos = (val: Val) => Val;

export type Val = VType | VNe | VAbs | VPi | VVoid | VUnitType | VUnit | VSigma | VPair | VSum | VInj | VFix | VCon | VWorld | VWorldToken;

export interface VType { readonly tag: 'VType' }
export const VType: VType = { tag: 'VType' };
export interface VNe { readonly tag: 'VNe'; readonly head: Head; readonly spine: Spine }
export const VNe = (head: Head, spine: Spine): VNe => ({ tag: 'VNe', head, spine });
export interface VAbs { readonly tag: 'VAbs'; readonly usage: Usage; readonly name: Name; readonly type: Val; readonly clos: Clos }
export const VAbs = (usage: Usage, name: Name, type: Val, clos: Clos): VAbs => ({ tag: 'VAbs', usage, name, type, clos });
export interface VPi { readonly tag: 'VPi'; readonly usage: Usage; readonly name: Name; readonly type: Val; readonly clos: Clos }
export const VPi = (usage: Usage, name: Name, type: Val, clos: Clos): VPi => ({ tag: 'VPi', usage, name, type, clos });
export interface VVoid { readonly tag: 'VVoid' }
export const VVoid: VVoid = { tag: 'VVoid' };
export interface VUnitType { readonly tag: 'VUnitType' }
export const VUnitType: VUnitType = { tag: 'VUnitType' };
export interface VUnit { readonly tag: 'VUnit' }
export const VUnit: VUnit = { tag: 'VUnit' };
export interface VSigma { readonly tag: 'VSigma'; readonly usage: Usage; readonly name: Name; readonly type: Val; readonly clos: Clos }
export const VSigma = (usage: Usage, name: Name, type: Val, clos: Clos): VSigma => ({ tag: 'VSigma', usage, name, type, clos });
export interface VPair { readonly tag: 'VPair'; readonly fst: Val; readonly snd: Val; readonly type: Val }
export const VPair = (fst: Val, snd: Val, type: Val): VPair => ({ tag: 'VPair', fst, snd, type });
export interface VSum { readonly tag: 'VSum'; readonly left: Val; readonly right: Val }
export const VSum = (left: Val, right: Val): VSum => ({ tag: 'VSum', left, right });
export interface VInj { readonly tag: 'VInj'; readonly which: 'Left' | 'Right'; readonly left: Val; readonly right: Val; readonly val: Val }
export const VInj = (which: 'Left' | 'Right', left: Val, right: Val, val: Val): VInj => ({ tag: 'VInj', which, left, right, val });
export interface VFix { readonly tag: 'VFix'; readonly sig: Val }
export const VFix = (sig: Val): VFix => ({ tag: 'VFix', sig });
export interface VCon { readonly tag: 'VCon'; readonly sig: Val; readonly val: Val }
export const VCon = (sig: Val, val: Val): VCon => ({ tag: 'VCon', sig, val });
export interface VWorld { readonly tag: 'VWorld' }
export const VWorld: VWorld = { tag: 'VWorld' }
export interface VWorldToken { readonly tag: 'VWorldToken' }
export const VWorldToken: VWorldToken = { tag: 'VWorldToken' };

export type ValWithClosure = Val & { tag: 'VAbs' | 'VPi' | 'VSigma' };

export const VVar = (level: Lvl, spine: Spine = Nil): Val => VNe(HVar(level), spine);

export const vinst = (val: ValWithClosure, arg: Val): Val => val.clos(arg);

export const vapp = (left: Val, right: Val): Val => {
  if (left.tag === 'VAbs') return vinst(left, right);
  if (left.tag === 'VNe') return VNe(left.head, Cons(EApp(right), left.spine));
  return impossible(`vapp: ${left.tag}`);
};
export const vindvoid = (motive: Val, scrut: Val): Val => {
  if (scrut.tag === 'VNe') return VNe(scrut.head, Cons(EIndVoid(motive), scrut.spine));
  return impossible(`vindvoid: ${scrut.tag}`);
};
export const vindunit = (motive: Val, scrut: Val, cas: Val): Val => {
  if (scrut.tag === 'VUnit') return cas;
  if (scrut.tag === 'VNe') return VNe(scrut.head, Cons(EIndUnit(motive, cas), scrut.spine));
  return impossible(`vindunit: ${scrut.tag}`);
};
export const vindsigma = (usage: Usage, motive: Val, scrut: Val, cas: Val): Val => {
  if (scrut.tag === 'VPair') return vapp(vapp(cas, scrut.fst), scrut.snd);
  if (scrut.tag === 'VNe') return VNe(scrut.head, Cons(EIndSigma(usage, motive, cas), scrut.spine));
  return impossible(`vindsigma: ${scrut.tag}`);
};
export const vindsum = (usage: Usage, motive: Val, scrut: Val, caseLeft: Val, caseRight: Val): Val => {
  if (scrut.tag === 'VInj') return vapp(scrut.which === 'Left' ? caseLeft : caseRight, scrut.val);
  if (scrut.tag === 'VNe') return VNe(scrut.head, Cons(EIndSum(usage, motive, caseLeft, caseRight), scrut.spine));
  return impossible(`vindsum: ${scrut.tag}`);
};
export const vindfix = (usage: Usage, motive: Val, scrut: Val, cas: Val): Val => {
  if (scrut.tag === 'VCon') {
    // indFix q P (Con f x) c ~> c (\(q z : Fix f). indFix q P z c) x
    return vapp(vapp(cas, VAbs(usage, 'z', VFix(scrut.sig), z => vindfix(usage, motive, z, cas))), scrut.val);
  }
  if (scrut.tag === 'VNe') return VNe(scrut.head, Cons(EIndFix(usage, motive, cas), scrut.spine));
  return impossible(`vindfix: ${scrut.tag}`);
};
export const vhelloworld = (scrut: Val): Val => {
  if (scrut.tag === 'VWorldToken') {
    if (typeof window === 'undefined') {
      console.log('Hello, world!');
    } else {
      alert('Hello, world!');
    }
    return scrut;
  }
  if (scrut.tag === 'VNe') return VNe(scrut.head, Cons(EHelloWorld, scrut.spine));
  return impossible(`vhelloworld: ${scrut.tag}`);
};

export const evaluate = (t: Term, vs: EnvV): Val => {
  if (t.tag === 'Type') return VType;
  if (t.tag === 'Void') return VVoid;
  if (t.tag === 'UnitType') return VUnitType;
  if (t.tag === 'Unit') return VUnit;
  if (t.tag === 'Abs')
    return VAbs(t.usage, t.name, evaluate(t.type, vs), v => evaluate(t.body, Cons(v, vs)));
  if (t.tag === 'Pi')
    return VPi(t.usage, t.name, evaluate(t.type, vs), v => evaluate(t.body, Cons(v, vs)));
  if (t.tag === 'Sigma')
    return VSigma(t.usage, t.name, evaluate(t.type, vs), v => evaluate(t.body, Cons(v, vs)));
  if (t.tag === 'Var') 
    return index(vs, t.index) || impossible(`evaluate: var ${t.index} has no value`);
  if (t.tag === 'App')
    return vapp(evaluate(t.fn, vs), evaluate(t.arg, vs));
  if (t.tag === 'Let')
    return evaluate(t.body, Cons(evaluate(t.val, vs), vs));
  if (t.tag === 'Pair')
    return VPair(evaluate(t.fst, vs), evaluate(t.snd, vs), evaluate(t.type, vs));
  if (t.tag === 'Sum')
    return VSum(evaluate(t.left, vs), evaluate(t.right, vs));
  if (t.tag === 'Inj')
    return VInj(t.which, evaluate(t.left, vs), evaluate(t.right, vs), evaluate(t.val, vs));
  if (t.tag === 'IndVoid')
    return vindvoid(evaluate(t.motive, vs), evaluate(t.scrut, vs));
  if (t.tag === 'IndUnit')
    return vindunit(evaluate(t.motive, vs), evaluate(t.scrut, vs), evaluate(t.cas, vs));
  if (t.tag === 'IndSigma')
    return vindsigma(t.usage, evaluate(t.motive, vs), evaluate(t.scrut, vs), evaluate(t.cas, vs));
  if (t.tag === 'IndSum')
    return vindsum(t.usage, evaluate(t.motive, vs), evaluate(t.scrut, vs), evaluate(t.caseLeft, vs), evaluate(t.caseRight, vs));
  if (t.tag === 'World') return VWorld;
  if (t.tag === 'Fix') return VFix(evaluate(t.sig, vs));
  if (t.tag === 'Con') return VCon(evaluate(t.sig, vs), evaluate(t.val, vs));
  if (t.tag === 'WorldToken') return VWorldToken;
  if (t.tag === 'IndFix') return vindfix(t.usage, evaluate(t.motive, vs), evaluate(t.scrut, vs), evaluate(t.cas, vs));
  if (t.tag === 'UpdateWorld') {
    // updateWorld q A c ~> indSigma (\_. A) (c WorldToken) (\x y. x)
    const ty = evaluate(t.type, vs);
    return vindsigma(UsageRig.default, VAbs(UsageRig.default, '_', VSigma(t.usage, '_', ty, _ => VWorld), _ => ty), vapp(evaluate(t.cont, vs), VWorldToken), VAbs(t.usage, 'x', ty, x => VAbs(UsageRig.one, 'w', VWorld, _ => x)));
  }
  if (t.tag === 'HelloWorld') return vhelloworld(evaluate(t.arg, vs));
  return t;
};

const quoteHead = (h: Head, k: Ix): Term => {
  if (h.tag === 'HVar') return Var(k - (h.level + 1));
  return h.tag;
};
const quoteElim = (t: Term, e: Elim, k: Ix): Term => {
  if (e.tag === 'EApp') return App(t, quote(e.arg, k));
  if (e.tag === 'EIndVoid') return IndVoid(quote(e.motive, k), t);
  if (e.tag === 'EIndUnit') return IndUnit(quote(e.motive, k), t, quote(e.cas, k));
  if (e.tag === 'EIndSigma') return IndSigma(e.usage, quote(e.motive, k), t, quote(e.cas, k));
  if (e.tag === 'EIndSum') return IndSum(e.usage, quote(e.motive, k), t, quote(e.caseLeft, k), quote(e.caseRight, k));
  if (e.tag === 'EIndFix') return IndFix(e.usage, quote(e.motive, k), t, quote(e.cas, k));
  if (e.tag === 'EHelloWorld') return HelloWorld(t);
  return e;
};
export const quote = (v: Val, k: Ix): Term => {
  if (v.tag === 'VType') return Type;
  if (v.tag === 'VVoid') return Void;
  if (v.tag === 'VUnitType') return UnitType;
  if (v.tag === 'VUnit') return Unit;
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
  if (v.tag === 'VSigma')
    return Sigma(v.usage, v.name, quote(v.type, k), quote(vinst(v, VVar(k)), k + 1));
  if (v.tag === 'VPair')
    return Pair(quote(v.fst, k), quote(v.snd, k), quote(v.type, k));
  if (v.tag === 'VSum')
    return Sum(quote(v.left, k), quote(v.right, k));
  if (v.tag === 'VInj')
    return Inj(v.which, quote(v.left, k), quote(v.right, k), quote(v.val, k));
  if (v.tag === 'VCon')
    return Con(quote(v.sig, k), quote(v.val, k));
  if (v.tag === 'VFix')
    return Fix(quote(v.sig, k));
  if (v.tag === 'VWorld') return World;
  if (v.tag === 'VWorldToken') return WorldToken;
  return v;
};

export const normalize = (t: Term, vs: EnvV = Nil): Term => quote(evaluate(t, vs), 0);

export const show = (v: Val, k: Lvl): string => C.show(quote(v, k));
