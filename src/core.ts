import { Ix, Name } from './names';
import { Usage, UsageRig } from './usage';

export type Term =
  Type | Var |
  Pi | Abs | App |
  Let |
  Void | IndVoid |
  UnitType | Unit | IndUnit |
  Sigma | Pair | IndSigma |
  Sum | Inj | IndSum |
  Fix | Con | IndFix |
  World | WorldToken | UpdateWorld | HelloWorld;

export interface Type { readonly tag: 'Type' }
export const Type: Type = { tag: 'Type' };
export interface Var { readonly tag: 'Var'; readonly index: Ix }
export const Var = (index: Ix): Var => ({ tag: 'Var', index });
export interface Pi { readonly tag: 'Pi'; readonly usage: Usage; readonly name: Name; readonly type: Term; readonly body: Term }
export const Pi = (usage: Usage, name: Name, type: Term, body: Term): Pi => ({ tag: 'Pi', usage, name, type, body });
export interface Abs { readonly tag: 'Abs'; readonly usage: Usage; readonly name: Name; readonly type: Term; readonly body: Term }
export const Abs = (usage: Usage, name: Name, type: Term, body: Term): Abs => ({ tag: 'Abs', usage, name, type, body });
export interface App { readonly tag: 'App'; readonly fn: Term; readonly arg: Term }
export const App = (fn: Term, arg: Term): App => ({ tag: 'App', fn, arg });
export interface Let { readonly usage: Usage; readonly tag: 'Let'; readonly name: Name; readonly type: Term; readonly val: Term; readonly body: Term }
export const Let = (usage: Usage, name: Name, type: Term, val: Term, body: Term): Let => ({ tag: 'Let', usage, name, type, val, body });
export interface Void { readonly tag: 'Void' }
export const Void: Void = { tag: 'Void' };
export interface IndVoid { readonly tag: 'IndVoid'; readonly motive: Term; readonly scrut: Term }
export const IndVoid = (motive: Term, scrut: Term): IndVoid => ({ tag: 'IndVoid', motive, scrut });
export interface UnitType { readonly tag: 'UnitType' }
export const UnitType: UnitType = { tag: 'UnitType' };
export interface Unit { readonly tag: 'Unit' }
export const Unit: Unit = { tag: 'Unit' };
export interface IndUnit { readonly tag: 'IndUnit'; readonly motive: Term; readonly scrut: Term, readonly cas: Term }
export const IndUnit = (motive: Term, scrut: Term, cas: Term): IndUnit => ({ tag: 'IndUnit', motive, scrut, cas });
export interface Sigma { readonly tag: 'Sigma'; readonly usage: Usage; readonly name: Name; readonly type: Term; readonly body: Term }
export const Sigma = (usage: Usage, name: Name, type: Term, body: Term): Sigma => ({ tag: 'Sigma', usage, name, type, body });
export interface Pair { readonly tag: 'Pair'; readonly fst: Term; readonly snd: Term; readonly type: Term }
export const Pair = (fst: Term, snd: Term, type: Term): Pair => ({ tag: 'Pair', fst, snd, type });
export interface IndSigma { readonly tag: 'IndSigma'; readonly usage: Usage; readonly motive: Term; readonly scrut: Term, readonly cas: Term }
export const IndSigma = (usage: Usage, motive: Term, scrut: Term, cas: Term): IndSigma => ({ tag: 'IndSigma', usage, motive, scrut, cas });
export interface Sum { readonly tag: 'Sum'; readonly left: Term; readonly right: Term }
export const Sum = (left: Term, right: Term): Sum => ({ tag: 'Sum', left, right });
export interface Inj { readonly tag: 'Inj'; readonly which: 'Left' | 'Right'; readonly left: Term; readonly right: Term; readonly val: Term }
export const Inj = (which: 'Left' | 'Right', left: Term, right: Term, val: Term): Inj => ({ tag: 'Inj', which, left, right, val });
export interface IndSum { readonly tag: 'IndSum'; readonly usage: Usage; readonly motive: Term; readonly scrut: Term; readonly caseLeft: Term; readonly caseRight: Term }
export const IndSum = (usage: Usage, motive: Term, scrut: Term, caseLeft: Term, caseRight: Term): IndSum => ({ tag: 'IndSum', usage, motive, scrut, caseLeft, caseRight });
export interface Fix { readonly tag: 'Fix'; readonly sig: Term }
export const Fix = (sig: Term): Fix => ({ tag: 'Fix', sig });
export interface Con { readonly tag: 'Con'; readonly sig: Term; readonly val: Term }
export const Con = (sig: Term, val: Term): Con => ({ tag: 'Con', sig, val });
export interface IndFix { readonly tag: 'IndFix'; readonly usage: Usage; readonly motive: Term; readonly scrut: Term; readonly cas: Term }
export const IndFix = (usage: Usage, motive: Term, scrut: Term, cas: Term): IndFix => ({ tag: 'IndFix', usage, motive, scrut, cas });
export interface World { readonly tag: 'World' }
export const World: World = { tag: 'World' }
export interface WorldToken { readonly tag: 'WorldToken' }
export const WorldToken: WorldToken = { tag: 'WorldToken' };
export interface UpdateWorld { readonly tag: 'UpdateWorld'; readonly usage: Usage; readonly type: Term; readonly cont: Term }
export const UpdateWorld = (usage: Usage, type: Term, cont: Term): UpdateWorld => ({ tag: 'UpdateWorld', usage, type, cont });
export interface HelloWorld { readonly tag: 'HelloWorld'; readonly arg: Term }
export const HelloWorld = (arg: Term): HelloWorld => ({ tag: 'HelloWorld', arg });

