import { log } from './config';
import { Ix } from './names';
import { UsageRig } from './usage';
import { zipWithR_ } from './utils/list';
import { terr } from './utils/utils';
import { Elim, Head, show, VAbs, Val, vapp, vindsigma, vinst, VPair, VSigma, VVar } from './values';

export const eqHead = (a: Head, b: Head): boolean => {
  if (a === b) return true;
  if (a.tag === 'HVar') return b.tag === 'HVar' && a.level === b.level;
  return a.tag;
};
const convElim = (k: Ix, a: Elim, b: Elim, x: Val, y: Val): void => {
  if (a === b) return;
  if (a.tag === 'EApp' && b.tag === 'EApp') return conv(k, a.arg, b.arg);
  if (a.tag === 'EIndVoid' && b.tag === 'EIndVoid') return conv(k, a.motive, b.motive);
  if (a.tag === 'EIndUnit' && b.tag === 'EIndUnit') {
    conv(k, a.motive, b.motive);
    return conv(k, a.cas, b.cas);
  }
  if (a.tag === 'EIndSigma' && b.tag === 'EIndSigma' && a.usage === b.usage) {
    conv(k, a.motive, b.motive);
    return conv(k, a.cas, b.cas);
  }
  if (a.tag === 'EIndSum' && b.tag === 'EIndSum' && a.usage === b.usage) {
    conv(k, a.motive, b.motive);
    conv(k, a.caseLeft, b.caseLeft);
    return conv(k, a.caseRight, b.caseRight);
  }
  if (a.tag === 'EIndFix' && b.tag === 'EIndFix' && a.usage === b.usage) {
    conv(k, a.motive, b.motive);
    return conv(k, a.cas, b.cas);
  }
  if (a.tag === 'EHelloWorld' && b.tag === 'EHelloWorld') return;
  return terr(`conv failed (${k}): ${show(x, k)} ~ ${show(y, k)}`);
};
export const conv = (k: Ix, a: Val, b: Val): void => {
  log(() => `conv(${k}): ${show(a, k)} ~ ${show(b, k)}`);
  if (a === b) return;
  if (a.tag === 'VVoid' && b.tag === 'VVoid') return;
  if (a.tag === 'VUnitType' && b.tag === 'VUnitType') return;
  if (a.tag === 'VUnit' && b.tag === 'VUnit') return;
  if (a.tag === 'VWorld' && b.tag === 'VWorld') return;
  if (a.tag === 'VWorldToken' && b.tag === 'VWorldToken') return;
  if (a.tag === 'VPi' && b.tag === 'VPi' && a.usage === b.usage) {
    conv(k, a.type, b.type);
    const v = VVar(k);
    return conv(k + 1, vinst(a, v), vinst(b, v));
  }
  if (a.tag === 'VSigma' && b.tag === 'VSigma' && a.usage === b.usage) {
    conv(k, a.type, b.type);
    const v = VVar(k);
    return conv(k + 1, vinst(a, v), vinst(b, v));
  }
  if (a.tag === 'VAbs' && b.tag === 'VAbs') {
    const v = VVar(k);
    return conv(k + 1, vinst(a, v), vinst(b, v));
  }
  if (a.tag === 'VPair' && b.tag === 'VPair') {
    conv(k, a.fst, b.fst);
    return conv(k, a.snd, b.snd);
  }
  if (a.tag === 'VSum' && b.tag === 'VSum') {
    conv(k, a.left, b.left);
    return conv(k, a.right, b.right);
  }
  if (a.tag === 'VInj' && b.tag === 'VInj' && a.which === b.which) {
    conv(k, a.left, b.left);
    conv(k, a.right, b.right);
    return conv(k, a.val, b.val);
  }
  if (a.tag === 'VCon' && b.tag === 'VCon') {
    conv(k, a.sig, b.sig);
    return conv(k, a.val, b.val);
  }
  if (a.tag === 'VFix' && b.tag === 'VFix')
    return conv(k, a.sig, b.sig);

  if (a.tag === 'VAbs') {
    const v = VVar(k);
    return conv(k + 1, vinst(a, v), vapp(b, v));
  }
  if (b.tag === 'VAbs') {
    const v = VVar(k);
    return conv(k + 1, vapp(a, v), vinst(b, v));
  }

  if (a.tag === 'VPair') {
    const [fst, snd] = etaSigma(a, b);
    conv(k, a.fst, fst);
    return conv(k, a.snd, snd);
  }
  if (b.tag === 'VPair') {
    const [fst, snd] = etaSigma(b, a);
    conv(k, fst, b.fst);
    return conv(k, snd, b.snd);
  }

  if (a.tag === 'VUnit' || b.tag === 'VUnit') return;

  if (a.tag === 'VNe' && b.tag === 'VNe' && eqHead(a.head, b.head))
    return zipWithR_((x, y) => convElim(k, x, y, a, b), a.spine, b.spine);

  return terr(`conv failed (${k}): ${show(a, k)} ~ ${show(b, k)}`);
};

const etaSigma = (a: VPair, b: Val): [Val, Val] => {
  /*
  TODO: is this correct?
  x ~ indSigma (\_. s.type) t (\(x : s.type) (y : s.body(x)). x)
  y ~ indSigma (\_. s.body(x)) t (\(x : _) (y : _). y) 
  --------------------------
  (x, y : s) ~ t
  */
  const sigma = a.type as VSigma;
  const fst = vindsigma(UsageRig.default, VAbs(UsageRig.default, '_', sigma, _ => sigma.type), b,
    VAbs(sigma.usage, 'x', sigma.type, x => VAbs(UsageRig.one, 'y', vinst(sigma, x), _ => x)))
  const snd = vindsigma(UsageRig.default, VAbs(UsageRig.default, '_', sigma, _ => vinst(sigma, fst)), b,
    VAbs(sigma.usage, 'x', sigma.type, x => VAbs(UsageRig.one, 'y', vinst(sigma, x), y => y)))
  return [fst, snd];
};
