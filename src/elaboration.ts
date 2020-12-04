import { log } from './config';
import { Abs, App, Let, Pi, Term, Type, Var } from './core';
import { Ix, Name } from './names';
import { Cons, indexOf, List, Nil } from './utils/list';
import { terr, tryT } from './utils/utils';
import { Lvl, EnvV, evaluate, quote, Val, vinst, VType, VVar } from './values';
import * as S from './surface';
import { show } from './surface';
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
  ns: List<Name>;
  ts: EnvT;
  vs: EnvV;
}
export const Local = (level: Ix, ns: List<Name>, ts: EnvT, vs: EnvV): Local => ({ level, ns, ts, vs });
export const localEmpty: Local = Local(0, Nil, Nil, Nil);
export const localExtend = (local: Local, name: Name, ty: Val, val: Val = VVar(local.level)): Local =>
  Local(local.level + 1, Cons(name, local.ns), Cons(EntryT(ty), local.ts), Cons(val, local.vs));

const showVal = (local: Local, val: Val): string => S.showVal(val, local.level, local.ns);

const check = (local: Local, tm: S.Term, ty: Val): Term => {
  log(() => `check ${show(tm)} : ${showVal(local, ty)}`);
  if (tm.tag === 'Type' && ty.tag === 'VType') return Type;
  if (tm.tag === 'Abs' && !tm.type && ty.tag === 'VPi') {
    const v = VVar(local.level);
    const x = tm.name;
    const body = check(localExtend(local, x, ty.type, v), tm.body, vinst(ty, v));
    return Abs(x, quote(ty.type, local.level), body);
  }
  if (tm.tag === 'Let') {
    let vtype: Term;
    let vty: Val;
    let val: Term;
    if (tm.type) {
      vtype = check(local, tm.type, VType);
      vty = evaluate(vtype, local.vs);
      val = check(local, tm.val, ty);
    } else {
      [val, vty] = synth(local, tm.val);
      vtype = quote(vty, local.level);
    }
    const v = evaluate(val, local.vs);
    const body = check(localExtend(local, tm.name, vty, v), tm.body, ty);
    return Let(tm.name, vtype, val, body);
  }
  const [term, ty2] = synth(local, tm);
  return tryT(() => {
    log(() => `unify ${showVal(local, ty2)} ~ ${showVal(local, ty)}`);
    conv(local.level, ty2, ty);
    return term;
  }, e => terr(`check failed (${show(tm)}): ${showVal(local, ty2)} ~ ${showVal(local, ty)}: ${e}`));
};

const synth = (local: Local, tm: S.Term): [Term, Val] => {
  log(() => `synth ${show(tm)}`);
  if (tm.tag === 'Type') return [Type, VType];
  if (tm.tag === 'Var') {
    const i = indexOf(local.ns, tm.name);
    if (i < 0) return terr(`undefined var ${tm.name}`);
    else {
      const [entry, j] = indexT(local.ts, i) || terr(`var out of scope ${show(tm)}`);
      return [Var(j), entry.type];
    }
  }
  if (tm.tag === 'App') {
    const [fntm, fnty] = synth(local, tm.fn);
    const [argtm, rty] = synthapp(local, fnty, tm.arg);
    return [App(fntm, argtm), rty];
  }
  if (tm.tag === 'Abs') {
    if (tm.type) {
      const type = check(local, tm.type, VType);
      const ty = evaluate(type, local.vs);
      const [body, rty] = synth(localExtend(local, tm.name, ty), tm.body);
      const pi = evaluate(Pi(tm.name, type, quote(rty, local.level + 1)), local.vs);
      return [Abs(tm.name, type, body), pi];
    } else terr(`cannot synth unannotated lambda: ${show(tm)}`);
  }
  if (tm.tag === 'Pi') {
    const type = check(local, tm.type, VType);
    const ty = evaluate(type, local.vs);
    const body = check(localExtend(local, tm.name, ty), tm.body, VType);
    return [Pi(tm.name, type, body), VType];
  }
  if (tm.tag === 'Let') {
    let type: Term;
    let ty: Val;
    let val: Term;
    if (tm.type) {
      type = check(local, tm.type, VType);
      ty = evaluate(type, local.vs);
      val = check(local, tm.val, ty);
    } else {
      [val, ty] = synth(local, tm.val);
      type = quote(ty, local.level);
    }
    const v = evaluate(val, local.vs);
    const [body, rty] = synth(localExtend(local, tm.name, ty, v), tm.body);
    return [Let(tm.name, type, val, body), rty];
  }
  return terr(`unable to synth ${show(tm)}`);
};

const synthapp = (local: Local, ty: Val, arg: S.Term): [Term, Val] => {
  log(() => `synthapp ${showVal(local, ty)} @ ${show(arg)}`);
  if (ty.tag === 'VPi') {
    const cty = ty.type;
    const term = check(local, arg, cty);
    const v = evaluate(term, local.vs);
    return [term, vinst(ty, v)];
  }
  return terr(`not a correct pi type in synthapp: ${showVal(local, ty)} @ ${show(arg)}`);
};

export const elaborate = (t: S.Term, local: Local = localEmpty): [Term, Term] => {
  const [tm, vty] = synth(local, t);
  const ty = quote(vty, 0);
  return [tm, ty];
};
