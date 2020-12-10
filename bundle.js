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
    if (a.tag === 'VPi' && b.tag === 'VPi' && a.usage === b.usage) {
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

},{"./config":1,"./utils/list":11,"./utils/utils":12,"./values":13}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.show = exports.flattenApp = exports.flattenAbs = exports.flattenPi = exports.Let = exports.App = exports.Abs = exports.Pi = exports.Var = exports.Type = void 0;
const usage_1 = require("./usage");
exports.Type = { tag: 'Type' };
const Var = (index) => ({ tag: 'Var', index });
exports.Var = Var;
const Pi = (usage, name, type, body) => ({ tag: 'Pi', usage, name, type, body });
exports.Pi = Pi;
const Abs = (usage, name, type, body) => ({ tag: 'Abs', usage, name, type, body });
exports.Abs = Abs;
const App = (fn, arg) => ({ tag: 'App', fn, arg });
exports.App = App;
const Let = (usage, name, type, val, body) => ({ tag: 'Let', usage, name, type, val, body });
exports.Let = Let;
const flattenPi = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Pi') {
        params.push([c.usage, c.name, c.type]);
        c = c.body;
    }
    return [params, c];
};
exports.flattenPi = flattenPi;
const flattenAbs = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Abs') {
        params.push([c.usage, c.name, c.type]);
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
        return `${params.map(([u, x, t]) => u === usage_1.UsageRig.default && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Let', t) : `(${u === usage_1.UsageRig.default ? '' : `${u} `}${x} : ${exports.show(t)})`).join(' -> ')} -> ${exports.show(ret)}`;
    }
    if (t.tag === 'Abs') {
        const [params, body] = exports.flattenAbs(t);
        return `\\${params.map(([u, x, t]) => `(${u === usage_1.UsageRig.default ? '' : `${u} `}${x} : ${exports.show(t)})`).join(' ')}. ${exports.show(body)}`;
    }
    if (t.tag === 'App') {
        const [fn, args] = exports.flattenApp(t);
        return `${showP(!isSimple(fn), fn)} ${args.map(t => showP(!isSimple(t), t)).join(' ')}`;
    }
    if (t.tag === 'Let')
        return `let ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${t.name} : ${showP(t.type.tag === 'Let', t.type)} = ${showP(t.val.tag === 'Let', t.val)}; ${exports.show(t.body)}`;
    return t;
};
exports.show = show;

},{"./usage":10}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elaborate = exports.unsafeLocalPop = exports.localExtend = exports.localEmpty = exports.Local = exports.EntryT = void 0;
const config_1 = require("./config");
const core_1 = require("./core");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const values_1 = require("./values");
const S = require("./surface");
const surface_1 = require("./surface");
const conversion_1 = require("./conversion");
const usage_1 = require("./usage");
const EntryT = (type, usage) => ({ type, usage });
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
const localExtend = (local, name, ty, usage, val = values_1.VVar(local.level)) => exports.Local(local.level + 1, list_1.Cons(name, local.ns), list_1.Cons(exports.EntryT(ty, usage), local.ts), list_1.Cons(val, local.vs));
exports.localExtend = localExtend;
const unsafeLocalPop = (local) => exports.Local(local.level - 1, local.ns.tail, local.ts.tail, local.vs.tail);
exports.unsafeLocalPop = unsafeLocalPop;
const showVal = (local, val) => S.showVal(val, local.level, local.ns);
const check = (local, tm, ty) => {
    config_1.log(() => `check ${surface_1.show(tm)} : ${showVal(local, ty)}`);
    if (tm.tag === 'Type' && ty.tag === 'VType')
        return [core_1.Type, usage_1.noUses(local.level)];
    if (tm.tag === 'Abs' && !tm.type && ty.tag === 'VPi') {
        const v = values_1.VVar(local.level);
        const x = tm.name;
        const [body, u] = check(exports.localExtend(local, x, ty.type, ty.usage, v), tm.body, values_1.vinst(ty, v));
        const [ux, urest] = list_1.uncons(u);
        if (!usage_1.UsageRig.sub(ux, ty.usage))
            return utils_1.terr(`usage error in ${surface_1.show(tm)}: expected ${ty.usage} for ${x} but actual ${ux}`);
        return [core_1.Abs(ty.usage, x, values_1.quote(ty.type, local.level), body), urest];
    }
    if (tm.tag === 'Let') {
        let vtype;
        let vty;
        let val;
        let uv;
        if (tm.type) {
            [vtype] = check(local, tm.type, values_1.VType);
            vty = values_1.evaluate(vtype, local.vs);
            [val, uv] = check(local, tm.val, ty);
        }
        else {
            [val, vty, uv] = synth(local, tm.val);
            vtype = values_1.quote(vty, local.level);
        }
        const v = values_1.evaluate(val, local.vs);
        const [body, ub] = check(exports.localExtend(local, tm.name, vty, tm.usage, v), tm.body, ty);
        const [ux, urest] = list_1.uncons(ub);
        if (!usage_1.UsageRig.sub(ux, tm.usage))
            return utils_1.terr(`usage error in ${surface_1.show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
        return [core_1.Let(tm.usage, tm.name, vtype, val, body), usage_1.addUses(usage_1.multiplyUses(ux, uv), urest)];
    }
    const [term, ty2, uses] = synth(local, tm);
    return utils_1.tryT(() => {
        config_1.log(() => `unify ${showVal(local, ty2)} ~ ${showVal(local, ty)}`);
        conversion_1.conv(local.level, ty2, ty);
        return [term, uses];
    }, e => utils_1.terr(`check failed (${surface_1.show(tm)}): ${showVal(local, ty2)} ~ ${showVal(local, ty)}: ${e}`));
};
const synth = (local, tm) => {
    config_1.log(() => `synth ${surface_1.show(tm)}`);
    if (tm.tag === 'Type')
        return [core_1.Type, values_1.VType, usage_1.noUses(local.level)];
    if (tm.tag === 'Var') {
        const i = list_1.indexOf(local.ns, tm.name);
        if (i < 0)
            return utils_1.terr(`undefined var ${tm.name}`);
        else {
            const [entry, j] = indexT(local.ts, i) || utils_1.terr(`var out of scope ${surface_1.show(tm)}`);
            const uses = list_1.updateAt(usage_1.noUses(local.level), j, _ => usage_1.UsageRig.one);
            return [core_1.Var(j), entry.type, uses];
        }
    }
    if (tm.tag === 'App') {
        const [fntm, fnty, fnu] = synth(local, tm.fn);
        const [argtm, rty, fnarg] = synthapp(local, fnty, tm.arg);
        return [core_1.App(fntm, argtm), rty, usage_1.addUses(fnu, fnarg)];
    }
    if (tm.tag === 'Abs') {
        if (tm.type) {
            const [type] = check(local, tm.type, values_1.VType);
            const ty = values_1.evaluate(type, local.vs);
            const [body, rty, u] = synth(exports.localExtend(local, tm.name, ty, tm.usage), tm.body);
            const pi = values_1.evaluate(core_1.Pi(tm.usage, tm.name, type, values_1.quote(rty, local.level + 1)), local.vs);
            const [ux, urest] = list_1.uncons(u);
            if (!usage_1.UsageRig.sub(ux, tm.usage))
                return utils_1.terr(`usage error in ${surface_1.show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
            return [core_1.Abs(tm.usage, tm.name, type, body), pi, urest];
        }
        else
            utils_1.terr(`cannot synth unannotated lambda: ${surface_1.show(tm)}`);
    }
    if (tm.tag === 'Pi') {
        const [type, u1] = check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(type, local.vs);
        const [body, u2] = check(exports.localExtend(local, tm.name, ty, '0'), tm.body, values_1.VType);
        const [, urest] = list_1.uncons(u2);
        return [core_1.Pi(tm.usage, tm.name, type, body), values_1.VType, usage_1.addUses(u1, urest)];
    }
    if (tm.tag === 'Let') {
        let type;
        let ty;
        let val;
        let uv;
        if (tm.type) {
            [type] = check(local, tm.type, values_1.VType);
            ty = values_1.evaluate(type, local.vs);
            [val, uv] = check(local, tm.val, ty);
        }
        else {
            [val, ty, uv] = synth(local, tm.val);
            type = values_1.quote(ty, local.level);
        }
        const v = values_1.evaluate(val, local.vs);
        const [body, rty, ub] = synth(exports.localExtend(local, tm.name, ty, tm.usage, v), tm.body);
        const [ux, urest] = list_1.uncons(ub);
        if (!usage_1.UsageRig.sub(ux, tm.usage))
            return utils_1.terr(`usage error in ${surface_1.show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
        return [core_1.Let(tm.usage, tm.name, type, val, body), rty, usage_1.addUses(usage_1.multiplyUses(ux, uv), urest)];
    }
    return utils_1.terr(`unable to synth ${surface_1.show(tm)}`);
};
const synthapp = (local, ty, arg) => {
    config_1.log(() => `synthapp ${showVal(local, ty)} @ ${surface_1.show(arg)}`);
    if (ty.tag === 'VPi') {
        const cty = ty.type;
        const [term, uses] = check(local, arg, cty);
        const v = values_1.evaluate(term, local.vs);
        return [term, values_1.vinst(ty, v), usage_1.multiplyUses(ty.usage, uses)];
    }
    return utils_1.terr(`not a correct pi type in synthapp: ${showVal(local, ty)} @ ${surface_1.show(arg)}`);
};
const elaborate = (t, local = exports.localEmpty) => {
    const [tm, vty] = synth(local, t);
    const ty = values_1.quote(vty, 0);
    return [tm, ty];
};
exports.elaborate = elaborate;

},{"./config":1,"./conversion":2,"./core":3,"./surface":9,"./usage":10,"./utils/list":11,"./utils/utils":12,"./values":13}],5:[function(require,module,exports){
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

},{"./utils/list":11}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const utils_1 = require("./utils/utils");
const surface_1 = require("./surface");
const config_1 = require("./config");
const usage_1 = require("./usage");
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
const SYM1 = ['\\', ':', '=', ';', '*'];
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
            if (!/[0-9a-z\+\-]/i.test(c)) {
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
const usage = (t) => {
    if (t.tag === 'Name' && usage_1.Usage.includes(t.name))
        return t.name;
    if (t.tag === 'Num' && usage_1.Usage.includes(t.num))
        return t.num;
    return null;
};
const lambdaParams = (t, fromRepl) => {
    if (t.tag === 'Name')
        return [[usage_1.UsageRig.default, t.name, false, null]];
    if (t.tag === 'List') {
        const impl = t.bracket === '{';
        const a = t.list;
        if (a.length === 0)
            return [[usage_1.UsageRig.default, '_', impl, tunit]];
        const i = a.findIndex(v => v.tag === 'Name' && v.name === ':');
        if (i === -1)
            return isNames(a).map(x => [usage_1.UsageRig.default, x, impl, null]);
        let start = 0;
        const n = a[0];
        const pu = usage(n);
        let u = usage_1.UsageRig.default;
        if (pu !== null) {
            u = pu;
            start = 1;
        }
        const ns = a.slice(start, i);
        const rest = a.slice(i + 1);
        const ty = exprs(rest, '(', fromRepl);
        return isNames(ns).map(x => [u, x, impl, ty]);
    }
    return utils_1.serr(`invalid lambda param`);
};
const piParams = (t, fromRepl) => {
    if (t.tag === 'Name')
        return [[usage_1.UsageRig.default, '_', false, expr(t, fromRepl)[0]]];
    if (t.tag === 'List') {
        const impl = t.bracket === '{';
        const a = t.list;
        if (a.length === 0)
            return [[usage_1.UsageRig.default, '_', impl, tunit]];
        const i = a.findIndex(v => v.tag === 'Name' && v.name === ':');
        if (i === -1)
            return [[usage_1.UsageRig.default, '_', impl, expr(t, fromRepl)[0]]];
        let start = 0;
        const n = a[0];
        const pu = usage(n);
        let u = usage_1.UsageRig.default;
        if (pu !== null) {
            u = pu;
            start = 1;
        }
        const ns = a.slice(start, i);
        const rest = a.slice(i + 1);
        const ty = exprs(rest, '(', fromRepl);
        return isNames(ns).map(x => [u, x, impl, ty]);
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
const numToNat = (n, orig) => {
    if (isNaN(n))
        return utils_1.serr(`invalid nat number: ${orig}`);
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
        return [s.reduce((t, n) => surface_1.App(surface_1.App(Cons, numToNat(n, '<codepoint>')), t), Nil), false];
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
            return [numToNat(+t.num.slice(0, -1), t.num), false];
        }
        else {
            return [numToNat(+t.num, t.num), false];
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
        let x = ts[1];
        let j = 2;
        const pu = usage(x);
        let u = usage_1.UsageRig.default;
        if (pu !== null) {
            u = pu;
            x = ts[2];
            j = 3;
        }
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
        if (!found) {
            if (!fromRepl)
                return utils_1.serr(`no ; after let`);
            return surface_1.Let(u, name, ty || null, val, null);
        }
        const body = exprs(ts.slice(i + 1), '(', fromRepl);
        return surface_1.Let(u, name, ty || null, val, body);
    }
    const i = ts.findIndex(x => isName(x, ':'));
    if (i >= 0) {
        const a = ts.slice(0, i);
        const b = ts.slice(i + 1);
        return surface_1.Let(usage_1.UsageRig.default, 'x', exprs(b, '(', fromRepl), exprs(a, '(', fromRepl), surface_1.Var('x'));
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
        return args.reduceRight((x, [u, name, , ty]) => surface_1.Abs(u, name, ty, x), body);
    }
    const j = ts.findIndex(x => isName(x, '->'));
    if (j >= 0) {
        const s = splitTokens(ts, x => isName(x, '->'));
        if (s.length < 2)
            return utils_1.serr(`parsing failed with ->`);
        const args = s.slice(0, -1)
            .map(p => p.length === 1 ? piParams(p[0], fromRepl) : [[usage_1.UsageRig.default, '_', false, exprs(p, '(', fromRepl)]])
            .reduce((x, y) => x.concat(y), []);
        const body = exprs(s[s.length - 1], '(', fromRepl);
        return args.reduceRight((x, [u, name, , ty]) => surface_1.Pi(u, name, ty, x), body);
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

},{"./config":1,"./surface":9,"./usage":10,"./utils/utils":12}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fiveLinear = exports.FiveLin = exports.linear = exports.Lin = exports.bool2 = exports.Bool2 = exports.bool = exports.Bool = exports.trivial = exports.Triv = exports.lubUsesRig = exports.multiplyUsesRig = exports.addUsesRig = exports.noUsesRig = void 0;
const list_1 = require("./utils/list");
const noUsesRig = (rig, size) => list_1.map(list_1.range(size), () => rig.zero);
exports.noUsesRig = noUsesRig;
const addUsesRig = (rig, a, b) => list_1.zipWith(rig.add, a, b);
exports.addUsesRig = addUsesRig;
const multiplyUsesRig = (rig, a, b) => list_1.map(b, x => rig.multiply(a, x));
exports.multiplyUsesRig = multiplyUsesRig;
const lubUsesRig = (rig, a, b) => {
    const l = list_1.zipWith(rig.lub, a, b);
    return list_1.and(list_1.map(l, x => x !== null)) ? l : null;
};
exports.lubUsesRig = lubUsesRig;
exports.Triv = ['1'];
exports.trivial = {
    zero: '1',
    one: '1',
    default: '1',
    add(_a, _b) { return '1'; },
    multiply(_a, _b) { return '1'; },
    sub(_a, _b) { return true; },
    lub(_a, _b) { return '1'; },
};
exports.Bool = ['0', '*'];
exports.bool = {
    zero: '0',
    one: '*',
    default: '*',
    add(a, b) { return (a === '*') || (b === '*') ? '*' : '0'; },
    multiply(a, b) { return (a === '*') && (b === '*') ? '*' : '0'; },
    sub(a, b) { return a === b || a === '0'; },
    lub(a, b) { return a === b ? a : '*'; },
};
exports.Bool2 = ['0', '1'];
exports.bool2 = {
    zero: '0',
    one: '1',
    default: '1',
    add(a, b) { return (a === '1') || (b === '1') ? '1' : '0'; },
    multiply(a, b) { return (a === '1') && (b === '1') ? '1' : '0'; },
    sub(a, b) { return a === b; },
    lub(a, b) { return a === b ? a : null; },
};
exports.Lin = ['0', '1', '*'];
exports.linear = {
    zero: '0',
    one: '1',
    default: '*',
    add(a, b) {
        if (a === '*' || b === '*')
            return '*';
        if (a === '1' && b === '1')
            return '*';
        if (a === '1' || b === '1')
            return '1';
        return '0';
    },
    multiply(a, b) {
        if (a === '0' || b === '0')
            return '0';
        if (a === '1')
            return b;
        if (b === '1')
            return a;
        return '*';
    },
    sub(a, b) {
        if (a === b)
            return true;
        if (a === '0' && b === '*')
            return true;
        if (a === '1' && b === '*')
            return true;
        return false;
    },
    lub(a, b) {
        if (a === b)
            return a;
        return '*';
    },
};
exports.FiveLin = ['0', '1-', '1', '1+', '*'];
exports.fiveLinear = {
    zero: '0',
    one: '1',
    default: '*',
    add(a, b) {
        /*
        +  0  1-  1  1+  *
        0  0  1-  1  *   *
        1- 1- *   *  *   *
        1  1  *   *  1+  *
        1+ *  *   1+ 1+  *
        *  *  *   *  *   *
        */
        if (a === '*' || b === '*')
            return '*';
        if (a === '1' && b === '1')
            return '*';
        if (a === '1-' && b === '1-')
            return '*';
        if (a === '1+' && b === '0')
            return '*';
        if (a === '0' && b === '1+')
            return '*';
        if (a === '1-' && b === '1+')
            return '*';
        if (a === '1+' && b === '1-')
            return '*';
        if (a === '1' && b === '1-')
            return '*';
        if (a === '1-' && b === '1')
            return '*';
        if (a === '0' && b === '0')
            return '0';
        if (a === '1' && b === '0')
            return '1';
        if (a === '0' && b === '1')
            return '1';
        if (a === '1-' && b === '0')
            return '1-';
        if (a === '0' && b === '1-')
            return '1-';
        if (a === '1+' && b === '1')
            return '1+';
        if (a === '1' && b === '1+')
            return '1+';
        return '0';
    },
    multiply(a, b) {
        /*
        *  0  1-  1  1+  *
        0  0  0   0  0   0
        1- 0  1-  1- *   *
        1  0  1-  1  1+  *
        1+ 0  *   1+ 1+  *
        *  0  *   *  *   *
        */
        if (a === '0' || b === '0')
            return '0';
        if (a === '1')
            return b;
        if (b === '1')
            return a;
        if (a === '1-' && b === '1-')
            return '1-';
        if (a === '1+' && b === '1+')
            return '1+';
        if (a === '1+' && b === '1-')
            return '*';
        if (a === '1-' && b === '1+')
            return '*';
        return '*';
    },
    sub(a, b) {
        /*
        0  1-
        0  *
        1- *
        1  1-
        1  1+
        1  *
        1+ *
        */
        if (a === b)
            return true;
        if (a === '0' && b === '1-')
            return true;
        if (a === '0' && b === '*')
            return true;
        if (a === '1-' && b === '*')
            return true;
        if (a === '1' && b === '1-')
            return true;
        if (a === '1' && b === '1+')
            return true;
        if (a === '1' && b === '*')
            return true;
        if (a === '1+' && b === '*')
            return true;
        return false;
    },
    lub(a, b) {
        /*
        0  1-  1-
        1- 1   1-
        1  1+  1+
        _  _   *
        */
        if (a === b)
            return a;
        if ((a === '0' && b === '1-') || (a === '1-' && b === '0'))
            return '1-';
        if ((a === '1' && b === '1-') || (a === '1' && b === '1-'))
            return '1-';
        if ((a === '1' && b === '1+') || (a === '1+' && b === '1'))
            return '1+';
        return '*';
    },
};

},{"./utils/list":11}],8:[function(require,module,exports){
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
[:undoDef] undo last def
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
            return cb(defs.map(([u, x, t, v]) => `let ${u === '*' ? '' : `${u} `}${x}${t ? ` : ${surface_1.show(t)}` : ''} = ${surface_1.show(v)}`).join('\n'));
        if (s === ':clear') {
            defs = [];
            elocal = Elab.localEmpty;
            vlocal = Verif.localEmpty;
            return cb(`cleared definitions`);
        }
        if (s === ':undoDef') {
            if (defs.length > 0) {
                const [u, x, t, v] = defs.pop();
                elocal = Elab.unsafeLocalPop(elocal);
                vlocal = Verif.unsafeLocalPop(vlocal);
                return cb(`undid let ${u === '*' ? '' : `${u} `}${x}${t ? ` : ${surface_1.show(t)}` : ''} = ${surface_1.show(v)}`);
            }
            cb(`no def to undo`);
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
            term = surface_1.Let(term.usage, term.name, term.type, term.val, surface_1.Var(term.name));
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
            defs.push([term.usage, term.name, term.type, term.val]);
            elocal = Elab.localExtend(elocal, term.name, values_1.evaluate(etype, elocal.vs), term.usage, values_1.evaluate(eterm, elocal.vs));
            vlocal = Verif.localExtend(vlocal, values_1.evaluate(verifty, vlocal.vs), term.usage, values_1.evaluate(eterm, vlocal.vs));
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

},{"./config":1,"./core":3,"./elaboration":4,"./parser":6,"./surface":9,"./values":13,"./verification":14}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showVal = exports.showCore = exports.fromCore = exports.show = exports.flattenApp = exports.flattenAbs = exports.flattenPi = exports.Let = exports.App = exports.Abs = exports.Pi = exports.Var = exports.Type = void 0;
const names_1 = require("./names");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const values_1 = require("./values");
const usage_1 = require("./usage");
exports.Type = { tag: 'Type' };
const Var = (name) => ({ tag: 'Var', name });
exports.Var = Var;
const Pi = (usage, name, type, body) => ({ tag: 'Pi', usage, name, type, body });
exports.Pi = Pi;
const Abs = (usage, name, type, body) => ({ tag: 'Abs', usage, name, type, body });
exports.Abs = Abs;
const App = (fn, arg) => ({ tag: 'App', fn, arg });
exports.App = App;
const Let = (usage, name, type, val, body) => ({ tag: 'Let', usage, name, type, val, body });
exports.Let = Let;
const flattenPi = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Pi') {
        params.push([c.usage, c.name, c.type]);
        c = c.body;
    }
    return [params, c];
};
exports.flattenPi = flattenPi;
const flattenAbs = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Abs') {
        params.push([c.usage, c.name, c.type]);
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
        return `${params.map(([u, x, t]) => u === usage_1.UsageRig.default && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Let', t) : `(${u === usage_1.UsageRig.default ? '' : `${u} `}${x} : ${exports.show(t)})`).join(' -> ')} -> ${exports.show(ret)}`;
    }
    if (t.tag === 'Abs') {
        const [params, body] = exports.flattenAbs(t);
        return `\\${params.map(([u, x, t]) => t ? `(${u === usage_1.UsageRig.default ? '' : `${u} `}${x} : ${exports.show(t)})` : x).join(' ')}. ${exports.show(body)}`;
    }
    if (t.tag === 'App') {
        const [fn, args] = exports.flattenApp(t);
        return `${showP(!isSimple(fn), fn)} ${args.map(t => showP(!isSimple(t), t)).join(' ')}`;
    }
    if (t.tag === 'Let')
        return `let ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${t.name}${t.type ? ` : ${showP(t.type.tag === 'Let', t.type)}` : ''} = ${showP(t.val.tag === 'Let', t.val)}; ${exports.show(t.body)}`;
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
        return exports.Pi(t.usage, x, exports.fromCore(t.type, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    if (t.tag === 'Abs') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Abs(t.usage, x, exports.fromCore(t.type, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    if (t.tag === 'Let') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Let(t.usage, x, exports.fromCore(t.type, ns), exports.fromCore(t.val, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    return t;
};
exports.fromCore = fromCore;
const showCore = (t, ns = list_1.Nil) => exports.show(exports.fromCore(t, ns));
exports.showCore = showCore;
const showVal = (v, k = 0, ns = list_1.Nil) => exports.show(exports.fromCore(values_1.quote(v, k), ns));
exports.showVal = showVal;

},{"./names":5,"./usage":10,"./utils/list":11,"./utils/utils":12,"./values":13}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lubUses = exports.multiplyUses = exports.addUses = exports.noUses = exports.UsageRig = exports.Usage = void 0;
const porig_1 = require("./porig");
exports.Usage = porig_1.FiveLin;
exports.UsageRig = porig_1.fiveLinear;
const noUses = (size) => porig_1.noUsesRig(exports.UsageRig, size);
exports.noUses = noUses;
const addUses = (a, b) => porig_1.addUsesRig(exports.UsageRig, a, b);
exports.addUses = addUses;
const multiplyUses = (a, b) => porig_1.multiplyUsesRig(exports.UsageRig, a, b);
exports.multiplyUses = multiplyUses;
const lubUses = (a, b) => porig_1.lubUsesRig(exports.UsageRig, a, b);
exports.lubUses = lubUses;

},{"./porig":7}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.last = exports.max = exports.contains = exports.range = exports.and = exports.zipWithR_ = exports.zipWith_ = exports.zipWithIndex = exports.zipWith = exports.foldlprim = exports.foldrprim = exports.foldl = exports.foldr = exports.lookup = exports.extend = exports.take = exports.indecesOf = exports.dropWhile = exports.takeWhile = exports.updateAt = exports.indexOfFn = exports.indexOf = exports.index = exports.mapIndex = exports.map = exports.consAll = exports.append = exports.toArrayFilter = exports.toArray = exports.reverse = exports.isEmpty = exports.length = exports.each = exports.first = exports.filter = exports.listToString = exports.uncons = exports.tail = exports.head = exports.list = exports.listFrom = exports.Cons = exports.Nil = void 0;
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
const uncons = (l) => {
    const x = l;
    return [x.head, x.tail];
};
exports.uncons = uncons;
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
const updateAt = (l, i, fn) => l.tag === 'Nil' ? l : i <= 0 ? exports.Cons(fn(l.head), l.tail) : exports.Cons(l.head, exports.updateAt(l.tail, i - 1, fn));
exports.updateAt = updateAt;
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

},{}],12:[function(require,module,exports){
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

},{"fs":16}],13:[function(require,module,exports){
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
const VAbs = (usage, name, type, clos) => ({ tag: 'VAbs', usage, name, type, clos });
exports.VAbs = VAbs;
const VPi = (usage, name, type, clos) => ({ tag: 'VPi', usage, name, type, clos });
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
        return exports.VAbs(t.usage, t.name, exports.evaluate(t.type, vs), v => exports.evaluate(t.body, list_1.Cons(v, vs)));
    if (t.tag === 'Pi')
        return exports.VPi(t.usage, t.name, exports.evaluate(t.type, vs), v => exports.evaluate(t.body, list_1.Cons(v, vs)));
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
        return core_1.Abs(v.usage, v.name, exports.quote(v.type, k), exports.quote(exports.vinst(v, exports.VVar(k)), k + 1));
    if (v.tag === 'VPi')
        return core_1.Pi(v.usage, v.name, exports.quote(v.type, k), exports.quote(exports.vinst(v, exports.VVar(k)), k + 1));
    return v;
};
exports.quote = quote;
const normalize = (t, vs = list_1.Nil) => exports.quote(exports.evaluate(t, vs), 0);
exports.normalize = normalize;
const show = (v, k) => C.show(exports.quote(v, k));
exports.show = show;

},{"./core":3,"./utils/list":11,"./utils/utils":12}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.unsafeLocalPop = exports.localExtend = exports.localEmpty = exports.Local = exports.EntryT = void 0;
const config_1 = require("./config");
const core_1 = require("./core");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const values_1 = require("./values");
const V = require("./values");
const conversion_1 = require("./conversion");
const usage_1 = require("./usage");
const EntryT = (type, usage) => ({ type, usage });
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
const localExtend = (local, ty, usage, val = values_1.VVar(local.level)) => exports.Local(local.level + 1, list_1.Cons(exports.EntryT(ty, usage), local.ts), list_1.Cons(val, local.vs));
exports.localExtend = localExtend;
const unsafeLocalPop = (local) => exports.Local(local.level - 1, local.ts.tail, local.vs.tail);
exports.unsafeLocalPop = unsafeLocalPop;
const showVal = (local, val) => V.show(val, local.level);
const check = (local, tm, ty) => {
    config_1.log(() => `check ${core_1.show(tm)} : ${showVal(local, ty)}`);
    const [ty2, u] = synth(local, tm);
    return utils_1.tryT(() => {
        config_1.log(() => `unify ${showVal(local, ty2)} ~ ${showVal(local, ty)}`);
        conversion_1.conv(local.level, ty2, ty);
        return u;
    }, e => utils_1.terr(`check failed (${core_1.show(tm)}): ${showVal(local, ty2)} ~ ${showVal(local, ty)}: ${e}`));
};
const synth = (local, tm) => {
    config_1.log(() => `synth ${core_1.show(tm)}`);
    if (tm.tag === 'Type')
        return [values_1.VType, usage_1.noUses(local.level)];
    if (tm.tag === 'Var') {
        const [entry, j] = indexT(local.ts, tm.index) || utils_1.terr(`var out of scope ${core_1.show(tm)}`);
        const uses = list_1.updateAt(usage_1.noUses(local.level), j, _ => usage_1.UsageRig.one);
        return [entry.type, uses];
    }
    if (tm.tag === 'App') {
        const [fnty, fnu] = synth(local, tm.fn);
        const [rty, argu] = synthapp(local, fnty, tm.arg);
        return [rty, usage_1.addUses(fnu, argu)];
    }
    if (tm.tag === 'Abs') {
        check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(tm.type, local.vs);
        const [rty, u] = synth(exports.localExtend(local, ty, tm.usage), tm.body);
        const pi = values_1.evaluate(core_1.Pi(tm.usage, tm.name, tm.type, values_1.quote(rty, local.level + 1)), local.vs);
        const [ux, urest] = list_1.uncons(u);
        if (!usage_1.UsageRig.sub(ux, tm.usage))
            return utils_1.terr(`usage error in ${core_1.show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
        return [pi, urest];
    }
    if (tm.tag === 'Pi') {
        const u1 = check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(tm.type, local.vs);
        const u2 = check(exports.localExtend(local, ty, usage_1.UsageRig.default), tm.body, values_1.VType);
        const [, urest] = list_1.uncons(u2);
        return [values_1.VType, usage_1.addUses(u1, urest)];
    }
    if (tm.tag === 'Let') {
        check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(tm.type, local.vs);
        const uv = check(local, tm.val, ty);
        const v = values_1.evaluate(tm.val, local.vs);
        const [rty, ub] = synth(exports.localExtend(local, ty, tm.usage, v), tm.body);
        const [ux, urest] = list_1.uncons(ub);
        if (!usage_1.UsageRig.sub(ux, tm.usage))
            return utils_1.terr(`usage error in ${core_1.show(tm)}: expected ${tm.usage} for ${tm.name} but actual ${ux}`);
        return [rty, usage_1.addUses(usage_1.multiplyUses(ux, uv), urest)];
    }
    return utils_1.terr(`unable to synth ${core_1.show(tm)}`);
};
const synthapp = (local, ty, arg) => {
    config_1.log(() => `synthapp ${showVal(local, ty)} @ ${core_1.show(arg)}`);
    if (ty.tag === 'VPi') {
        const cty = ty.type;
        const uses = check(local, arg, cty);
        const v = values_1.evaluate(arg, local.vs);
        return [values_1.vinst(ty, v), usage_1.multiplyUses(ty.usage, uses)];
    }
    return utils_1.terr(`not a correct pi type in synthapp: ${showVal(local, ty)} @ ${core_1.show(arg)}`);
};
const verify = (t, local = exports.localEmpty) => {
    const [vty] = synth(local, t);
    const ty = values_1.quote(vty, 0);
    return ty;
};
exports.verify = verify;

},{"./config":1,"./conversion":2,"./core":3,"./usage":10,"./utils/list":11,"./utils/utils":12,"./values":13}],15:[function(require,module,exports){
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

},{"./repl":8}],16:[function(require,module,exports){

},{}]},{},[15]);
