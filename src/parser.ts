import { serr } from './utils/utils';
import { Term, Var, App, Abs, Pi, Let, Type, show, Unit, UnitType, Sigma, Pair, Void, Sum, Inj, IndVoid } from './surface';
import { Name } from './names';
import { log } from './config';
import { Usage, UsageRig } from './usage';

type BracketO = '(' | '{'
type Bracket = BracketO | ')' | '}';
const matchingBracket = (c: Bracket): Bracket => {
  if(c === '(') return ')';
  if(c === ')') return '(';
  if(c === '{') return '}';
  if(c === '}') return '{';
  return serr(`invalid bracket: ${c}`);
};

type Token
  = { tag: 'Name', name: string }
  | { tag: 'Num', num: string }
  | { tag: 'List', list: Token[], bracket: BracketO }
  | { tag: 'Str', str: string };
const TName = (name: string): Token => ({ tag: 'Name', name });
const TNum = (num: string): Token => ({ tag: 'Num', num });
const TList = (list: Token[], bracket: BracketO): Token => ({ tag: 'List', list, bracket });
const TStr = (str: string): Token => ({ tag: 'Str', str });

const SYM1: string[] = ['\\', ':', '=', ';', '*', ','];
const SYM2: string[] = ['->', '**', '++'];

const START = 0;
const NAME = 1;
const COMMENT = 2;
const NUMBER = 3;
const STRING = 4;
const tokenize = (sc: string): Token[] => {
  let state = START;
  let r: Token[] = [];
  let t = '';
  let esc = false;
  let p: Token[][] = [], b: BracketO[] = [];
  for (let i = 0, l = sc.length; i <= l; i++) {
    const c = sc[i] || ' ';
    const next = sc[i + 1] || '';
    if (state === START) {
      if (SYM2.indexOf(c + next) >= 0) r.push(TName(c + next)), i++;
      else if (SYM1.indexOf(c) >= 0) r.push(TName(c));
      else if (c === '"') state = STRING;
      else if (c === '.' && !/[\.\%\_a-z]/i.test(next)) r.push(TName('.'));
      else if (c + next === '--') i++, state = COMMENT;
      else if (/[\-\.\?\@\#\%\_a-z]/i.test(c)) t += c, state = NAME;
      else if (/[0-9]/.test(c)) t += c, state = NUMBER;
      else if(c === '(' || c === '{') b.push(c), p.push(r), r = [];
      else if(c === ')' || c === '}') {
        if(b.length === 0) return serr(`unmatched bracket: ${c}`);
        const br = b.pop() as BracketO;
        if(matchingBracket(br) !== c) return serr(`unmatched bracket: ${br} and ${c}`);
        const a: Token[] = p.pop() as Token[];
        a.push(TList(r, br));
        r = a;
      }
      else if (/\s/.test(c)) continue;
      else return serr(`invalid char ${c} in tokenize`);
    } else if (state === NAME) {
      if (!(/[a-z0-9\-\_\/]/i.test(c) || (c === '.' && /[a-z0-9]/i.test(next)))) {
        r.push(TName(t));
        t = '', i--, state = START;
      } else t += c;
    } else if (state === NUMBER) {
      if (!/[0-9a-z\+\-]/i.test(c)) {
        r.push(TNum(t));
        t = '', i--, state = START;
      } else t += c;
    } else if (state === COMMENT) {
      if (c === '\n') state = START;
    } else if (state === STRING) {
      if (c === '\\') esc = true;
      else if (esc) t += c, esc = false;
      else if (c === '"') {
        r.push(TStr(t));
        t = '', state = START;
      } else t += c;
    }
  }
  if (b.length > 0) return serr(`unclosed brackets: ${b.join(' ')}`);
  if (state !== START && state !== COMMENT)
    return serr('invalid tokenize end state');
  if (esc) return serr(`escape is true after tokenize`);
  return r;
};

const isName = (t: Token, x: Name): boolean =>
  t.tag === 'Name' && t.name === x;
const isNames = (t: Token[]): Name[] =>
  t.map(x => {
    if (x.tag !== 'Name') return serr(`expected name`);
    return x.name;
  });

const splitTokens = (a: Token[], fn: (t: Token) => boolean, keepSymbol: boolean = false): Token[][] => {
  const r: Token[][] = [];
  let t: Token[] = [];
  for (let i = 0, l = a.length; i < l; i++) {
    const c = a[i];
    if (fn(c)) {
      r.push(t);
      t = keepSymbol ? [c] : [];
    } else t.push(c);
  }
  r.push(t);
  return r;
};

const usage = (t: Token): Usage | null => {
  if (t.tag === 'Name' && Usage.includes(t.name)) return t.name as Usage;
  if (t.tag === 'Num' && Usage.includes(t.num)) return t.num as Usage;
  return null;
};

const lambdaParams = (t: Token, fromRepl: boolean): [Usage, Name, boolean, Term | null][] => {
  if (t.tag === 'Name') return [[UsageRig.default, t.name, false, null]];
  if (t.tag === 'List') {
    const impl = t.bracket === '{';
    const a = t.list;
    if (a.length === 0) return [[UsageRig.default, '_', impl, UnitType]];
    const i = a.findIndex(v => v.tag === 'Name' && v.name === ':');
    if (i === -1) return isNames(a).map(x => [UsageRig.default, x, impl, null]);
    let start = 0;
    const n = a[0];
    const pu = usage(n);
    let u: Usage = UsageRig.default;
    if (pu !== null) { u = pu; start = 1 }
    const ns = a.slice(start, i);
    const rest = a.slice(i + 1);
    const ty = exprs(rest, '(', fromRepl);
    return isNames(ns).map(x => [u, x, impl, ty]);
  }
  return serr(`invalid lambda param`);
};
const piParams = (t: Token, fromRepl: boolean): [Usage, Name, boolean, Term][] => {
  if (t.tag === 'Name') return [[UsageRig.default, '_', false, expr(t, fromRepl)[0]]];
  if (t.tag === 'List') {
    const impl = t.bracket === '{';
    const a = t.list;
    if (a.length === 0) return [[UsageRig.default, '_', impl, UnitType]];
    const i = a.findIndex(v => v.tag === 'Name' && v.name === ':');
    if (i === -1) return [[UsageRig.default, '_', impl, expr(t, fromRepl)[0]]];
    let start = 0;
    const n = a[0];
    const pu = usage(n);
    let u: Usage = UsageRig.default;
    if (pu !== null) { u = pu; start = 1 }
    const ns = a.slice(start, i);
    const rest = a.slice(i + 1);
    const ty = exprs(rest, '(', fromRepl);
    return isNames(ns).map(x => [u, x, impl, ty]);
  }
  return serr(`invalid pi param`);
};

const codepoints = (s: string): number[] => {
  const chars: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c1 = s.charCodeAt(i);
    if (c1 >= 0xD800 && c1 < 0xDC00 && i + 1 < s.length) {
      const c2 = s.charCodeAt(i + 1);
      if (c2 >= 0xDC00 && c2 < 0xE000) {
        chars.push(0x10000 + ((c1 - 0xD800) << 10) + (c2 - 0xDC00));
        i++;
        continue;
      }
    }
    chars.push(c1);
  }
  return chars;
};

const numToNat = (n: number, orig: string): Term => {
  if (isNaN(n)) return serr(`invalid nat number: ${orig}`);
  const s = Var('S');
  let c: Term = Var('Z');
  for (let i = 0; i < n; i++) c = App(s, c);
  return c;
};

const expr = (t: Token, fromRepl: boolean): [Term, boolean] => {
  if (t.tag === 'List')
    return [exprs(t.list, '(', fromRepl), t.bracket === '{'];
  if (t.tag === 'Str') {
    const s = codepoints(t.str).reverse();
    const Cons = Var('Cons');
    const Nil = Var('Nil');
    return [s.reduce((t, n) => App(App(Cons, numToNat(n, `codepoint: ${n}`)), t), Nil as Term), false];
  }
  if (t.tag === 'Name') {
    const x = t.name;
    if (x === 'Type') return [Type, false];
    if (x === 'Void') return [Void, false];
    if (x === '*') return [Unit, false];
    if (/[a-z]/i.test(x[0])) return [Var(x), false];
    return serr(`invalid name: ${x}`);
  }
  if (t.tag === 'Num') {
    if (t.num.endsWith('b')) {
      const n = +t.num.slice(0, -1);
      if (isNaN(n)) return serr(`invalid number: ${t.num}`);
      const s0 = Var('B0');
      const s1 = Var('B1');
      let c: Term = Var('BE');
      const s = n.toString(2);
      for (let i = 0; i < s.length; i++) c = App(s[i] === '0' ? s0 : s1, c);
      return [c, false];
    } else if (t.num.endsWith('f')) {
      const n = +t.num.slice(0, -1);
      if (isNaN(n)) return serr(`invalid number: ${t.num}`);
      const s = Var('FS');
      let c: Term = Var('FZ');
      for (let i = 0; i < n; i++) c = App(s, c);
      return [c, false];
    } else if (t.num.endsWith('n')) {
      return [numToNat(+t.num.slice(0, -1), t.num), false];
    } else {
      return [numToNat(+t.num, t.num), false];
    }
  }
  return t;
};

const exprs = (ts: Token[], br: BracketO, fromRepl: boolean): Term => {
  if (br === '{') return serr(`{} cannot be used here`);
  if (ts.length === 0) return UnitType;
  if (ts.length === 1) return expr(ts[0], fromRepl)[0];
  if (isName(ts[0], 'let')) {
    let x = ts[1];
    let j = 2;
    const pu = usage(x);
    let u: Usage = UsageRig.default;
    if (pu !== null) { u = pu; x = ts[2]; j = 3 }
    let name = 'ERROR';
    if (x.tag === 'Name') {
      name = x.name;
    } else if (x.tag === 'List' && x.bracket === '{') {
      const a = x.list;
      if (a.length !== 1) return serr(`invalid name for let`);
      const h = a[0];
      if (h.tag !== 'Name') return serr(`invalid name for let`);
      name = h.name;
    } else return serr(`invalid name for let`);
    let ty: Term | null = null;
    if (isName(ts[j], ':')) {
      const tyts: Token[] = [];
      j++;
      for (; j < ts.length; j++) {
        const v = ts[j];
        if (v.tag === 'Name' && v.name === '=')
          break;
        else tyts.push(v);
      }
      ty = exprs(tyts, '(', fromRepl);
    }
    if (!isName(ts[j], '=')) return serr(`no = after name in let`);
    const vals: Token[] = [];
    let found = false;
    let i = j + 1;
    for (; i < ts.length; i++) {
      const c = ts[i];
      if (c.tag === 'Name' && c.name === ';') {
        found = true;
        break;
      }
      vals.push(c);
    }
    if (vals.length === 0) return serr(`empty val in let`);
    const val = exprs(vals, '(', fromRepl);
    if (!found) {
      if (!fromRepl) return serr(`no ; after let`);
      return Let(u, name, ty || null, val, null as any);
    }
    const body = exprs(ts.slice(i + 1), '(', fromRepl);
    return Let(u, name, ty || null, val, body);
  }
  const i = ts.findIndex(x => isName(x, ':'));
  if (i >= 0) {
    const a = ts.slice(0, i);
    const b = ts.slice(i + 1);
    return Let(UsageRig.default, 'x', exprs(b, '(', fromRepl), exprs(a, '(', fromRepl), Var('x'));
  }
  if (isName(ts[0], '\\')) {
    const args: [Usage, Name, boolean, Term | null][] = [];
    let found = false;
    let i = 1;
    for (; i < ts.length; i++) {
      const c = ts[i];
      if (isName(c, '.')) {
        found = true;
        break;
      }
      lambdaParams(c, fromRepl).forEach(x => args.push(x));
    }
    if (!found) return serr(`. not found after \\ or there was no whitespace after .`);
    const body = exprs(ts.slice(i + 1), '(', fromRepl);
    return args.reduceRight((x, [u, name, , ty]) => Abs(u, name, ty, x), body);
  }
  if (isName(ts[0], 'Left') || isName(ts[0], 'Right')) {
    const tag = (ts[0] as any).name;
    const val = exprs(ts.slice(1), br, fromRepl);
    return Inj(tag, val);
  }
  if (isName(ts[0], 'indVoid')) {
    if (ts.length !== 3) return serr(`indVoid expects exactly 2 arguments`);
    const [motive] = expr(ts[1], fromRepl);
    const [scrut] = expr(ts[2], fromRepl);
    return IndVoid(motive, scrut);
  }
  const j = ts.findIndex(x => isName(x, '->'));
  if (j >= 0) {
    const s = splitTokens(ts, x => isName(x, '->'));
    if (s.length < 2) return serr(`parsing failed with ->`);
    const args: [Usage, Name, boolean, Term][] = s.slice(0, -1)
      .map(p => p.length === 1 ? piParams(p[0], fromRepl) : [[UsageRig.default, '_', false, exprs(p, '(', fromRepl)] as [Usage, Name, boolean, Term]])
      .reduce((x, y) => x.concat(y), []);
    const body = exprs(s[s.length - 1], '(', fromRepl);
    return args.reduceRight((x, [u, name, , ty]) => Pi(u, name, ty, x), body);
  }
  const jp = ts.findIndex(x => isName(x, ','));
  if (jp >= 0) {
    const s = splitTokens(ts, x => isName(x, ','));
    if (s.length < 2) return serr(`parsing failed with ,`);
    const args: [Term, boolean][] = s.map(x => {
      if (x.length === 1) {
        const h = x[0];
        if (h.tag === 'List' && h.bracket === '{')
          return expr(h, fromRepl)
      }
      return [exprs(x, '(', fromRepl), false];
    });
    if (args.length === 0) return serr(`empty pair`);
    if (args.length === 1) return serr(`singleton pair`);
    const last1 = args[args.length - 1];
    const last2 = args[args.length - 2];
    const lastitem = Pair(last2[0], last1[0]);
    return args.slice(0, -2).reduceRight((x, [y, _p]) => Pair(y, x), lastitem);
  }
  const js = ts.findIndex(x => isName(x, '**'));
  if (js >= 0) {
    const s = splitTokens(ts, x => isName(x, '**'));
    if (s.length < 2) return serr(`parsing failed with **`);
    const args: [Usage, Name, boolean, Term][] = s.slice(0, -1)
      .map(p => p.length === 1 ? piParams(p[0], fromRepl) : [[UsageRig.default, '_', false, exprs(p, '(', fromRepl)] as [Usage, Name, boolean, Term]])
      .reduce((x, y) => x.concat(y), []);
    const body = exprs(s[s.length - 1], '(', fromRepl);
    return args.reduceRight((x, [u, name, , ty]) => Sigma(u, name, ty, x), body);
  }
  const jsum = ts.findIndex(x => isName(x, '++'));
  if (jsum >= 0) {
    const s = splitTokens(ts, x => isName(x, '++'));
    if (s.length < 2) return serr(`parsing failed with ++`);
    const args: [Term, boolean][] = s.map(x => {
      if (x.length === 1) {
        const h = x[0];
        if (h.tag === 'List' && h.bracket === '{')
          return expr(h, fromRepl)
      }
      return [exprs(x, '(', fromRepl), false];
    });
    if (args.length === 0) return serr(`empty sum`);
    if (args.length === 1) return serr(`singleton sum`);
    const last1 = args[args.length - 1];
    const last2 = args[args.length - 2];
    const lastitem = Sum(last2[0], last1[0]);
    return args.slice(0, -2).reduceRight((x, [y, _p]) => Sum(y, x), lastitem);
  }
  const l = ts.findIndex(x => isName(x, '\\'));
  let all = [];
  if (l >= 0) {
    const first = ts.slice(0, l).map(t => expr(t, fromRepl));
    const rest = exprs(ts.slice(l), '(', fromRepl);
    all = first.concat([[rest, false]]);
  } else {
    all = ts.map(t => expr(t, fromRepl));
  }
  if (all.length === 0) return serr(`empty application`);
  if (all[0] && all[0][1]) return serr(`in application function cannot be between {}`);
  return all.slice(1).reduce((x, [y]) => App(x, y), all[0][0]);
};

export const parse = (s: string, fromRepl: boolean = false): Term => {
  log(() => `parse ${s}`);
  const ts = tokenize(s);
  const ex = exprs(ts, '(', fromRepl);
  if (!fromRepl) log(() => `parsed ${show(ex)}`);
  return ex;
};
