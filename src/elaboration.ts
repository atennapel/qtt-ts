import { log } from './config';
import { Abs, App, IndSigma, IndSum, IndUnit, IndVoid, Inj, Let, Pair, Pi, Sigma, Sum, Term, Type, Unit, UnitType, Var, Void } from './core';
import { Ix, Name } from './names';
import { Cons, filter, index, indexOf, List, Nil, range, toArray, uncons, updateAt, zipWith } from './utils/list';
import { terr, tryT } from './utils/utils';
import { Lvl, EnvV, evaluate, quote, Val, vinst, VType, VVar, VUnitType, VSigma, VSum, VVoid, VPi, vapp, VUnit, VInj, VPair } from './values';
import * as S from './surface';
import { show } from './surface';
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
  ns: List<Name>;
  ts: EnvT;
  vs: EnvV;
}
export const Local = (level: Ix, ns: List<Name>, ts: EnvT, vs: EnvV): Local => ({ level, ns, ts, vs });
export const localEmpty: Local = Local(0, Nil, Nil, Nil);
export const localExtend = (local: Local, name: Name, ty: Val, usage: Usage, val: Val = VVar(local.level)): Local =>
  Local(local.level + 1, Cons(name, local.ns), Cons(EntryT(ty, usage), local.ts), Cons(val, local.vs));
export const unsafeLocalPop = (local: Local): Local =>
  Local(local.level - 1, (local.ns as any).tail, (local.ts as any).tail, (local.vs as any).tail);

const showVal = (local: Local, val: Val): string => S.showVal(val, local.level, local.ns);

