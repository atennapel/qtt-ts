import { log } from './config';
import { Pi, Term, show } from './core';
import { Ix } from './names';
import { Cons, List, Nil } from './utils/list';
import { terr, tryT } from './utils/utils';
import { Lvl, EnvV, evaluate, quote, Val, vinst, VType, VVar } from './values';
import * as V from './values';
import { conv } from './conversion';

export type EntryT = { type: Val };
export const EntryT = (type: Val): EntryT => ({ type });

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
export const localExtend = (local: Local, ty: Val, val: Val = VVar(local.level)): Local =>
  Local(local.level + 1, Cons(EntryT(ty), local.ts), Cons(val, local.vs));

const showVal = (local: Local, val: Val): string => V.show(val, local.level);

const check = (local: Local, tm: Term, ty: Val): void => {
  log(() => `check ${show(tm)} : ${showVal(local, ty)}`);
  const ty2 = synth(local, tm);
  return tryT(() => {
    log(() => `unify ${showVal(local, ty2)} ~ ${showVal(local, ty)}`);
    conv(local.level, ty2, ty);
    return;
  }, e => terr(`check failed (${show(tm)}): ${showVal(local, ty2)} ~ ${showVal(local, ty)}: ${e}`));
};

const synth = (local: Local, tm: Term): Val => {
  log(() => `synth ${show(tm)}`);
  if (tm.tag === 'Type') return VType;
  if (tm.tag === 'Var') {
    const [entry] = indexT(local.ts, tm.index) || terr(`var out of scope ${show(tm)}`);
    return entry.type;
  }
  if (tm.tag === 'App') {
    const fnty = synth(local, tm.fn);
    const rty = synthapp(local, fnty, tm.arg);
    return rty;
  }
  if (tm.tag === 'Abs') {
    check(local, tm.type, VType);
    const ty = evaluate(tm.type, local.vs);
    const rty = synth(localExtend(local, ty), tm.body);
    const pi = evaluate(Pi(tm.name, tm.type, quote(rty, local.level + 1)), local.vs);
    return pi;
  }
  if (tm.tag === 'Pi') {
    check(local, tm.type, VType);
    const ty = evaluate(tm.type, local.vs);
    check(localExtend(local, ty), tm.body, VType);
    return VType;
  }
  if (tm.tag === 'Let') {
    check(local, tm.type, VType);
    const ty = evaluate(tm.type, local.vs);
    check(local, tm.val, ty);
    const v = evaluate(tm.val, local.vs);
    const rty = synth(localExtend(local, ty, v), tm.body);
    return rty;
  }
  return terr(`unable to synth ${show(tm)}`);
};

const synthapp = (local: Local, ty: Val, arg: Term): Val => {
  log(() => `synthapp ${showVal(local, ty)} @ ${show(arg)}`);
  if (ty.tag === 'VPi') {
    const cty = ty.type;
    check(local, arg, cty);
    const v = evaluate(arg, local.vs);
    return vinst(ty, v);
  }
  return terr(`not a correct pi type in synthapp: ${showVal(local, ty)} @ ${show(arg)}`);
};

export const verify = (t: Term, local: Local = localEmpty): Term => {
  const vty = synth(local, t);
  const ty = quote(vty, 0);
  return ty;
};
