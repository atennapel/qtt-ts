import { log } from './config';
import { Pi, Term, show } from './core';
import { Ix } from './names';
import { Cons, List, Nil, updateAt, uncons } from './utils/list';
import { terr, tryT } from './utils/utils';
import { Lvl, EnvV, evaluate, quote, Val, vinst, VType, VVar } from './values';
import * as V from './values';
import { conv } from './conversion';
import { addUses, multiplyUses, noUses, Usage, UsageRig, Uses } from './usage';

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
  return terr(`unable to synth ${show(tm)}`);
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