const check = (local: Local, tm: S.Term, ty: Val): [Term, Uses] => {
  log(() => `check ${show(tm)} : ${showVal(local, ty)}`);
  if (tm.tag === 'Type' && ty.tag === 'VType') return [Type, noUses(local.level)];
  if (tm.tag === 'Void' && ty.tag === 'VType') return [Void, noUses(local.level)];
  if (tm.tag === 'UnitType' && ty.tag === 'VType') return [UnitType, noUses(local.level)];
  if (tm.tag === 'Unit' && ty.tag === 'VUnitType') return [Unit, noUses(local.level)];
  if (tm.tag === 'Abs' && !tm.type && ty.tag === 'VPi') {
    const v = VVar(local.level);
    const x = tm.name;
    const [body, u] = check(localExtend(local, x, ty.type, ty.usage, v), tm.body, vinst(ty, v));
    const [ux, urest] = uncons(u);
    if (!UsageRig.sub(ux, ty.usage))
      return terr(`usage error in ${show(tm)}: expected ${ty.usage} for ${x} but actual ${ux}`);
    return [Abs(ty.usage, x, quote(ty.type, local.level), body), urest];
  }
  if (tm.tag === 'Pair' && ty.tag === 'VSigma') {
    const [fst, u1] = check(local, tm.fst, ty.type);
    const [snd, u2] = check(local, tm.snd, vinst(ty, evaluate(fst, local.vs)));
    return [Pair(fst, snd, quote(ty, local.level)), addUses(multiplyUses(ty.usage, u1), u2)];
  }
  if (tm.tag === 'Inj' && ty.tag === 'VSum') {
    const [val, u] = check(local, tm.val, tm.which === 'Left' ? ty.left : ty.right);
    return [Inj(tm.which, quote(ty.left, local.level), quote(ty.right, local.level), val), u];
  }
  if (tm.tag === 'Let') {
    let vtype: Term;
    let vty: Val;
    let val: Term;
    let uv: Uses;
    if (tm.type) {
      [vtype] = check(local, tm.type, VType);
      vty = evaluate(vtype, local.vs);
      [val, uv] = check(local, tm.val, ty);
    } else {
      [val, vty, uv] = synth(local, tm.val);
      vtype = quote(vty, local.level);
    }
    const v = evaluate(val, local.vs);
    const [body, ub] = check(localExtend(local, tm.name, vty, tm.usage, v), tm.body, ty);
    const [ux, urest] = uncons(ub);
    if (!UsageRig.sub(ux, tm.usage))
      return terr(`usage error in ${show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
    return [Let(tm.usage, tm.name, vtype, val, body), addUses(multiplyUses(ux, uv), urest)];
  }
  const [term, ty2, uses] = synth(local, tm);
  return tryT(() => {
    log(() => `unify ${showVal(local, ty2)} ~ ${showVal(local, ty)}`);
    conv(local.level, ty2, ty);
    return [term, uses];
  }, e => terr(`check failed (${show(tm)}): ${showVal(local, ty2)} ~ ${showVal(local, ty)}: ${e}`));
};

const synth = (local: Local, tm: S.Term): [Term, Val, Uses] => {
  log(() => `synth ${show(tm)}`);
  if (tm.tag === 'Type') return [Type, VType, noUses(local.level)];
  if (tm.tag === 'Void') return [Void, VType, noUses(local.level)];
  if (tm.tag === 'UnitType') return [UnitType, VType, noUses(local.level)];
  if (tm.tag === 'Unit') return [Unit, VUnitType, noUses(local.level)];
  if (tm.tag === 'Var') {
    const i = indexOf(local.ns, tm.name);
    if (i < 0) return terr(`undefined var ${tm.name}`);
    else {
      const [entry, j] = indexT(local.ts, i) || terr(`var out of scope ${show(tm)}`);
      const uses = updateAt(noUses(local.level), j, _ => UsageRig.one);
      return [Var(j), entry.type, uses];
    }
  }
  if (tm.tag === 'App') {
    const [fntm, fnty, fnu] = synth(local, tm.fn);
    const [argtm, rty, fnarg] = synthapp(local, fnty, tm.arg);
    return [App(fntm, argtm), rty, addUses(fnu, fnarg)];
  }
  if (tm.tag === 'Abs') {
    if (tm.type) {
      const [type] = check(local, tm.type, VType);
      const ty = evaluate(type, local.vs);
      const [body, rty, u] = synth(localExtend(local, tm.name, ty, tm.usage), tm.body);
      const pi = evaluate(Pi(tm.usage, tm.name, type, quote(rty, local.level + 1)), local.vs);
      const [ux, urest] = uncons(u);
      if (!UsageRig.sub(ux, tm.usage))
        return terr(`usage error in ${show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
      return [Abs(tm.usage, tm.name, type, body), pi, urest];
    } else terr(`cannot synth unannotated lambda: ${show(tm)}`);
  }
  if (tm.tag === 'Pi') {
    const [type, u1] = check(local, tm.type, VType);
    const ty = evaluate(type, local.vs);
    const [body, u2] = check(localExtend(local, tm.name, ty, '0'), tm.body, VType);
    const [, urest] = uncons(u2);
    return [Pi(tm.usage, tm.name, type, body), VType, addUses(u1, urest)];
  }
  if (tm.tag === 'Sigma') {
    const [type, u1] = check(local, tm.type, VType);
    const ty = evaluate(type, local.vs);
    const [body, u2] = check(localExtend(local, tm.name, ty, '0'), tm.body, VType);
    const [, urest] = uncons(u2);
    return [Sigma(tm.usage, tm.name, type, body), VType, addUses(u1, urest)];
  }
  if (tm.tag === 'Pair') {
    const [fst, ty1, u1] = synth(local, tm.fst);
    const [snd, ty2, u2] = synth(local, tm.snd);
    const ty = VSigma(UsageRig.default, '_', ty1, _ => ty2);
    return [Pair(fst, snd, quote(ty, local.level)), ty, addUses(multiplyUses(ty.usage, u1), u2)];
  }
  if (tm.tag === 'Let') {
    let type: Term;
    let ty: Val;
    let val: Term;
    let uv: Uses;
    if (tm.type) {
      [type] = check(local, tm.type, VType);
      ty = evaluate(type, local.vs);
      [val, uv] = check(local, tm.val, ty);
    } else {
      [val, ty, uv] = synth(local, tm.val);
      type = quote(ty, local.level);
    }
    const v = evaluate(val, local.vs);
    const [body, rty, ub] = synth(localExtend(local, tm.name, ty, tm.usage, v), tm.body);
    const [ux, urest] = uncons(ub);
    if (!UsageRig.sub(ux, tm.usage))
      return terr(`usage error in ${show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
    return [Let(tm.usage, tm.name, type, val, body), rty, addUses(multiplyUses(ux, uv), urest)];
  }
  if (tm.tag === 'Sum') {
    const [left, u1] = check(local, tm.left, VType);
    const [right, u2] = check(local, tm.right, VType);
    return [Sum(left, right), VType, addUses(u1, u2)];
  }
  if (tm.tag === 'Inj') {
    const [val, ty, u] = synth(local, tm.val);
    return tm.which === 'Left' ?
      [Inj('Left', quote(ty, local.level), Void, val), VSum(ty, VVoid), u] :
      [Inj('Right', Void, quote(ty, local.level), val), VSum(VVoid, ty), u];
  }
  if (tm.tag === 'IndVoid') {
    const [motive] = check(local, tm.motive, VPi(UsageRig.default, '_', VVoid, _ => VType));
    const [scrut, u] = check(local, tm.scrut, VVoid);
    return [IndVoid(motive, scrut), vapp(evaluate(motive, local.vs), evaluate(scrut, local.vs)), u];
  }
  if (tm.tag === 'IndUnit') {
    const [motive] = check(local, tm.motive, VPi(UsageRig.default, '_', VUnitType, _ => VType));
    const [scrut, u1] = check(local, tm.scrut, VUnitType);
    const vmotive = evaluate(motive, local.vs);
    const [cas, u2] = check(local, tm.cas, vapp(vmotive, VUnit));
    return [IndUnit(motive, scrut, cas), vapp(vmotive, evaluate(scrut, local.vs)), addUses(u1, u2)];
  }
  if (tm.tag === 'IndSigma') {
    const [scrut, sigma, u1] = synth(local, tm.scrut);
    if (sigma.tag !== 'VSigma') return terr(`not a sigma type in ${show(tm)}: ${showVal(local, sigma)}`);
    const [motive] = check(local, tm.motive, VPi(UsageRig.default, '_', sigma, _ => VType));
    const vmotive = evaluate(motive, local.vs);
    const [cas, u2] = check(local, tm.cas, VPi(sigma.usage, 'x', sigma.type, x => VPi(UsageRig.one, 'y', vinst(sigma, x), y => vapp(vmotive, VPair(x, y, sigma)))));
    return [IndSigma(motive, scrut, cas), vapp(vmotive, evaluate(scrut, local.vs)), addUses(u1, u2)];
  }
  if (tm.tag === 'IndSum') {
    if (!UsageRig.sub(UsageRig.one, tm.usage))
      return terr(`usage must be 1 <= q in sum induction ${show(tm)}: ${tm.usage}`)
    const [scrut, sumty, u1] = synth(local, tm.scrut);
    if (sumty.tag !== 'VSum') return terr(`not a sumtype in ${show(tm)}: ${showVal(local, sumty)}`);
    const [motive] = check(local, tm.motive, VPi(UsageRig.default, '_', sumty, _ => VType));
    const vmotive = evaluate(motive, local.vs);
    const [caseLeft, uleft] = check(local, tm.caseLeft, VPi(tm.usage, 'x', sumty.left, x => vapp(vmotive, VInj('Left', sumty.left, sumty.right, x))));
    const [caseRight, uright] = check(local, tm.caseRight, VPi(tm.usage, 'x', sumty.right, x => vapp(vmotive, VInj('Right', sumty.left, sumty.right, x))));
    const u2 = lubUses(uleft, uright);
    if (!u2) {
      const wrongVars = toArray(filter(zipWith((a, i) => [a, i] as [Usage | null, number], zipWith(UsageRig.lub, uleft, uright), range(local.level)), ([x]) => x === null),
        ([, i]) => `left: ${index(uleft, i)}, right: ${index(uright, i)}, variable: ${index(local.ns, i)} (${i})`);
      return terr(`usage mismatch in sum branches ${show(tm)}: ${wrongVars.join('; ')}`);
    }
    return [IndSum(tm.usage, motive, scrut, caseLeft, caseRight), vapp(vmotive, evaluate(scrut, local.vs)), addUses(multiplyUses(tm.usage, u1), u2)];
  }
  return terr(`unable to synth ${show(tm)}`);
};

const synthapp = (local: Local, ty: Val, arg: S.Term): [Term, Val, Uses] => {
  log(() => `synthapp ${showVal(local, ty)} @ ${show(arg)}`);
  if (ty.tag === 'VPi') {
    const cty = ty.type;
    const [term, uses] = check(local, arg, cty);
    const v = evaluate(term, local.vs);
    return [term, vinst(ty, v), multiplyUses(ty.usage, uses)];
  }
  return terr(`not a correct pi type in synthapp: ${showVal(local, ty)} @ ${show(arg)}`);
};

export const elaborate = (t: S.Term, local: Local = localEmpty): [Term, Term] => {
  const [tm, vty] = synth(local, t);
  const ty = quote(vty, 0);
  return [tm, ty];
};
