import { log } from './config';
import { Pi, Term, show } from './core';
import { Ix } from './names';
import { Cons, List, Nil, updateAt, uncons, zipWith, range, filter, index, toArray } from './utils/list';
import { terr, tryT } from './utils/utils';
import { Lvl, EnvV, evaluate, quote, Val, vinst, VType, VUnitType, VVar, VSum, VPi, VVoid, VUnit, VInj, VPair, vapp, VWorld, VFix, VSigma, VCon } from './values';
import * as V from './values';
import { conv } from './conversion';
import { addUses, lubUses, multiplyUses, noUses, Usage, UsageRig, Uses } from './usage';

export type EntryT = { type: Val, usage: Usage };
export const EntryT = (type: Val, usage: Usage): EntryT => ({ type, usage });

export type EnvT = List<EntryT>;

const indexT = (ts: EnvT, ix: Ix): [EntryT, Ix] | null => {
  let l = ts;
  let i = 0;
  while (l.tag === 'Cons') {
    if (ix === 0) return [l.head, i];
    i++;
    ix--;
    l = l.tail;
  }
  return null;
};

export interface Local {
  level: Lvl;
  ts: EnvT;
  vs: EnvV;
}
export const Local = (level: Ix, ts: EnvT, vs: EnvV): Local => ({ level, ts, vs });
export const localEmpty: Local = Local(0, Nil, Nil);
export const localExtend = (local: Local, ty: Val, usage: Usage, val: Val = VVar(local.level)): Local =>
  Local(local.level + 1, Cons(EntryT(ty, usage), local.ts), Cons(val, local.vs));
export const unsafeLocalPop = (local: Local): Local =>
  Local(local.level - 1, (local.ts as any).tail, (local.vs as any).tail);

const showVal = (local: Local, val: Val): string => V.show(val, local.level);

const check = (local: Local, tm: Term, ty: Val): Uses => {
  log(() => `check ${show(tm)} : ${showVal(local, ty)}`);
  const [ty2, u] = synth(local, tm);
  return tryT(() => {
    log(() => `unify ${showVal(local, ty2)} ~ ${showVal(local, ty)}`);
    conv(local.level, ty2, ty);
    return u;
  }, e => terr(`check failed (${show(tm)}): ${showVal(local, ty2)} ~ ${showVal(local, ty)}: ${e}`));
};

