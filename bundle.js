(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.setConfig = exports.config = void 0;
exports.config = {
    debug: false,
    showEnvs: false,
};
const setConfig = (c) => {
    for (let k in c)
        exports.config[k] = c[k];
};
exports.setConfig = setConfig;
const log = (msg) => {
    if (exports.config.debug)
        console.log(msg());
};
exports.log = log;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conv = exports.eqHead = void 0;
const config_1 = require("./config");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const values_1 = require("./values");
const eqHead = (a, b) => {
    if (a === b)
        return true;
    if (a.tag === 'HVar')
        return b.tag === 'HVar' && a.level === b.level;
    return a.tag;
};
exports.eqHead = eqHead;
const convElim = (k, a, b, x, y) => {
    if (a === b)
        return;
    if (a.tag === 'EApp' && b.tag === 'EApp')
        return exports.conv(k, a.arg, b.arg);
    return utils_1.terr(`conv failed (${k}): ${values_1.show(x, k)} ~ ${values_1.show(y, k)}`);
};
const conv = (k, a, b) => {
    config_1.log(() => `conv(${k}): ${values_1.show(a, k)} ~ ${values_1.show(b, k)}`);
    if (a === b)
        return;
    if (a.tag === 'VPi' && b.tag === 'VPi') {
        exports.conv(k, a.type, b.type);
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vinst(a, v), values_1.vinst(b, v));
    }
    if (a.tag === 'VAbs' && b.tag === 'VAbs') {
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vinst(a, v), values_1.vinst(b, v));
    }
    if (a.tag === 'VAbs') {
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vinst(a, v), values_1.vapp(b, v));
    }
    if (b.tag === 'VAbs') {
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vapp(a, v), values_1.vinst(b, v));
    }
    if (a.tag === 'VNe' && b.tag === 'VNe' && exports.eqHead(a.head, b.head))
        return list_1.zipWithR_((x, y) => convElim(k, x, y, a, b), a.spine, b.spine);
    return utils_1.terr(`conv failed (${k}): ${values_1.show(a, k)} ~ ${values_1.show(b, k)}`);
};
exports.conv = conv;

},{"./config":1,"./utils/list":9,"./utils/utils":10,"./values":11}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.show = exports.flattenApp = exports.flattenAbs = exports.flattenPi = exports.Let = exports.App = exports.Abs = exports.Pi = exports.Var = exports.Type = void 0;
exports.Type = { tag: 'Type' };
const Var = (index) => ({ tag: 'Var', index });
exports.Var = Var;
const Pi = (name, type, body) => ({ tag: 'Pi', name, type, body });
exports.Pi = Pi;
const Abs = (name, type, body) => ({ tag: 'Abs', name, type, body });
exports.Abs = Abs;
const App = (fn, arg) => ({ tag: 'App', fn, arg });
exports.App = App;
const Let = (name, type, val, body) => ({ tag: 'Let', name, type, val, body });
exports.Let = Let;
const flattenPi = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Pi') {
        params.push([c.name, c.type]);
        c = c.body;
    }
    return [params, c];
};
exports.flattenPi = flattenPi;
const flattenAbs = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Abs') {
        params.push([c.name, c.type]);
        c = c.body;
    }
    return [params, c];
};
exports.flattenAbs = flattenAbs;
const flattenApp = (t) => {
    const args = [];
    let c = t;
    while (c.tag === 'App') {
        args.push(c.arg);
        c = c.fn;
    }
    return [c, args.reverse()];
};
exports.flattenApp = flattenApp;
const showP = (b, t) => b ? `(${exports.show(t)})` : exports.show(t);
const isSimple = (t) => t.tag === 'Type' || t.tag === 'Var';
const show = (t) => {
    if (t.tag === 'Var')
        return `${t.index}`;
    if (t.tag === 'Type')
        return 'Type';
    if (t.tag === 'Pi') {
        const [params, ret] = exports.flattenPi(t);
        return `${params.map(([x, t]) => x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Let', t) : `(${x} : ${exports.show(t)})`).join(' -> ')} -> ${exports.show(ret)}`;
    }
    if (t.tag === 'Abs') {
        const [params, body] = exports.flattenAbs(t);
        return `\\${params.map(([x, t]) => `(${x} : ${exports.show(t)})`).join(' ')}. ${exports.show(body)}`;
    }
    if (t.tag === 'App') {
        const [fn, args] = exports.flattenApp(t);
        return `${showP(!isSimple(fn), fn)} ${args.map(t => showP(!isSimple(t), t)).join(' ')}`;
    }
    if (t.tag === 'Let')
        return `let ${t.name} : ${showP(t.type.tag === 'Let', t.type)} = ${showP(t.val.tag === 'Let', t.val)}; ${exports.show(t.body)}`;
    return t;
};
exports.show = show;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elaborate = exports.localExtend = exports.localEmpty = exports.Local = exports.EntryT = void 0;
const config_1 = require("./config");
const core_1 = require("./core");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const values_1 = require("./values");
const S = require("./surface");
const surface_1 = require("./surface");
const conversion_1 = require("./conversion");
const EntryT = (type) => ({ type });
exports.EntryT = EntryT;
const indexT = (ts, ix) => {
    let l = ts;
    let i = 0;
    while (l.tag === 'Cons') {
        if (ix === 0)
            return [l.head, i];
        i++;
        ix--;
        l = l.tail;
    }
    return null;
};
const Local = (level, ns, ts, vs) => ({ level, ns, ts, vs });
exports.Local = Local;
exports.localEmpty = exports.Local(0, list_1.Nil, list_1.Nil, list_1.Nil);
const localExtend = (local, name, ty, val = values_1.VVar(local.level)) => exports.Local(local.level + 1, list_1.Cons(name, local.ns), list_1.Cons(exports.EntryT(ty), local.ts), list_1.Cons(val, local.vs));
exports.localExtend = localExtend;
const showVal = (local, val) => S.showVal(val, local.level, local.ns);
const check = (local, tm, ty) => {
    config_1.log(() => `check ${surface_1.show(tm)} : ${showVal(local, ty)}`);
    if (tm.tag === 'Type' && ty.tag === 'VType')
        return core_1.Type;
    if (tm.tag === 'Abs' && !tm.type && ty.tag === 'VPi') {
        const v = values_1.VVar(local.level);
        const x = tm.name;
        const body = check(exports.localExtend(local, x, ty.type, v), tm.body, values_1.vinst(ty, v));
        return core_1.Abs(x, values_1.quote(ty.type, local.level), body);
    }
    if (tm.tag === 'Let') {
        let vtype;
        let vty;
        let val;
        if (tm.type) {
            vtype = check(local, tm.type, values_1.VType);
            vty = values_1.evaluate(vtype, local.vs);
            val = check(local, tm.val, ty);
        }
        else {
            [val, vty] = synth(local, tm.val);
            vtype = values_1.quote(vty, local.level);
        }
        const v = values_1.evaluate(val, local.vs);
        const body = check(exports.localExtend(local, tm.name, vty, v), tm.body, ty);
        return core_1.Let(tm.name, vtype, val, body);
    }
    const [term, ty2] = synth(local, tm);
    return utils_1.tryT(() => {
        config_1.log(() => `unify ${showVal(local, ty2)} ~ ${showVal(local, ty)}`);
        conversion_1.conv(local.level, ty2, ty);
        return term;
    }, e => utils_1.terr(`check failed (${surface_1.show(tm)}): ${showVal(local, ty2)} ~ ${showVal(local, ty)}: ${e}`));
};
const synth = (local, tm) => {
    config_1.log(() => `synth ${surface_1.show(tm)}`);
    if (tm.tag === 'Type')
        return [core_1.Type, values_1.VType];
    if (tm.tag === 'Var') {
        const i = list_1.indexOf(local.ns, tm.name);
        if (i < 0)
            return utils_1.terr(`undefined var ${tm.name}`);
        else {
            const [entry, j] = indexT(local.ts, i) || utils_1.terr(`var out of scope ${surface_1.show(tm)}`);
            return [core_1.Var(j), entry.type];
        }
    }
    if (tm.tag === 'App') {
        const [fntm, fnty] = synth(local, tm.fn);
        const [argtm, rty] = synthapp(local, fnty, tm.arg);
        return [core_1.App(fntm, argtm), rty];
    }
    if (tm.tag === 'Abs') {
        if (tm.type) {
            const type = check(local, tm.type, values_1.VType);
            const ty = values_1.evaluate(type, local.vs);
            const [body, rty] = synth(exports.localExtend(local, tm.name, ty), tm.body);
            const pi = values_1.evaluate(core_1.Pi(tm.name, type, values_1.quote(rty, local.level + 1)), local.vs);
            return [core_1.Abs(tm.name, type, body), pi];
        }
        else
            utils_1.terr(`cannot synth unannotated lambda: ${surface_1.show(tm)}`);
    }
    if (tm.tag === 'Pi') {
        const type = check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(type, local.vs);
        const body = check(exports.localExtend(local, tm.name, ty), tm.body, values_1.VType);
        return [core_1.Pi(tm.name, type, body), values_1.VType];
    }
    if (tm.tag === 'Let') {
        let type;
        let ty;
        let val;
        if (tm.type) {
            type = check(local, tm.type, values_1.VType);
            ty = values_1.evaluate(type, local.vs);
            val = check(local, tm.val, ty);
        }
        else {
            [val, ty] = synth(local, tm.val);
            type = values_1.quote(ty, local.level);
        }
        const v = values_1.evaluate(val, local.vs);
        const [body, rty] = synth(exports.localExtend(local, tm.name, ty, v), tm.body);
        return [core_1.Let(tm.name, type, val, body), rty];
    }
    return utils_1.terr(`unable to synth ${surface_1.show(tm)}`);
};
const synthapp = (local, ty, arg) => {
    config_1.log(() => `synthapp ${showVal(local, ty)} @ ${surface_1.show(arg)}`);
    if (ty.tag === 'VPi') {
        const cty = ty.type;
        const term = check(local, arg, cty);
        const v = values_1.evaluate(term, local.vs);
        return [term, values_1.vinst(ty, v)];
    }
    return utils_1.terr(`not a correct pi type in synthapp: ${showVal(local, ty)} @ ${surface_1.show(arg)}`);
};
const elaborate = (t, local = exports.localEmpty) => {
    const [tm, vty] = synth(local, t);
    const ty = values_1.quote(vty, 0);
    return [tm, ty];
};
exports.elaborate = elaborate;

},{"./config":1,"./conversion":2,"./core":3,"./surface":8,"./utils/list":9,"./utils/utils":10,"./values":11}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseName = exports.nextName = void 0;
const list_1 = require("./utils/list");
const nextName = (x) => {
    if (x === '_')
        return x;
    const s = x.split('$');
    if (s.length === 2)
        return `${s[0]}\$${+s[1] + 1}`;
    return `${x}\$0`;
};
exports.nextName = nextName;
const chooseName = (x, ns) => x === '_' ? x : list_1.contains(ns, x) ? exports.chooseName(exports.nextName(x), ns) : x;
exports.chooseName = chooseName;

},{"./utils/list":9}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const utils_1 = require("./utils/utils");
const surface_1 = require("./surface");
const config_1 = require("./config");
const matchingBracket = (c) => {
    if (c === '(')
        return ')';
    if (c === ')')
        return '(';
    if (c === '{')
        return '}';
    if (c === '}')
        return '{';
    return utils_1.serr(`invalid bracket: ${c}`);
};
const TName = (name) => ({ tag: 'Name', name });
const TNum = (num) => ({ tag: 'Num', num });
const TList = (list, bracket) => ({ tag: 'List', list, bracket });
const TStr = (str) => ({ tag: 'Str', str });
const SYM1 = ['\\', ':', '=', ';'];
const SYM2 = ['->'];
const START = 0;
const NAME = 1;
const COMMENT = 2;
const NUMBER = 3;
const STRING = 4;
const tokenize = (sc) => {
    let state = START;
    let r = [];
    let t = '';
    let esc = false;
    let p = [], b = [];
    for (let i = 0, l = sc.length; i <= l; i++) {
        const c = sc[i] || ' ';
        const next = sc[i + 1] || '';
        if (state === START) {
            if (SYM2.indexOf(c + next) >= 0)
                r.push(TName(c + next)), i++;
            else if (SYM1.indexOf(c) >= 0)
                r.push(TName(c));
            else if (c === '"')
                state = STRING;
            else if (c === '.' && !/[\.\%\_a-z]/i.test(next))
                r.push(TName('.'));
            else if (c + next === '--')
                i++, state = COMMENT;
            else if (/[\-\.\?\@\#\%\_a-z]/i.test(c))
                t += c, state = NAME;
            else if (/[0-9]/.test(c))
                t += c, state = NUMBER;
            else if (c === '(' || c === '{')
                b.push(c), p.push(r), r = [];
            else if (c === ')' || c === '}') {
                if (b.length === 0)
                    return utils_1.serr(`unmatched bracket: ${c}`);
                const br = b.pop();
                if (matchingBracket(br) !== c)
                    return utils_1.serr(`unmatched bracket: ${br} and ${c}`);
                const a = p.pop();
                a.push(TList(r, br));
                r = a;
            }
            else if (/\s/.test(c))
                continue;
            else
                return utils_1.serr(`invalid char ${c} in tokenize`);
        }
        else if (state === NAME) {
            if (!(/[a-z0-9\-\_\/]/i.test(c) || (c === '.' && /[a-z0-9]/i.test(next)))) {
                r.push(TName(t));
                t = '', i--, state = START;
            }
            else
                t += c;
        }
        else if (state === NUMBER) {
            if (!/[0-9a-z]/i.test(c)) {
                r.push(TNum(t));
                t = '', i--, state = START;
            }
            else
                t += c;
        }
        else if (state === COMMENT) {
            if (c === '\n')
                state = START;
        }
        else if (state === STRING) {
            if (c === '\\')
                esc = true;
            else if (esc)
                t += c, esc = false;
            else if (c === '"') {
                r.push(TStr(t));
                t = '', state = START;
            }
            else
                t += c;
        }
    }
    if (b.length > 0)
        return utils_1.serr(`unclosed brackets: ${b.join(' ')}`);
    if (state !== START && state !== COMMENT)
        return utils_1.serr('invalid tokenize end state');
    if (esc)
        return utils_1.serr(`escape is true after tokenize`);
    return r;
};
const tunit = surface_1.Var('U');
const unit = surface_1.Var('Unit');
const isName = (t, x) => t.tag === 'Name' && t.name === x;
const isNames = (t) => t.map(x => {
    if (x.tag !== 'Name')
        return utils_1.serr(`expected name`);
    return x.name;
});
const splitTokens = (a, fn, keepSymbol = false) => {
    const r = [];
    let t = [];
    for (let i = 0, l = a.length; i < l; i++) {
        const c = a[i];
        if (fn(c)) {
            r.push(t);
            t = keepSymbol ? [c] : [];
        }
        else
            t.push(c);
    }
    r.push(t);
    return r;
};
const lambdaParams = (t, fromRepl) => {
    if (t.tag === 'Name')
        return [[t.name, false, null]];
    if (t.tag === 'List') {
        const impl = t.bracket === '{';
        const a = t.list;
        if (a.length === 0)
            return [['_', impl, tunit]];
        const i = a.findIndex(v => v.tag === 'Name' && v.name === ':');
        if (i === -1)
            return isNames(a).map(x => [x, impl, null]);
        const ns = a.slice(0, i);
        const rest = a.slice(i + 1);
        const ty = exprs(rest, '(', fromRepl);
        return isNames(ns).map(x => [x, impl, ty]);
    }
    return utils_1.serr(`invalid lambda param`);
};
const piParams = (t, fromRepl) => {
    if (t.tag === 'Name')
        return [['_', false, expr(t, fromRepl)[0]]];
    if (t.tag === 'List') {
        const impl = t.bracket === '{';
        const a = t.list;
        if (a.length === 0)
            return [['_', impl, tunit]];
        const i = a.findIndex(v => v.tag === 'Name' && v.name === ':');
        if (i === -1)
            return [['_', impl, expr(t, fromRepl)[0]]];
        const ns = a.slice(0, i);
        const rest = a.slice(i + 1);
        const ty = exprs(rest, '(', fromRepl);
        return isNames(ns).map(x => [x, impl, ty]);
    }
    return utils_1.serr(`invalid pi param`);
};
const codepoints = (s) => {
    const chars = [];
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
const numToNat = (n) => {
    if (isNaN(n))
        return utils_1.serr(`invalid nat number: ${n}`);
    const s = surface_1.Var('S');
    let c = surface_1.Var('Z');
    for (let i = 0; i < n; i++)
        c = surface_1.App(s, c);
    return c;
};
const expr = (t, fromRepl) => {
    if (t.tag === 'List')
        return [exprs(t.list, '(', fromRepl), t.bracket === '{'];
    if (t.tag === 'Str') {
        const s = codepoints(t.str).reverse();
        const Cons = surface_1.Var('Cons');
        const Nil = surface_1.Var('Nil');
        return [s.reduce((t, n) => surface_1.App(surface_1.App(Cons, numToNat(n)), t), Nil), false];
    }
    if (t.tag === 'Name') {
        const x = t.name;
        if (x === 'Type')
            return [surface_1.Type, false];
        if (/[a-z]/i.test(x[0]))
            return [surface_1.Var(x), false];
        return utils_1.serr(`invalid name: ${x}`);
    }
    if (t.tag === 'Num') {
        if (t.num.endsWith('b')) {
            const n = +t.num.slice(0, -1);
            if (isNaN(n))
                return utils_1.serr(`invalid number: ${t.num}`);
            const s0 = surface_1.Var('B0');
            const s1 = surface_1.Var('B1');
            let c = surface_1.Var('BE');
            const s = n.toString(2);
            for (let i = 0; i < s.length; i++)
                c = surface_1.App(s[i] === '0' ? s0 : s1, c);
            return [c, false];
        }
        else if (t.num.endsWith('f')) {
            const n = +t.num.slice(0, -1);
            if (isNaN(n))
                return utils_1.serr(`invalid number: ${t.num}`);
            const s = surface_1.Var('FS');
            let c = surface_1.Var('FZ');
            for (let i = 0; i < n; i++)
                c = surface_1.App(s, c);
            return [c, false];
        }
        else if (t.num.endsWith('n')) {
            return [numToNat(+t.num.slice(0, -1)), false];
        }
        else {
            return [numToNat(+t.num), false];
        }
    }
    return t;
};
const exprs = (ts, br, fromRepl) => {
    if (br === '{')
        return utils_1.serr(`{} cannot be used here`);
    if (ts.length === 0)
        return unit;
    if (ts.length === 1)
        return expr(ts[0], fromRepl)[0];
    if (isName(ts[0], 'let')) {
        const x = ts[1];
        let name = 'ERROR';
        if (x.tag === 'Name') {
            name = x.name;
        }
        else if (x.tag === 'List' && x.bracket === '{') {
            const a = x.list;
            if (a.length !== 1)
                return utils_1.serr(`invalid name for let`);
            const h = a[0];
            if (h.tag !== 'Name')
                return utils_1.serr(`invalid name for let`);
            name = h.name;
        }
        else
            return utils_1.serr(`invalid name for let`);
        let ty = null;
        let j = 2;
        if (isName(ts[j], ':')) {
            const tyts = [];
            j++;
            for (; j < ts.length; j++) {
                const v = ts[j];
                if (v.tag === 'Name' && v.name === '=')
                    break;
                else
                    tyts.push(v);
            }
            ty = exprs(tyts, '(', fromRepl);
        }
        if (!isName(ts[j], '='))
            return utils_1.serr(`no = after name in let`);
        const vals = [];
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
        if (vals.length === 0)
            return utils_1.serr(`empty val in let`);
        const val = exprs(vals, '(', fromRepl);
        const name2 = name[0] === '-' ? name.slice(1) : name;
        if (!found) {
            if (!fromRepl)
                return utils_1.serr(`no ; after let`);
            return surface_1.Let(name2, ty || null, val, null);
        }
        const body = exprs(ts.slice(i + 1), '(', fromRepl);
        return surface_1.Let(name2, ty || null, val, body);
    }
    const i = ts.findIndex(x => isName(x, ':'));
    if (i >= 0) {
        const a = ts.slice(0, i);
        const b = ts.slice(i + 1);
        return surface_1.Let('x', exprs(b, '(', fromRepl), exprs(a, '(', fromRepl), surface_1.Var('x'));
    }
    if (isName(ts[0], '\\')) {
        const args = [];
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
        if (!found)
            return utils_1.serr(`. not found after \\ or there was no whitespace after .`);
        const body = exprs(ts.slice(i + 1), '(', fromRepl);
        return args.reduceRight((x, [name, , ty]) => surface_1.Abs(name[0] === '-' ? name.slice(1) : name, ty, x), body);
    }
    const j = ts.findIndex(x => isName(x, '->'));
    if (j >= 0) {
        const s = splitTokens(ts, x => isName(x, '->'));
        if (s.length < 2)
            return utils_1.serr(`parsing failed with ->`);
        const args = s.slice(0, -1)
            .map(p => p.length === 1 ? piParams(p[0], fromRepl) : [['_', false, exprs(p, '(', fromRepl)]])
            .reduce((x, y) => x.concat(y), []);
        const body = exprs(s[s.length - 1], '(', fromRepl);
        return args.reduceRight((x, [name, , ty]) => surface_1.Pi(name[0] === '-' ? name.slice(1) : name, ty, x), body);
    }
    const l = ts.findIndex(x => isName(x, '\\'));
    let all = [];
    if (l >= 0) {
        const first = ts.slice(0, l).map(t => expr(t, fromRepl));
        const rest = exprs(ts.slice(l), '(', fromRepl);
        all = first.concat([[rest, false]]);
    }
    else {
        all = ts.map(t => expr(t, fromRepl));
    }
    if (all.length === 0)
        return utils_1.serr(`empty application`);
    if (all[0] && all[0][1])
        return utils_1.serr(`in application function cannot be between {}`);
    return all.slice(1).reduce((x, [y]) => surface_1.App(x, y), all[0][0]);
};
const parse = (s, fromRepl = false) => {
    config_1.log(() => `parse ${s}`);
    const ts = tokenize(s);
    const ex = exprs(ts, '(', fromRepl);
    config_1.log(() => `parsed ${surface_1.show(ex)}`);
    return ex;
};
exports.parse = parse;

},{"./config":1,"./surface":8,"./utils/utils":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runREPL = exports.initREPL = void 0;
const config_1 = require("./config");
const elaboration_1 = require("./elaboration");
const parser_1 = require("./parser");
const surface_1 = require("./surface");
const C = require("./core");
const values_1 = require("./values");
const verification_1 = require("./verification");
const Elab = require("./elaboration");
const Verif = require("./verification");
const help = `
COMMANDS
[:help or :h] this help message
[:debug or :d] toggle debug log messages
[:showStackTrace] show stack trace of error
[:type or :t] do not normalize
[:defs] show definitions
[:clear] clear definitions
`.trim();
let showStackTrace = false;
let defs = [];
let elocal = Elab.localEmpty;
let vlocal = Verif.localEmpty;
const initREPL = () => {
    showStackTrace = false;
    defs = [];
    elocal = Elab.localEmpty;
    vlocal = Verif.localEmpty;
};
exports.initREPL = initREPL;
const runREPL = (s_, cb) => {
    try {
        let s = s_.trim();
        if (s === ':help' || s === ':h')
            return cb(help);
        if (s === ':d' || s === ':debug') {
            const d = !config_1.config.debug;
            config_1.setConfig({ debug: d });
            return cb(`debug: ${d}`);
        }
        if (s === ':showStackTrace') {
            showStackTrace = !showStackTrace;
            return cb(`showStackTrace: ${showStackTrace}`);
        }
        if (s === ':defs')
            return cb(defs.map(([x, t, v]) => `let ${x}${t ? ` : ${surface_1.show(t)}` : ''} = ${surface_1.show(v)}`).join('\n'));
        if (s === ':clear') {
            defs = [];
            elocal = Elab.localEmpty;
            vlocal = Verif.localEmpty;
            return cb(`cleared definitions`);
        }
        let typeOnly = false;
        if (s.startsWith(':type') || s.startsWith(':t')) {
            typeOnly = true;
            s = s.startsWith(':type') ? s.slice(5) : s.slice(2);
        }
        if (s.startsWith(':'))
            throw new Error(`invalid command: ${s}`);
        config_1.log(() => 'PARSE');
        let term = parser_1.parse(s, true);
        let isDef = false;
        if (term.tag === 'Let' && term.body === null) {
            isDef = true;
            term = surface_1.Let(term.name, term.type, term.val, surface_1.Var(term.name));
        }
        config_1.log(() => surface_1.show(term));
        config_1.log(() => 'ELABORATE');
        const [eterm, etype] = elaboration_1.elaborate(term, elocal);
        config_1.log(() => C.show(eterm));
        config_1.log(() => surface_1.showCore(eterm));
        config_1.log(() => C.show(etype));
        config_1.log(() => surface_1.showCore(etype));
        config_1.log(() => 'VERIFICATION');
        const verifty = verification_1.verify(eterm, vlocal);
        let normstr = '';
        if (!typeOnly) {
            config_1.log(() => 'NORMALIZE');
            const norm = values_1.normalize(eterm, elocal.vs);
            config_1.log(() => C.show(norm));
            config_1.log(() => surface_1.showCore(norm));
            normstr = `\nnorm: ${surface_1.showCore(norm)}`;
        }
        const etermstr = surface_1.showCore(eterm, elocal.ns);
        if (isDef && term.tag === 'Let') {
            defs.push([term.name, term.type, term.val]);
            elocal = Elab.localExtend(elocal, term.name, values_1.evaluate(etype, elocal.vs), values_1.evaluate(eterm, elocal.vs));
            vlocal = Verif.localExtend(vlocal, values_1.evaluate(verifty, vlocal.vs), values_1.evaluate(eterm, vlocal.vs));
        }
        return cb(`term: ${surface_1.show(term)}\ntype: ${surface_1.showCore(etype)}\netrm: ${etermstr}${normstr}`);
    }
    catch (err) {
        if (showStackTrace)
            console.error(err);
        return cb(`${err}`, true);
    }
};
exports.runREPL = runREPL;

},{"./config":1,"./core":3,"./elaboration":4,"./parser":6,"./surface":8,"./values":11,"./verification":12}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showVal = exports.showCore = exports.fromCore = exports.show = exports.flattenApp = exports.flattenAbs = exports.flattenPi = exports.Let = exports.App = exports.Abs = exports.Pi = exports.Var = exports.Type = void 0;
const names_1 = require("./names");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const values_1 = require("./values");
exports.Type = { tag: 'Type' };
const Var = (name) => ({ tag: 'Var', name });
exports.Var = Var;
const Pi = (name, type, body) => ({ tag: 'Pi', name, type, body });
exports.Pi = Pi;
const Abs = (name, type, body) => ({ tag: 'Abs', name, type, body });
exports.Abs = Abs;
const App = (fn, arg) => ({ tag: 'App', fn, arg });
exports.App = App;
const Let = (name, type, val, body) => ({ tag: 'Let', name, type, val, body });
exports.Let = Let;
const flattenPi = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Pi') {
        params.push([c.name, c.type]);
        c = c.body;
    }
    return [params, c];
};
exports.flattenPi = flattenPi;
const flattenAbs = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Abs') {
        params.push([c.name, c.type]);
        c = c.body;
    }
    return [params, c];
};
exports.flattenAbs = flattenAbs;
const flattenApp = (t) => {
    const args = [];
    let c = t;
    while (c.tag === 'App') {
        args.push(c.arg);
        c = c.fn;
    }
    return [c, args.reverse()];
};
exports.flattenApp = flattenApp;
const showP = (b, t) => b ? `(${exports.show(t)})` : exports.show(t);
const isSimple = (t) => t.tag === 'Type' || t.tag === 'Var';
const show = (t) => {
    if (t.tag === 'Var')
        return t.name;
    if (t.tag === 'Type')
        return 'Type';
    if (t.tag === 'Pi') {
        const [params, ret] = exports.flattenPi(t);
        return `${params.map(([x, t]) => x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Let', t) : `(${x} : ${exports.show(t)})`).join(' -> ')} -> ${exports.show(ret)}`;
    }
    if (t.tag === 'Abs') {
        const [params, body] = exports.flattenAbs(t);
        return `\\${params.map(([x, t]) => t ? `(${x} : ${exports.show(t)})` : x).join(' ')}. ${exports.show(body)}`;
    }
    if (t.tag === 'App') {
        const [fn, args] = exports.flattenApp(t);
        return `${showP(!isSimple(fn), fn)} ${args.map(t => showP(!isSimple(t), t)).join(' ')}`;
    }
    if (t.tag === 'Let')
        return `let ${t.name}${t.type ? ` : ${showP(t.type.tag === 'Let', t.type)}` : ''} = ${showP(t.val.tag === 'Let', t.val)}; ${exports.show(t.body)}`;
    return t;
};
exports.show = show;
const fromCore = (t, ns = list_1.Nil) => {
    if (t.tag === 'Var')
        return exports.Var(list_1.index(ns, t.index) || utils_1.impossible(`var out of scope in fromCore: ${t.index}`));
    if (t.tag === 'Type')
        return exports.Type;
    if (t.tag === 'App')
        return exports.App(exports.fromCore(t.fn, ns), exports.fromCore(t.arg, ns));
    if (t.tag === 'Pi') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Pi(x, exports.fromCore(t.type, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    if (t.tag === 'Abs') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Abs(x, exports.fromCore(t.type, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    if (t.tag === 'Let') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Let(x, exports.fromCore(t.type, ns), exports.fromCore(t.val, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    return t;
};
exports.fromCore = fromCore;
const showCore = (t, ns = list_1.Nil) => exports.show(exports.fromCore(t, ns));
exports.showCore = showCore;
const showVal = (v, k = 0, ns = list_1.Nil) => exports.show(exports.fromCore(values_1.quote(v, k), ns));
exports.showVal = showVal;

},{"./names":5,"./utils/list":9,"./utils/utils":10,"./values":11}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.last = exports.max = exports.contains = exports.range = exports.and = exports.zipWithR_ = exports.zipWith_ = exports.zipWithIndex = exports.zipWith = exports.foldlprim = exports.foldrprim = exports.foldl = exports.foldr = exports.lookup = exports.extend = exports.take = exports.indecesOf = exports.dropWhile = exports.takeWhile = exports.indexOfFn = exports.indexOf = exports.index = exports.mapIndex = exports.map = exports.consAll = exports.append = exports.toArrayFilter = exports.toArray = exports.reverse = exports.isEmpty = exports.length = exports.each = exports.first = exports.filter = exports.listToString = exports.tail = exports.head = exports.list = exports.listFrom = exports.Cons = exports.Nil = void 0;
exports.Nil = { tag: 'Nil' };
const Cons = (head, tail) => ({ tag: 'Cons', head, tail });
exports.Cons = Cons;
const listFrom = (a) => a.reduceRight((x, y) => exports.Cons(y, x), exports.Nil);
exports.listFrom = listFrom;
const list = (...a) => exports.listFrom(a);
exports.list = list;
const head = (l) => l.head;
exports.head = head;
const tail = (l) => l.tail;
exports.tail = tail;
const listToString = (l, fn = x => `${x}`) => {
    const r = [];
    let c = l;
    while (c.tag === 'Cons') {
        r.push(fn(c.head));
        c = c.tail;
    }
    return `[${r.join(', ')}]`;
};
exports.listToString = listToString;
const filter = (l, fn) => l.tag === 'Cons' ? (fn(l.head) ? exports.Cons(l.head, exports.filter(l.tail, fn)) : exports.filter(l.tail, fn)) : l;
exports.filter = filter;
const first = (l, fn) => {
    let c = l;
    while (c.tag === 'Cons') {
        if (fn(c.head))
            return c.head;
        c = c.tail;
    }
    return null;
};
exports.first = first;
const each = (l, fn) => {
    let c = l;
    while (c.tag === 'Cons') {
        fn(c.head);
        c = c.tail;
    }
};
exports.each = each;
const length = (l) => {
    let n = 0;
    let c = l;
    while (c.tag === 'Cons') {
        n++;
        c = c.tail;
    }
    return n;
};
exports.length = length;
const isEmpty = (l) => l.tag === 'Nil';
exports.isEmpty = isEmpty;
const reverse = (l) => exports.listFrom(exports.toArray(l, x => x).reverse());
exports.reverse = reverse;
const toArray = (l, fn) => {
    let c = l;
    const r = [];
    while (c.tag === 'Cons') {
        r.push(fn(c.head));
        c = c.tail;
    }
    return r;
};
exports.toArray = toArray;
const toArrayFilter = (l, m, f) => {
    const a = [];
    while (l.tag === 'Cons') {
        if (f(l.head))
            a.push(m(l.head));
        l = l.tail;
    }
    return a;
};
exports.toArrayFilter = toArrayFilter;
const append = (a, b) => a.tag === 'Cons' ? exports.Cons(a.head, exports.append(a.tail, b)) : b;
exports.append = append;
const consAll = (hs, b) => exports.append(exports.listFrom(hs), b);
exports.consAll = consAll;
const map = (l, fn) => l.tag === 'Cons' ? exports.Cons(fn(l.head), exports.map(l.tail, fn)) : l;
exports.map = map;
const mapIndex = (l, fn, i = 0) => l.tag === 'Cons' ? exports.Cons(fn(i, l.head), exports.mapIndex(l.tail, fn, i + 1)) : l;
exports.mapIndex = mapIndex;
const index = (l, i) => {
    while (l.tag === 'Cons') {
        if (i-- === 0)
            return l.head;
        l = l.tail;
    }
    return null;
};
exports.index = index;
const indexOf = (l, x) => {
    let i = 0;
    while (l.tag === 'Cons') {
        if (l.head === x)
            return i;
        l = l.tail;
        i++;
    }
    return -1;
};
exports.indexOf = indexOf;
const indexOfFn = (l, x) => {
    let i = 0;
    while (l.tag === 'Cons') {
        if (x(l.head))
            return i;
        l = l.tail;
        i++;
    }
    return -1;
};
exports.indexOfFn = indexOfFn;
const takeWhile = (l, fn) => l.tag === 'Cons' && fn(l.head) ? exports.Cons(l.head, exports.takeWhile(l.tail, fn)) : exports.Nil;
exports.takeWhile = takeWhile;
const dropWhile = (l, fn) => l.tag === 'Cons' && fn(l.head) ? exports.dropWhile(l.tail, fn) : l;
exports.dropWhile = dropWhile;
const indecesOf = (l, val) => {
    const a = [];
    let i = 0;
    while (l.tag === 'Cons') {
        if (l.head === val)
            a.push(i);
        l = l.tail;
        i++;
    }
    return a;
};
exports.indecesOf = indecesOf;
const take = (l, n) => n <= 0 || l.tag === 'Nil' ? exports.Nil : exports.Cons(l.head, exports.take(l.tail, n - 1));
exports.take = take;
const extend = (name, val, rest) => exports.Cons([name, val], rest);
exports.extend = extend;
const lookup = (l, name, eq = (x, y) => x === y) => {
    while (l.tag === 'Cons') {
        const h = l.head;
        if (eq(h[0], name))
            return h[1];
        l = l.tail;
    }
    return null;
};
exports.lookup = lookup;
const foldr = (f, i, l, j = 0) => l.tag === 'Nil' ? i : f(l.head, exports.foldr(f, i, l.tail, j + 1), j);
exports.foldr = foldr;
const foldl = (f, i, l) => l.tag === 'Nil' ? i : exports.foldl(f, f(i, l.head), l.tail);
exports.foldl = foldl;
const foldrprim = (f, i, l, ind = 0) => l.tag === 'Nil' ? i : f(l.head, exports.foldrprim(f, i, l.tail, ind + 1), l, ind);
exports.foldrprim = foldrprim;
const foldlprim = (f, i, l, ind = 0) => l.tag === 'Nil' ? i : exports.foldlprim(f, f(l.head, i, l, ind), l.tail, ind + 1);
exports.foldlprim = foldlprim;
const zipWith = (f, la, lb) => la.tag === 'Nil' || lb.tag === 'Nil' ? exports.Nil :
    exports.Cons(f(la.head, lb.head), exports.zipWith(f, la.tail, lb.tail));
exports.zipWith = zipWith;
const zipWithIndex = (f, la, lb, i = 0) => la.tag === 'Nil' || lb.tag === 'Nil' ? exports.Nil :
    exports.Cons(f(la.head, lb.head, i), exports.zipWithIndex(f, la.tail, lb.tail, i + 1));
exports.zipWithIndex = zipWithIndex;
const zipWith_ = (f, la, lb) => {
    if (la.tag === 'Cons' && lb.tag === 'Cons') {
        f(la.head, lb.head);
        exports.zipWith_(f, la.tail, lb.tail);
    }
};
exports.zipWith_ = zipWith_;
const zipWithR_ = (f, la, lb) => {
    if (la.tag === 'Cons' && lb.tag === 'Cons') {
        exports.zipWith_(f, la.tail, lb.tail);
        f(la.head, lb.head);
    }
};
exports.zipWithR_ = zipWithR_;
const and = (l) => l.tag === 'Nil' ? true : l.head && exports.and(l.tail);
exports.and = and;
const range = (n) => n <= 0 ? exports.Nil : exports.Cons(n - 1, exports.range(n - 1));
exports.range = range;
const contains = (l, v) => l.tag === 'Cons' ? (l.head === v || exports.contains(l.tail, v)) : false;
exports.contains = contains;
const max = (l) => exports.foldl((a, b) => b > a ? b : a, Number.MIN_SAFE_INTEGER, l);
exports.max = max;
const last = (l) => {
    let c = l;
    while (c.tag === 'Cons')
        if (c.tail.tag === 'Nil')
            return c.head;
    return null;
};
exports.last = last;

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eqArr = exports.mapObj = exports.tryTE = exports.tryT = exports.hasDuplicates = exports.range = exports.loadFile = exports.serr = exports.terr = exports.impossible = void 0;
const impossible = (msg) => {
    throw new Error(`impossible: ${msg}`);
};
exports.impossible = impossible;
const terr = (msg) => {
    throw new TypeError(msg);
};
exports.terr = terr;
const serr = (msg) => {
    throw new SyntaxError(msg);
};
exports.serr = serr;
const loadFile = (fn) => {
    if (typeof window === 'undefined') {
        return new Promise((resolve, reject) => {
            require('fs').readFile(fn, 'utf8', (err, data) => {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }
    else {
        return fetch(fn).then(r => r.text());
    }
};
exports.loadFile = loadFile;
const range = (n) => {
    const a = Array(n);
    for (let i = 0; i < n; i++)
        a[i] = i;
    return a;
};
exports.range = range;
const hasDuplicates = (x) => {
    const m = {};
    for (let i = 0; i < x.length; i++) {
        const y = `${x[i]}`;
        if (m[y])
            return true;
        m[y] = true;
    }
    return false;
};
exports.hasDuplicates = hasDuplicates;
const tryT = (v, e, throwErr = false) => {
    try {
        return v();
    }
    catch (err) {
        if (!(err instanceof TypeError))
            throw err;
        const r = e(err);
        if (throwErr)
            throw err;
        return r;
    }
};
exports.tryT = tryT;
const tryTE = (v) => exports.tryT(v, err => err);
exports.tryTE = tryTE;
const mapObj = (o, fn) => {
    const n = {};
    for (const k in o)
        n[k] = fn(o[k]);
    return n;
};
exports.mapObj = mapObj;
const eqArr = (a, b, eq = (x, y) => x === y) => {
    const l = a.length;
    if (b.length !== l)
        return false;
    for (let i = 0; i < l; i++)
        if (!eq(a[i], b[i]))
            return false;
    return true;
};
exports.eqArr = eqArr;

},{"fs":14}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.show = exports.normalize = exports.quote = exports.evaluate = exports.vapp = exports.vinst = exports.VVar = exports.VPi = exports.VAbs = exports.VNe = exports.VType = exports.EApp = exports.HVar = void 0;
const core_1 = require("./core");
const C = require("./core");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const HVar = (level) => ({ tag: 'HVar', level });
exports.HVar = HVar;
const EApp = (arg) => ({ tag: 'EApp', arg });
exports.EApp = EApp;
exports.VType = { tag: 'VType' };
const VNe = (head, spine) => ({ tag: 'VNe', head, spine });
exports.VNe = VNe;
const VAbs = (name, type, clos) => ({ tag: 'VAbs', name, type, clos });
exports.VAbs = VAbs;
const VPi = (name, type, clos) => ({ tag: 'VPi', name, type, clos });
exports.VPi = VPi;
const VVar = (level, spine = list_1.Nil) => exports.VNe(exports.HVar(level), spine);
exports.VVar = VVar;
const vinst = (val, arg) => val.clos(arg);
exports.vinst = vinst;
const vapp = (left, right) => {
    if (left.tag === 'VAbs')
        return exports.vinst(left, right);
    if (left.tag === 'VNe')
        return exports.VNe(left.head, list_1.Cons(exports.EApp(right), left.spine));
    return utils_1.impossible(`vapp: ${left.tag}`);
};
exports.vapp = vapp;
const evaluate = (t, vs) => {
    if (t.tag === 'Type')
        return exports.VType;
    if (t.tag === 'Abs')
        return exports.VAbs(t.name, exports.evaluate(t.type, vs), v => exports.evaluate(t.body, list_1.Cons(v, vs)));
    if (t.tag === 'Pi')
        return exports.VPi(t.name, exports.evaluate(t.type, vs), v => exports.evaluate(t.body, list_1.Cons(v, vs)));
    if (t.tag === 'Var')
        return list_1.index(vs, t.index) || utils_1.impossible(`evaluate: var ${t.index} has no value`);
    if (t.tag === 'App')
        return exports.vapp(exports.evaluate(t.fn, vs), exports.evaluate(t.arg, vs));
    if (t.tag === 'Let')
        return exports.evaluate(t.body, list_1.Cons(exports.evaluate(t.val, vs), vs));
    return t;
};
exports.evaluate = evaluate;
const quoteHead = (h, k) => {
    if (h.tag === 'HVar')
        return core_1.Var(k - (h.level + 1));
    return h.tag;
};
const quoteElim = (t, e, k) => {
    if (e.tag === 'EApp')
        return core_1.App(t, exports.quote(e.arg, k));
    return e.tag;
};
const quote = (v, k) => {
    if (v.tag === 'VType')
        return core_1.Type;
    if (v.tag === 'VNe')
        return list_1.foldr((x, y) => quoteElim(y, x, k), quoteHead(v.head, k), v.spine);
    if (v.tag === 'VAbs')
        return core_1.Abs(v.name, exports.quote(v.type, k), exports.quote(exports.vinst(v, exports.VVar(k)), k + 1));
    if (v.tag === 'VPi')
        return core_1.Pi(v.name, exports.quote(v.type, k), exports.quote(exports.vinst(v, exports.VVar(k)), k + 1));
    return v;
};
exports.quote = quote;
const normalize = (t, vs = list_1.Nil) => exports.quote(exports.evaluate(t, vs), 0);
exports.normalize = normalize;
const show = (v, k) => C.show(exports.quote(v, k));
exports.show = show;

},{"./core":3,"./utils/list":9,"./utils/utils":10}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.localExtend = exports.localEmpty = exports.Local = exports.EntryT = void 0;
const config_1 = require("./config");
const core_1 = require("./core");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const values_1 = require("./values");
const V = require("./values");
const conversion_1 = require("./conversion");
const EntryT = (type) => ({ type });
exports.EntryT = EntryT;
const indexT = (ts, ix) => {
    let l = ts;
    let i = 0;
    while (l.tag === 'Cons') {
        if (ix === 0)
            return [l.head, i];
        i++;
        ix--;
        l = l.tail;
    }
    return null;
};
const Local = (level, ts, vs) => ({ level, ts, vs });
exports.Local = Local;
exports.localEmpty = exports.Local(0, list_1.Nil, list_1.Nil);
const localExtend = (local, ty, val = values_1.VVar(local.level)) => exports.Local(local.level + 1, list_1.Cons(exports.EntryT(ty), local.ts), list_1.Cons(val, local.vs));
exports.localExtend = localExtend;
const showVal = (local, val) => V.show(val, local.level);
const check = (local, tm, ty) => {
    config_1.log(() => `check ${core_1.show(tm)} : ${showVal(local, ty)}`);
    const ty2 = synth(local, tm);
    return utils_1.tryT(() => {
        config_1.log(() => `unify ${showVal(local, ty2)} ~ ${showVal(local, ty)}`);
        conversion_1.conv(local.level, ty2, ty);
        return;
    }, e => utils_1.terr(`check failed (${core_1.show(tm)}): ${showVal(local, ty2)} ~ ${showVal(local, ty)}: ${e}`));
};
const synth = (local, tm) => {
    config_1.log(() => `synth ${core_1.show(tm)}`);
    if (tm.tag === 'Type')
        return values_1.VType;
    if (tm.tag === 'Var') {
        const [entry] = indexT(local.ts, tm.index) || utils_1.terr(`var out of scope ${core_1.show(tm)}`);
        return entry.type;
    }
    if (tm.tag === 'App') {
        const fnty = synth(local, tm.fn);
        const rty = synthapp(local, fnty, tm.arg);
        return rty;
    }
    if (tm.tag === 'Abs') {
        check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(tm.type, local.vs);
        const rty = synth(exports.localExtend(local, ty), tm.body);
        const pi = values_1.evaluate(core_1.Pi(tm.name, tm.type, values_1.quote(rty, local.level + 1)), local.vs);
        return pi;
    }
    if (tm.tag === 'Pi') {
        check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(tm.type, local.vs);
        check(exports.localExtend(local, ty), tm.body, values_1.VType);
        return values_1.VType;
    }
    if (tm.tag === 'Let') {
        check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(tm.type, local.vs);
        check(local, tm.val, ty);
        const v = values_1.evaluate(tm.val, local.vs);
        const rty = synth(exports.localExtend(local, ty, v), tm.body);
        return rty;
    }
    return utils_1.terr(`unable to synth ${core_1.show(tm)}`);
};
const synthapp = (local, ty, arg) => {
    config_1.log(() => `synthapp ${showVal(local, ty)} @ ${core_1.show(arg)}`);
    if (ty.tag === 'VPi') {
        const cty = ty.type;
        check(local, arg, cty);
        const v = values_1.evaluate(arg, local.vs);
        return values_1.vinst(ty, v);
    }
    return utils_1.terr(`not a correct pi type in synthapp: ${showVal(local, ty)} @ ${core_1.show(arg)}`);
};
const verify = (t, local = exports.localEmpty) => {
    const vty = synth(local, t);
    const ty = values_1.quote(vty, 0);
    return ty;
};
exports.verify = verify;

},{"./config":1,"./conversion":2,"./core":3,"./utils/list":9,"./utils/utils":10,"./values":11}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repl_1 = require("./repl");
var hist = [], index = -1;
var input = document.getElementById('input');
var content = document.getElementById('content');
function onresize() {
    content.style.height = window.innerHeight;
}
window.addEventListener('resize', onresize);
onresize();
addResult('qtt-ts repl');
repl_1.initREPL();
input.focus();
input.onkeydown = function (keyEvent) {
    var val = input.value;
    var txt = (val || '').trim();
    if (keyEvent.keyCode === 13) {
        keyEvent.preventDefault();
        if (txt) {
            hist.push(val);
            index = hist.length;
            input.value = '';
            var div = document.createElement('div');
            div.innerHTML = val;
            div.className = 'line input';
            content.insertBefore(div, input);
            repl_1.runREPL(txt, addResult);
        }
    }
    else if (keyEvent.keyCode === 38 && index > 0) {
        keyEvent.preventDefault();
        input.value = hist[--index];
    }
    else if (keyEvent.keyCode === 40 && index < hist.length - 1) {
        keyEvent.preventDefault();
        input.value = hist[++index];
    }
    else if (keyEvent.keyCode === 40 && keyEvent.ctrlKey && index >= hist.length - 1) {
        index = hist.length;
        input.value = '';
    }
};
function addResult(msg, err) {
    var divout = document.createElement('pre');
    divout.className = 'line output';
    if (err)
        divout.className += ' error';
    divout.innerHTML = '' + msg;
    content.insertBefore(divout, input);
    input.focus();
    content.scrollTop = content.scrollHeight;
    return divout;
}

},{"./repl":7}],14:[function(require,module,exports){

},{}]},{},[13]);