export const flattenPi = (t: Term): [[Usage, Name, Term][], Term] => {
  const params: [Usage, Name, Term][] = [];
  let c = t;  
  while (c.tag === 'Pi') {
    params.push([c.usage, c.name, c.type]);
    c = c.body;
  }
  return [params, c];
};
export const flattenAbs = (t: Term): [[Usage, Name, Term][], Term] => {
  const params: [Usage, Name, Term][] = [];
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
const isSimple = (t: Term) => t.tag === 'Type' || t.tag === 'Var' || t.tag === 'Void' || t.tag === 'UnitType' || t.tag === 'Unit' || t.tag === 'Pair' || t.tag === 'World' || t.tag === 'WorldToken';
const showS = (t: Term) => showP(!isSimple(t), t);
export const show = (t: Term): string => {
  if (t.tag === 'Type') return 'Type';
  if (t.tag === 'Void') return 'Void';
  if (t.tag === 'UnitType') return '()';
  if (t.tag === 'Unit') return '*';
  if (t.tag === 'Var') return `${t.index}`;
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
    return `\\${params.map(([u, x, t]) => `(${u === UsageRig.default ? '' : `${u} `}${x} : ${show(t)})`).join(' ')}. ${show(body)}`;
  }
  if (t.tag === 'App') {
    const [fn, args] = flattenApp(t);
    return `${showP(!isSimple(fn), fn)} ${args.map(t => showP(!isSimple(t), t)).join(' ')}`;
  }
  if (t.tag === 'Let')
    return `let ${t.usage === UsageRig.default ? '' : `${t.usage} `}${t.name} : ${showP(t.type.tag === 'Let', t.type)} = ${showP(t.val.tag === 'Let', t.val)}; ${show(t.body)}`;
  if (t.tag === 'Pair') {
    const ps = flattenPair(t);
    return `(${ps.map(t => show(t)).join(', ')} : ${show(t.type)})`;
  }
  if (t.tag === 'Sum')
    return flattenSum(t).map(x => showP(!isSimple(x) && x.tag !== 'App', x)).join(' ++ ');
  if (t.tag === 'Inj')
    return `${t.which} ${showS(t.left)} ${showS(t.right)} ${showS(t.val)}`;
  if (t.tag === 'IndVoid')
    return `indVoid ${showS(t.motive)} ${showS(t.scrut)}`;
  if (t.tag === 'IndUnit')
    return `indUnit ${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
  if (t.tag === 'IndSum')
    return `indSum ${t.usage === UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.caseLeft)} ${showS(t.caseRight)}`;
  if (t.tag === 'IndSigma')
    return `indSigma ${t.usage === UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
  if (t.tag === 'Fix')
    return `Fix ${showS(t.sig)}`;
  if (t.tag === 'Con')
    return `Con ${showS(t.sig)} ${showS(t.val)}`;
  if (t.tag === 'IndFix')
    return `indFix ${t.usage === UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
  if (t.tag === 'World') return 'World';
  if (t.tag === 'WorldToken') return 'WorldToken';
  if (t.tag === 'UpdateWorld') return `updateWorld ${t.usage === UsageRig.default ? '' : `${t.usage} `}${showS(t.type)} ${showS(t.cont)}`;
  if (t.tag === 'HelloWorld') return `helloWorld ${showS(t.arg)}`;
  return t;
};