const synth = (local: Local, tm: Term): [Val, Uses] => {
  log(() => `synth ${show(tm)}`);
  if (tm.tag === 'Type') return [VType, noUses(local.level)];
  if (tm.tag === 'Void') return [VType, noUses(local.level)];
  if (tm.tag === 'UnitType') return [VType, noUses(local.level)];
  if (tm.tag === 'Unit') return [VUnitType, noUses(local.level)];
  if (tm.tag === 'Var') {
    const [entry, j] = indexT(local.ts, tm.index) || terr(`var out of scope ${show(tm)}`);
    const uses = updateAt(noUses(local.level), j, _ => UsageRig.one);
    return [entry.type, uses];
  }
  if (tm.tag === 'App') {
    const [fnty, fnu] = synth(local, tm.fn);
    const [rty, argu] = synthapp(local, fnty, tm.arg);
    return [rty, addUses(fnu, argu)];
  }
  if (tm.tag === 'Abs') {
    check(local, tm.type, VType);
    const ty = evaluate(tm.type, local.vs);
    const [rty, u] = synth(localExtend(local, ty, tm.usage), tm.body);
    const pi = evaluate(Pi(tm.usage, tm.name, tm.type, quote(rty, local.level + 1)), local.vs);
    const [ux, urest] = uncons(u);
    if (!UsageRig.sub(ux, tm.usage))
      return terr(`usage error in ${show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
    return [pi, urest];
  }
  if (tm.tag === 'Pi') {
    const u1 = check(local, tm.type, VType);
    const ty = evaluate(tm.type, local.vs);
    const u2 = check(localExtend(local, ty, UsageRig.default), tm.body, VType);
    const [, urest] = uncons(u2);
    return [VType, addUses(u1, urest)];
  }
  if (tm.tag === 'Sigma') {
    const u1 = check(local, tm.type, VType);
    const ty = evaluate(tm.type, local.vs);
    const u2 = check(localExtend(local, ty, UsageRig.default), tm.body, VType);
    const [, urest] = uncons(u2);
    return [VType, addUses(u1, urest)];
  }
  if (tm.tag === 'Let') {
    check(local, tm.type, VType);
    const ty = evaluate(tm.type, local.vs);
    const uv = check(local, tm.val, ty);
    const v = evaluate(tm.val, local.vs);
    const [rty, ub] = synth(localExtend(local, ty, tm.usage, v), tm.body);
    const [ux, urest] = uncons(ub);
    if (!UsageRig.sub(ux, tm.usage))
      return terr(`usage error in ${show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
    return [rty, addUses(multiplyUses(ux, uv), urest)];
  }
  if (tm.tag === 'Pair') {
    check(local, tm.type, VType);
    const vsigma = evaluate(tm.type, local.vs);
    if (vsigma.tag !== 'VSigma') return terr(`pair without sigma type: ${show(tm)}`);
    const u1 = check(local, tm.fst, vsigma.type);
    const u2 = check(local, tm.snd, vinst(vsigma, evaluate(tm.fst, local.vs)));
    return [vsigma, addUses(multiplyUses(vsigma.usage, u1), u2)];
  }
  if (tm.tag === 'Sum') {
    const u1 = check(local, tm.left, VType);
    const u2 = check(local, tm.right, VType);
    return [VType, addUses(u1, u2)];
  }
  if (tm.tag === 'Inj') {
    check(local, tm.left, VType);
    check(local, tm.right, VType);
    const vleft = evaluate(tm.left, local.vs);
    const vright = evaluate(tm.right, local.vs);
    const u = check(local, tm.val, tm.which === 'Left' ? vleft : vright);
    return [VSum(vleft, vright), u];
  }
  if (tm.tag === 'IndVoid') {
    check(local, tm.motive, VPi(UsageRig.default, '_', VVoid, _ => VType));
    const u = check(local, tm.scrut, VVoid);
    return [vapp(evaluate(tm.motive, local.vs), evaluate(tm.scrut, local.vs)), u];
  }
  if (tm.tag === 'IndUnit') {
    check(local, tm.motive, VPi(UsageRig.default, '_', VUnitType, _ => VType));
    const u1 = check(local, tm.scrut, VUnitType);
    const motive = evaluate(tm.motive, local.vs);
    const u2 = check(local, tm.cas, vapp(motive, VUnit));
    return [vapp(motive, evaluate(tm.scrut, local.vs)), addUses(u1, u2)];
  }
  if (tm.tag === 'IndSigma') {
    /*
      1 <= q
      G |- p : (u x : A) ** B
      G |- P : ((u x : A) ** B x) -> Type
      G |- k : (q * u x : A) -> (q y : B x) -> P (x, y)
      ---------------------------------------------
      q * G |- indSigma q P p k : P p
    */
    if (!UsageRig.sub(UsageRig.one, tm.usage))
      return terr(`usage must be 1 <= q in sigma induction ${show(tm)}: ${tm.usage}`)
    const [sigma, u1] = synth(local, tm.scrut);
    if (sigma.tag !== 'VSigma') return terr(`not a sigma type in ${show(tm)}: ${showVal(local, sigma)}`);
    check(local, tm.motive, VPi(UsageRig.default, '_', sigma, _ => VType));
    const motive = evaluate(tm.motive, local.vs);
    const u2 = check(local, tm.cas, VPi(UsageRig.multiply(tm.usage, sigma.usage), 'x', sigma.type, x => VPi(tm.usage, 'y', vinst(sigma, x), y => vapp(motive, VPair(x, y, sigma)))));
    return [vapp(motive, evaluate(tm.scrut, local.vs)), multiplyUses(tm.usage, addUses(u1, u2))];
  }
  if (tm.tag === 'IndSum') {
    if (!UsageRig.sub(UsageRig.one, tm.usage))
      return terr(`usage must be 1 <= q in sum induction ${show(tm)}: ${tm.usage}`)
    const [sumty, u1] = synth(local, tm.scrut);
    if (sumty.tag !== 'VSum') return terr(`not a sum type in ${show(tm)}: ${showVal(local, sumty)}`);
    check(local, tm.motive, VPi(UsageRig.default, '_', sumty, _ => VType));
    const motive = evaluate(tm.motive, local.vs);
    const uleft = check(local, tm.caseLeft, VPi(tm.usage, 'x', sumty.left, x => vapp(motive, VInj('Left', sumty.left, sumty.right, x))));
    const uright = check(local, tm.caseRight, VPi(tm.usage, 'x', sumty.right, x => vapp(motive, VInj('Right', sumty.left, sumty.right, x))));
    const u2 = lubUses(uleft, uright);
    if (!u2) {
      const wrongVars = toArray(filter(zipWith((a, i) => [a, i] as [Usage | null, number], zipWith(UsageRig.lub, uleft, uright), range(local.level)), ([x]) => x === null),
        ([, i]) => `left: ${index(uleft, i)}, right: ${index(uright, i)}, variable: ${i}`);
      return terr(`usage mismatch in sum branches ${show(tm)}: ${wrongVars.join('; ')}`);
    }
    return [vapp(motive, evaluate(tm.scrut, local.vs)), addUses(multiplyUses(tm.usage, u1), u2)];
  }
  if (tm.tag === 'World') return [VType, noUses(local.level)];
  if (tm.tag === 'WorldToken') return [VWorld, noUses(local.level)];
  if (tm.tag === 'Fix') {
    const u = check(local, tm.sig, VPi(UsageRig.default, '_', VType, _ => VType));
    return [VType, u];
  }
  if (tm.tag === 'Con') {
    check(local, tm.sig, VPi(UsageRig.default, '_', VType, _ => VType));
    const vsig = evaluate(tm.sig, local.vs);
    const u = check(local, tm.val, vapp(vsig, VFix(vsig)));
    return [VFix(vsig), u];
  }
  if (tm.tag === 'IndFix') {
    if (!UsageRig.sub(UsageRig.one, tm.usage))
      return terr(`usage must be 1 <= q in fix induction ${show(tm)}: ${tm.usage}`)
    const [fixty, u1] = synth(local, tm.scrut);
    if (fixty.tag !== 'VFix') return terr(`not a fix type in ${show(tm)}: ${showVal(local, fixty)}`);
    check(local, tm.motive, VPi(UsageRig.default, '_', fixty, _ => VType));
    const vmotive = evaluate(tm.motive, local.vs);
    // ((q z : Fix f) -> P z) -> (q y : f (Fix f)) -> P (Con f y)
    const u2 = check(local, tm.cas, VPi(UsageRig.default, '_', VPi(tm.usage, 'z', fixty, z => vapp(vmotive, z)), _ => VPi(tm.usage, 'y', vapp(fixty.sig, fixty), y => vapp(vmotive, VCon(fixty.sig, y)))));
    return [vapp(vmotive, evaluate(tm.scrut, local.vs)), addUses(multiplyUses(tm.usage, u1), u2)];
  }
  if (tm.tag === 'UpdateWorld') {
    check(local, tm.type, VType);
    const ty = evaluate(tm.type, local.vs);
    const u = check(local, tm.cont, VPi(UsageRig.one, '_', VWorld, _ => VSigma(tm.usage, '_', ty, _ => VWorld)));
    return [ty, multiplyUses(tm.usage, u)];
  }
  if (tm.tag === 'HelloWorld') {
    const u = check(local, tm.arg, VWorld);
    return [VWorld, u];
  }
  return tm;
};

const synthapp = (local: Local, ty: Val, arg: Term): [Val, Uses] => {
  log(() => `synthapp ${showVal(local, ty)} @ ${show(arg)}`);
  if (ty.tag === 'VPi') {
    const cty = ty.type;
    const uses = check(local, arg, cty);
    const v = evaluate(arg, local.vs);
    return [vinst(ty, v), multiplyUses(ty.usage, uses)];
  }
  return terr(`not a correct pi type in synthapp: ${showVal(local, ty)} @ ${show(arg)}`);
};

export const verify = (t: Term, local: Local = localEmpty): Term => {
  const [vty] = synth(local, t);
  const ty = quote(vty, 0);
  return ty;
};
