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
const usage_1 = require("./usage");
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
    if (a.tag === 'EIndVoid' && b.tag === 'EIndVoid')
        return exports.conv(k, a.motive, b.motive);
    if (a.tag === 'EIndUnit' && b.tag === 'EIndUnit') {
        exports.conv(k, a.motive, b.motive);
        return exports.conv(k, a.cas, b.cas);
    }
    if (a.tag === 'EIndSigma' && b.tag === 'EIndSigma' && a.usage === b.usage) {
        exports.conv(k, a.motive, b.motive);
        return exports.conv(k, a.cas, b.cas);
    }
    if (a.tag === 'EIndSum' && b.tag === 'EIndSum' && a.usage === b.usage) {
        exports.conv(k, a.motive, b.motive);
        exports.conv(k, a.caseLeft, b.caseLeft);
        return exports.conv(k, a.caseRight, b.caseRight);
    }
    if (a.tag === 'EIndFix' && b.tag === 'EIndFix' && a.usage === b.usage) {
        exports.conv(k, a.motive, b.motive);
        return exports.conv(k, a.cas, b.cas);
    }
    if (a.tag === 'EHelloWorld' && b.tag === 'EHelloWorld')
        return;
    return utils_1.terr(`conv failed (${k}): ${values_1.show(x, k)} ~ ${values_1.show(y, k)}`);
};
const conv = (k, a, b) => {
    config_1.log(() => `conv(${k}): ${values_1.show(a, k)} ~ ${values_1.show(b, k)}`);
    if (a === b)
        return;
    if (a.tag === 'VVoid' && b.tag === 'VVoid')
        return;
    if (a.tag === 'VUnitType' && b.tag === 'VUnitType')
        return;
    if (a.tag === 'VUnit' && b.tag === 'VUnit')
        return;
    if (a.tag === 'VWorld' && b.tag === 'VWorld')
        return;
    if (a.tag === 'VWorldToken' && b.tag === 'VWorldToken')
        return;
    if (a.tag === 'VPi' && b.tag === 'VPi' && a.usage === b.usage) {
        exports.conv(k, a.type, b.type);
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vinst(a, v), values_1.vinst(b, v));
    }
    if (a.tag === 'VSigma' && b.tag === 'VSigma' && a.usage === b.usage) {
        exports.conv(k, a.type, b.type);
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vinst(a, v), values_1.vinst(b, v));
    }
    if (a.tag === 'VAbs' && b.tag === 'VAbs') {
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vinst(a, v), values_1.vinst(b, v));
    }
    if (a.tag === 'VPair' && b.tag === 'VPair') {
        exports.conv(k, a.fst, b.fst);
        return exports.conv(k, a.snd, b.snd);
    }
    if (a.tag === 'VSum' && b.tag === 'VSum') {
        exports.conv(k, a.left, b.left);
        return exports.conv(k, a.right, b.right);
    }
    if (a.tag === 'VInj' && b.tag === 'VInj' && a.which === b.which) {
        exports.conv(k, a.left, b.left);
        exports.conv(k, a.right, b.right);
        return exports.conv(k, a.val, b.val);
    }
    if (a.tag === 'VCon' && b.tag === 'VCon') {
        exports.conv(k, a.sig, b.sig);
        return exports.conv(k, a.val, b.val);
    }
    if (a.tag === 'VFix' && b.tag === 'VFix')
        return exports.conv(k, a.sig, b.sig);
    if (a.tag === 'VAbs') {
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vinst(a, v), values_1.vapp(b, v));
    }
    if (b.tag === 'VAbs') {
        const v = values_1.VVar(k);
        return exports.conv(k + 1, values_1.vapp(a, v), values_1.vinst(b, v));
    }
    if (a.tag === 'VPair') {
        const [fst, snd] = etaSigma(a, b);
        exports.conv(k, a.fst, fst);
        return exports.conv(k, a.snd, snd);
    }
    if (b.tag === 'VPair') {
        const [fst, snd] = etaSigma(b, a);
        exports.conv(k, fst, b.fst);
        return exports.conv(k, snd, b.snd);
    }
    if (a.tag === 'VUnit' || b.tag === 'VUnit')
        return;
    if (a.tag === 'VNe' && b.tag === 'VNe' && exports.eqHead(a.head, b.head))
        return list_1.zipWithR_((x, y) => convElim(k, x, y, a, b), a.spine, b.spine);
    return utils_1.terr(`conv failed (${k}): ${values_1.show(a, k)} ~ ${values_1.show(b, k)}`);
};
exports.conv = conv;
const etaSigma = (a, b) => {
    /*
    TODO: is this correct?
    x ~ indSigma (\_. s.type) t (\(x : s.type) (y : s.body(x)). x)
    y ~ indSigma (\_. s.body(x)) t (\(x : _) (y : _). y)
    --------------------------
    (x, y : s) ~ t
    */
    const sigma = a.type;
    const fst = values_1.vindsigma(usage_1.UsageRig.default, values_1.VAbs(usage_1.UsageRig.default, '_', sigma, _ => sigma.type), b, values_1.VAbs(sigma.usage, 'x', sigma.type, x => values_1.VAbs(usage_1.UsageRig.one, 'y', values_1.vinst(sigma, x), _ => x)));
    const snd = values_1.vindsigma(usage_1.UsageRig.default, values_1.VAbs(usage_1.UsageRig.default, '_', sigma, _ => values_1.vinst(sigma, fst)), b, values_1.VAbs(sigma.usage, 'x', sigma.type, x => values_1.VAbs(usage_1.UsageRig.one, 'y', values_1.vinst(sigma, x), y => y)));
    return [fst, snd];
};

},{"./config":1,"./usage":10,"./utils/list":11,"./utils/utils":12,"./values":13}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.show = exports.flattenSum = exports.flattenPair = exports.flattenSigma = exports.flattenApp = exports.flattenAbs = exports.flattenPi = exports.HelloWorld = exports.UpdateWorld = exports.WorldToken = exports.World = exports.IndFix = exports.Con = exports.Fix = exports.IndSum = exports.Inj = exports.Sum = exports.IndSigma = exports.Pair = exports.Sigma = exports.IndUnit = exports.Unit = exports.UnitType = exports.IndVoid = exports.Void = exports.Let = exports.App = exports.Abs = exports.Pi = exports.Var = exports.Type = void 0;
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
exports.Void = { tag: 'Void' };
const IndVoid = (motive, scrut) => ({ tag: 'IndVoid', motive, scrut });
exports.IndVoid = IndVoid;
exports.UnitType = { tag: 'UnitType' };
exports.Unit = { tag: 'Unit' };
const IndUnit = (motive, scrut, cas) => ({ tag: 'IndUnit', motive, scrut, cas });
exports.IndUnit = IndUnit;
const Sigma = (usage, name, type, body) => ({ tag: 'Sigma', usage, name, type, body });
exports.Sigma = Sigma;
const Pair = (fst, snd, type) => ({ tag: 'Pair', fst, snd, type });
exports.Pair = Pair;
const IndSigma = (usage, motive, scrut, cas) => ({ tag: 'IndSigma', usage, motive, scrut, cas });
exports.IndSigma = IndSigma;
const Sum = (left, right) => ({ tag: 'Sum', left, right });
exports.Sum = Sum;
const Inj = (which, left, right, val) => ({ tag: 'Inj', which, left, right, val });
exports.Inj = Inj;
const IndSum = (usage, motive, scrut, caseLeft, caseRight) => ({ tag: 'IndSum', usage, motive, scrut, caseLeft, caseRight });
exports.IndSum = IndSum;
const Fix = (sig) => ({ tag: 'Fix', sig });
exports.Fix = Fix;
const Con = (sig, val) => ({ tag: 'Con', sig, val });
exports.Con = Con;
const IndFix = (usage, motive, scrut, cas) => ({ tag: 'IndFix', usage, motive, scrut, cas });
exports.IndFix = IndFix;
exports.World = { tag: 'World' };
exports.WorldToken = { tag: 'WorldToken' };
const UpdateWorld = (usage, type, cont) => ({ tag: 'UpdateWorld', usage, type, cont });
exports.UpdateWorld = UpdateWorld;
const HelloWorld = (arg) => ({ tag: 'HelloWorld', arg });
exports.HelloWorld = HelloWorld;
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
const flattenSigma = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Sigma') {
        params.push([c.usage, c.name, c.type]);
        c = c.body;
    }
    return [params, c];
};
exports.flattenSigma = flattenSigma;
const flattenPair = (t) => {
    const r = [];
    while (t.tag === 'Pair') {
        r.push(t.fst);
        t = t.snd;
    }
    r.push(t);
    return r;
};
exports.flattenPair = flattenPair;
const flattenSum = (t) => {
    const r = [];
    while (t.tag === 'Sum') {
        r.push(t.left);
        t = t.right;
    }
    r.push(t);
    return r;
};
exports.flattenSum = flattenSum;
const showP = (b, t) => b ? `(${exports.show(t)})` : exports.show(t);
const isSimple = (t) => t.tag === 'Type' || t.tag === 'Var' || t.tag === 'Void' || t.tag === 'UnitType' || t.tag === 'Unit' || t.tag === 'Pair' || t.tag === 'World' || t.tag === 'WorldToken';
const showS = (t) => showP(!isSimple(t), t);
const show = (t) => {
    if (t.tag === 'Type')
        return 'Type';
    if (t.tag === 'Void')
        return 'Void';
    if (t.tag === 'UnitType')
        return '()';
    if (t.tag === 'Unit')
        return '*';
    if (t.tag === 'Var')
        return `${t.index}`;
    if (t.tag === 'Pi') {
        const [params, ret] = exports.flattenPi(t);
        return `${params.map(([u, x, t]) => u === usage_1.UsageRig.default && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Sigma' || t.tag === 'Let', t) : `(${u === usage_1.UsageRig.default ? '' : `${u} `}${x} : ${exports.show(t)})`).join(' -> ')} -> ${exports.show(ret)}`;
    }
    if (t.tag === 'Sigma') {
        const [params, ret] = exports.flattenSigma(t);
        return `${params.map(([u, x, t]) => u === usage_1.UsageRig.default && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Sigma' || t.tag === 'Let', t) : `(${u === usage_1.UsageRig.default ? '' : `${u} `}${x} : ${exports.show(t)})`).join(' ** ')} ** ${exports.show(ret)}`;
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
    if (t.tag === 'Pair') {
        const ps = exports.flattenPair(t);
        return `(${ps.map(t => exports.show(t)).join(', ')} : ${exports.show(t.type)})`;
    }
    if (t.tag === 'Sum')
        return exports.flattenSum(t).map(x => showP(!isSimple(x) && x.tag !== 'App', x)).join(' ++ ');
    if (t.tag === 'Inj')
        return `${t.which} ${showS(t.left)} ${showS(t.right)} ${showS(t.val)}`;
    if (t.tag === 'IndVoid')
        return `indVoid ${showS(t.motive)} ${showS(t.scrut)}`;
    if (t.tag === 'IndUnit')
        return `indUnit ${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
    if (t.tag === 'IndSum')
        return `indSum ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.caseLeft)} ${showS(t.caseRight)}`;
    if (t.tag === 'IndSigma')
        return `indSigma ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
    if (t.tag === 'Fix')
        return `Fix ${showS(t.sig)}`;
    if (t.tag === 'Con')
        return `Con ${showS(t.sig)} ${showS(t.val)}`;
    if (t.tag === 'IndFix')
        return `indFix ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
    if (t.tag === 'World')
        return 'World';
    if (t.tag === 'WorldToken')
        return 'WorldToken';
    if (t.tag === 'UpdateWorld')
        return `updateWorld ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${showS(t.type)} ${showS(t.cont)}`;
    if (t.tag === 'HelloWorld')
        return `helloWorld ${showS(t.arg)}`;
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
    if (tm.tag === 'Void' && ty.tag === 'VType')
        return [core_1.Void, usage_1.noUses(local.level)];
    if (tm.tag === 'World' && ty.tag === 'VType')
        return [core_1.World, usage_1.noUses(local.level)];
    if (tm.tag === 'UnitType' && ty.tag === 'VType')
        return [core_1.UnitType, usage_1.noUses(local.level)];
    if (tm.tag === 'Unit' && ty.tag === 'VUnitType')
        return [core_1.Unit, usage_1.noUses(local.level)];
    if (tm.tag === 'Abs' && !tm.type && ty.tag === 'VPi') {
        const v = values_1.VVar(local.level);
        const x = tm.name;
        const [body, u] = check(exports.localExtend(local, x, ty.type, ty.usage, v), tm.body, values_1.vinst(ty, v));
        const [ux, urest] = list_1.uncons(u);
        if (!usage_1.UsageRig.sub(ux, ty.usage))
            return utils_1.terr(`usage error in ${surface_1.show(tm)}: expected ${ty.usage} for ${x} but actual ${ux}`);
        return [core_1.Abs(ty.usage, x, values_1.quote(ty.type, local.level), body), urest];
    }
    if (tm.tag === 'Pair' && ty.tag === 'VSigma') {
        const [fst, u1] = check(local, tm.fst, ty.type);
        const [snd, u2] = check(local, tm.snd, values_1.vinst(ty, values_1.evaluate(fst, local.vs)));
        return [core_1.Pair(fst, snd, values_1.quote(ty, local.level)), usage_1.addUses(usage_1.multiplyUses(ty.usage, u1), u2)];
    }
    if (tm.tag === 'Inj' && ty.tag === 'VSum') {
        const [val, u] = check(local, tm.val, tm.which === 'Left' ? ty.left : ty.right);
        return [core_1.Inj(tm.which, values_1.quote(ty.left, local.level), values_1.quote(ty.right, local.level), val), u];
    }
    if (tm.tag === 'Con' && ty.tag === 'VFix') {
        const [val, u] = check(local, tm.val, values_1.vapp(ty.sig, ty));
        return [core_1.Con(values_1.quote(ty.sig, local.level), val), u];
    }
    if (tm.tag === 'Hole') {
        const res = [];
        for (let i = 0; i < local.level; i++) {
            const entry = list_1.index(local.ts, i);
            const name = list_1.index(local.ns, i);
            const value = list_1.index(local.vs, i);
            res.push(`${entry ? entry.usage : '?'} ${name} : ${entry && entry.type ? showVal(local, entry.type) : '?'} = ${value ? showVal(local, value) : '?'}`);
        }
        return utils_1.terr(`hole _${tm.name} : ${showVal(local, ty)} in ${res.join('; ')}`);
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
    if (tm.tag === 'Void')
        return [core_1.Void, values_1.VType, usage_1.noUses(local.level)];
    if (tm.tag === 'UnitType')
        return [core_1.UnitType, values_1.VType, usage_1.noUses(local.level)];
    if (tm.tag === 'Unit')
        return [core_1.Unit, values_1.VUnitType, usage_1.noUses(local.level)];
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
    if (tm.tag === 'Sigma') {
        const [type, u1] = check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(type, local.vs);
        const [body, u2] = check(exports.localExtend(local, tm.name, ty, '0'), tm.body, values_1.VType);
        const [, urest] = list_1.uncons(u2);
        return [core_1.Sigma(tm.usage, tm.name, type, body), values_1.VType, usage_1.addUses(u1, urest)];
    }
    if (tm.tag === 'Pair') {
        const [fst, ty1, u1] = synth(local, tm.fst);
        const [snd, ty2, u2] = synth(local, tm.snd);
        const ty = values_1.VSigma(usage_1.UsageRig.default, '_', ty1, _ => ty2);
        return [core_1.Pair(fst, snd, values_1.quote(ty, local.level)), ty, usage_1.addUses(usage_1.multiplyUses(ty.usage, u1), u2)];
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
    if (tm.tag === 'Sum') {
        const [left, u1] = check(local, tm.left, values_1.VType);
        const [right, u2] = check(local, tm.right, values_1.VType);
        return [core_1.Sum(left, right), values_1.VType, usage_1.addUses(u1, u2)];
    }
    if (tm.tag === 'Inj') {
        const [val, ty, u] = synth(local, tm.val);
        return tm.which === 'Left' ?
            [core_1.Inj('Left', values_1.quote(ty, local.level), core_1.Void, val), values_1.VSum(ty, values_1.VVoid), u] :
            [core_1.Inj('Right', core_1.Void, values_1.quote(ty, local.level), val), values_1.VSum(values_1.VVoid, ty), u];
    }
    if (tm.tag === 'IndVoid') {
        const [motive] = check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VVoid, _ => values_1.VType));
        const [scrut, u] = check(local, tm.scrut, values_1.VVoid);
        return [core_1.IndVoid(motive, scrut), values_1.vapp(values_1.evaluate(motive, local.vs), values_1.evaluate(scrut, local.vs)), u];
    }
    if (tm.tag === 'IndUnit') {
        const [motive] = check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VUnitType, _ => values_1.VType));
        const [scrut, u1] = check(local, tm.scrut, values_1.VUnitType);
        const vmotive = values_1.evaluate(motive, local.vs);
        const [cas, u2] = check(local, tm.cas, values_1.vapp(vmotive, values_1.VUnit));
        return [core_1.IndUnit(motive, scrut, cas), values_1.vapp(vmotive, values_1.evaluate(scrut, local.vs)), usage_1.addUses(u1, u2)];
    }
    if (tm.tag === 'IndSigma') {
        if (!usage_1.UsageRig.sub(usage_1.UsageRig.one, tm.usage))
            return utils_1.terr(`usage must be 1 <= q in sigma induction ${surface_1.show(tm)}: ${tm.usage}`);
        const [scrut, sigma, u1] = synth(local, tm.scrut);
        if (sigma.tag !== 'VSigma')
            return utils_1.terr(`not a sigma type in ${surface_1.show(tm)}: ${showVal(local, sigma)}`);
        const [motive] = check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', sigma, _ => values_1.VType));
        const vmotive = values_1.evaluate(motive, local.vs);
        const [cas, u2] = check(local, tm.cas, values_1.VPi(usage_1.UsageRig.multiply(tm.usage, sigma.usage), 'x', sigma.type, x => values_1.VPi(tm.usage, 'y', values_1.vinst(sigma, x), y => values_1.vapp(vmotive, values_1.VPair(x, y, sigma)))));
        return [core_1.IndSigma(tm.usage, motive, scrut, cas), values_1.vapp(vmotive, values_1.evaluate(scrut, local.vs)), usage_1.multiplyUses(tm.usage, usage_1.addUses(u1, u2))];
    }
    if (tm.tag === 'IndSum') {
        if (!usage_1.UsageRig.sub(usage_1.UsageRig.one, tm.usage))
            return utils_1.terr(`usage must be 1 <= q in sum induction ${surface_1.show(tm)}: ${tm.usage}`);
        const [scrut, sumty, u1] = synth(local, tm.scrut);
        if (sumty.tag !== 'VSum')
            return utils_1.terr(`not a sumtype in ${surface_1.show(tm)}: ${showVal(local, sumty)}`);
        const [motive] = check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', sumty, _ => values_1.VType));
        const vmotive = values_1.evaluate(motive, local.vs);
        const [caseLeft, uleft] = check(local, tm.caseLeft, values_1.VPi(tm.usage, 'x', sumty.left, x => values_1.vapp(vmotive, values_1.VInj('Left', sumty.left, sumty.right, x))));
        const [caseRight, uright] = check(local, tm.caseRight, values_1.VPi(tm.usage, 'x', sumty.right, x => values_1.vapp(vmotive, values_1.VInj('Right', sumty.left, sumty.right, x))));
        const u2 = usage_1.lubUses(uleft, uright);
        if (!u2) {
            const wrongVars = list_1.toArray(list_1.filter(list_1.zipWith((a, i) => [a, i], list_1.zipWith(usage_1.UsageRig.lub, uleft, uright), list_1.range(local.level)), ([x]) => x === null), ([, i]) => `left: ${list_1.index(uleft, i)}, right: ${list_1.index(uright, i)}, variable: ${list_1.index(local.ns, i)} (${i})`);
            return utils_1.terr(`usage mismatch in sum branches ${surface_1.show(tm)}: ${wrongVars.join('; ')}`);
        }
        return [core_1.IndSum(tm.usage, motive, scrut, caseLeft, caseRight), values_1.vapp(vmotive, values_1.evaluate(scrut, local.vs)), usage_1.addUses(usage_1.multiplyUses(tm.usage, u1), u2)];
    }
    if (tm.tag === 'World')
        return [core_1.World, values_1.VType, usage_1.noUses(local.level)];
    if (tm.tag === 'Fix') {
        const [sig, u] = check(local, tm.sig, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VType, _ => values_1.VType));
        return [core_1.Fix(sig), values_1.VType, u];
    }
    if (tm.tag === 'IndFix') {
        if (!usage_1.UsageRig.sub(usage_1.UsageRig.one, tm.usage))
            return utils_1.terr(`usage must be 1 <= q in fix induction ${surface_1.show(tm)}: ${tm.usage}`);
        const [scrut, fixty, u1] = synth(local, tm.scrut);
        if (fixty.tag !== 'VFix')
            return utils_1.terr(`not a fix type in ${surface_1.show(tm)}: ${showVal(local, fixty)}`);
        const [motive] = check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', fixty, _ => values_1.VType));
        const vmotive = values_1.evaluate(motive, local.vs);
        // ((q z : Fix f) -> P z) -> (q y : f (Fix f)) -> P (Con f y)
        const [cas, u2] = check(local, tm.cas, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VPi(tm.usage, 'z', fixty, z => values_1.vapp(vmotive, z)), _ => values_1.VPi(tm.usage, 'y', values_1.vapp(fixty.sig, fixty), y => values_1.vapp(vmotive, values_1.VCon(fixty.sig, y)))));
        return [core_1.IndFix(tm.usage, motive, scrut, cas), values_1.vapp(vmotive, values_1.evaluate(scrut, local.vs)), usage_1.addUses(usage_1.multiplyUses(tm.usage, u1), u2)];
    }
    if (tm.tag === 'UpdateWorld') {
        const [type] = check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(type, local.vs);
        const [cont, u] = check(local, tm.cont, values_1.VPi(usage_1.UsageRig.one, '_', values_1.VWorld, _ => values_1.VSigma(tm.usage, '_', ty, _ => values_1.VWorld)));
        return [core_1.UpdateWorld(tm.usage, type, cont), ty, usage_1.multiplyUses(tm.usage, u)];
    }
    if (tm.tag === 'HelloWorld') {
        const [arg, u] = check(local, tm.arg, values_1.VWorld);
        return [core_1.HelloWorld(arg), values_1.VWorld, u];
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
const SYM1 = ['\\', ':', '=', ';', '*', ','];
const SYM2 = ['->', '**', '++'];
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
            return [[usage_1.UsageRig.default, '_', impl, surface_1.UnitType]];
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
            return [[usage_1.UsageRig.default, '_', impl, surface_1.UnitType]];
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
        return [s.reduce((t, n) => surface_1.App(surface_1.App(Cons, numToNat(n, `codepoint: ${n}`)), t), Nil), false];
    }
    if (t.tag === 'Name') {
        const x = t.name;
        if (x === 'Type')
            return [surface_1.Type, false];
        if (x === 'Void')
            return [surface_1.Void, false];
        if (x === 'World')
            return [surface_1.World, false];
        if (x === '*')
            return [surface_1.Unit, false];
        if (x[0] === '_')
            return [surface_1.Hole(x.slice(1)), false];
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
        return surface_1.UnitType;
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
    if (isName(ts[0], 'Left') || isName(ts[0], 'Right')) {
        const tag = ts[0].name;
        const val = exprs(ts.slice(1), br, fromRepl);
        return surface_1.Inj(tag, val);
    }
    if (isName(ts[0], 'indVoid')) {
        if (ts.length !== 3)
            return utils_1.serr(`indVoid expects exactly 2 arguments`);
        const [motive] = expr(ts[1], fromRepl);
        const [scrut] = expr(ts[2], fromRepl);
        return surface_1.IndVoid(motive, scrut);
    }
    if (isName(ts[0], 'indUnit')) {
        if (ts.length !== 4)
            return utils_1.serr(`indUnit expects exactly 3 arguments`);
        const [motive] = expr(ts[1], fromRepl);
        const [scrut] = expr(ts[2], fromRepl);
        const [cas] = expr(ts[3], fromRepl);
        return surface_1.IndUnit(motive, scrut, cas);
    }
    if (isName(ts[0], 'indSigma')) {
        let j = 1;
        let u = usage(ts[1]);
        if (u) {
            j = 2;
        }
        else {
            u = usage_1.UsageRig.default;
        }
        if (ts.length !== 3 + j)
            return utils_1.serr(`indSigma expects exactly 3 arguments`);
        const [motive] = expr(ts[j], fromRepl);
        const [scrut] = expr(ts[j + 1], fromRepl);
        const [cas] = expr(ts[j + 2], fromRepl);
        return surface_1.IndSigma(u, motive, scrut, cas);
    }
    if (isName(ts[0], 'indSum')) {
        let j = 1;
        let u = usage(ts[1]);
        if (u) {
            j = 2;
        }
        else {
            u = usage_1.UsageRig.default;
        }
        if (ts.length !== 4 + j)
            return utils_1.serr(`indSum expects exactly 4 arguments`);
        const [motive] = expr(ts[j], fromRepl);
        const [scrut] = expr(ts[j + 1], fromRepl);
        const [caseLeft] = expr(ts[j + 2], fromRepl);
        const [caseRight] = expr(ts[j + 3], fromRepl);
        return surface_1.IndSum(u, motive, scrut, caseLeft, caseRight);
    }
    if (isName(ts[0], 'Fix')) {
        const sig = exprs(ts.slice(1), br, fromRepl);
        return surface_1.Fix(sig);
    }
    if (isName(ts[0], 'Con')) {
        const val = exprs(ts.slice(1), br, fromRepl);
        return surface_1.Con(val);
    }
    if (isName(ts[0], 'indFix')) {
        let j = 1;
        let u = usage(ts[1]);
        if (u) {
            j = 2;
        }
        else {
            u = usage_1.UsageRig.default;
        }
        if (ts.length !== 3 + j)
            return utils_1.serr(`indFix expects exactly 3 arguments`);
        const [motive] = expr(ts[j], fromRepl);
        const [scrut] = expr(ts[j + 1], fromRepl);
        const [cas] = expr(ts[j + 2], fromRepl);
        return surface_1.IndFix(u, motive, scrut, cas);
    }
    if (isName(ts[0], 'updateWorld')) {
        let j = 1;
        let u = usage(ts[1]);
        if (u) {
            j = 2;
        }
        else {
            u = usage_1.UsageRig.default;
        }
        if (ts.length !== 2 + j)
            return utils_1.serr(`updateWorld expects exactly 2 arguments`);
        const [type] = expr(ts[j], fromRepl);
        const [cont] = expr(ts[j + 1], fromRepl);
        return surface_1.UpdateWorld(u, type, cont);
    }
    if (isName(ts[0], 'helloWorld')) {
        if (ts.length !== 2)
            return utils_1.serr(`helloWorld expects one argument`);
        const [arg] = expr(ts[1], fromRepl);
        return surface_1.HelloWorld(arg);
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
    const jp = ts.findIndex(x => isName(x, ','));
    if (jp >= 0) {
        const s = splitTokens(ts, x => isName(x, ','));
        if (s.length < 2)
            return utils_1.serr(`parsing failed with ,`);
        const args = s.map(x => {
            if (x.length === 1) {
                const h = x[0];
                if (h.tag === 'List' && h.bracket === '{')
                    return expr(h, fromRepl);
            }
            return [exprs(x, '(', fromRepl), false];
        });
        if (args.length === 0)
            return utils_1.serr(`empty pair`);
        if (args.length === 1)
            return utils_1.serr(`singleton pair`);
        const last1 = args[args.length - 1];
        const last2 = args[args.length - 2];
        const lastitem = surface_1.Pair(last2[0], last1[0]);
        return args.slice(0, -2).reduceRight((x, [y, _p]) => surface_1.Pair(y, x), lastitem);
    }
    const js = ts.findIndex(x => isName(x, '**'));
    if (js >= 0) {
        const s = splitTokens(ts, x => isName(x, '**'));
        if (s.length < 2)
            return utils_1.serr(`parsing failed with **`);
        const args = s.slice(0, -1)
            .map(p => p.length === 1 ? piParams(p[0], fromRepl) : [[usage_1.UsageRig.default, '_', false, exprs(p, '(', fromRepl)]])
            .reduce((x, y) => x.concat(y), []);
        const body = exprs(s[s.length - 1], '(', fromRepl);
        return args.reduceRight((x, [u, name, , ty]) => surface_1.Sigma(u, name, ty, x), body);
    }
    const jsum = ts.findIndex(x => isName(x, '++'));
    if (jsum >= 0) {
        const s = splitTokens(ts, x => isName(x, '++'));
        if (s.length < 2)
            return utils_1.serr(`parsing failed with ++`);
        const args = s.map(x => {
            if (x.length === 1) {
                const h = x[0];
                if (h.tag === 'List' && h.bracket === '{')
                    return expr(h, fromRepl);
            }
            return [exprs(x, '(', fromRepl), false];
        });
        if (args.length === 0)
            return utils_1.serr(`empty sum`);
        if (args.length === 1)
            return utils_1.serr(`singleton sum`);
        const last1 = args[args.length - 1];
        const last2 = args[args.length - 2];
        const lastitem = surface_1.Sum(last2[0], last1[0]);
        return args.slice(0, -2).reduceRight((x, [y, _p]) => surface_1.Sum(y, x), lastitem);
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
    if (!fromRepl)
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
const usage_1 = require("./usage");
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
        let usage = usage_1.UsageRig.default;
        if (term.tag === 'Let' && term.body === null) {
            isDef = true;
            usage = term.usage;
            term = surface_1.Let(term.usage === usage_1.UsageRig.zero ? usage_1.UsageRig.default : term.usage, term.name, term.type, term.val, surface_1.Var(term.name));
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
            defs.push([usage, term.name, term.type, term.val]);
            const value = values_1.evaluate(eterm, elocal.vs);
            elocal = Elab.localExtend(elocal, term.name, values_1.evaluate(etype, elocal.vs), usage, value);
            vlocal = Verif.localExtend(vlocal, values_1.evaluate(verifty, vlocal.vs), usage, value);
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

},{"./config":1,"./core":3,"./elaboration":4,"./parser":6,"./surface":9,"./usage":10,"./values":13,"./verification":14}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showVal = exports.showCore = exports.fromCore = exports.show = exports.flattenSum = exports.flattenPair = exports.flattenSigma = exports.flattenApp = exports.flattenAbs = exports.flattenPi = exports.Hole = exports.HelloWorld = exports.UpdateWorld = exports.World = exports.IndFix = exports.Con = exports.Fix = exports.IndSum = exports.Inj = exports.Sum = exports.IndSigma = exports.Pair = exports.Sigma = exports.IndUnit = exports.Unit = exports.UnitType = exports.IndVoid = exports.Void = exports.Let = exports.App = exports.Abs = exports.Pi = exports.Var = exports.Type = void 0;
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
exports.Void = { tag: 'Void' };
const IndVoid = (motive, scrut) => ({ tag: 'IndVoid', motive, scrut });
exports.IndVoid = IndVoid;
exports.UnitType = { tag: 'UnitType' };
exports.Unit = { tag: 'Unit' };
const IndUnit = (motive, scrut, cas) => ({ tag: 'IndUnit', motive, scrut, cas });
exports.IndUnit = IndUnit;
const Sigma = (usage, name, type, body) => ({ tag: 'Sigma', usage, name, type, body });
exports.Sigma = Sigma;
const Pair = (fst, snd) => ({ tag: 'Pair', fst, snd });
exports.Pair = Pair;
const IndSigma = (usage, motive, scrut, cas) => ({ tag: 'IndSigma', usage, motive, scrut, cas });
exports.IndSigma = IndSigma;
const Sum = (left, right) => ({ tag: 'Sum', left, right });
exports.Sum = Sum;
const Inj = (which, val) => ({ tag: 'Inj', which, val });
exports.Inj = Inj;
const IndSum = (usage, motive, scrut, caseLeft, caseRight) => ({ tag: 'IndSum', usage, motive, scrut, caseLeft, caseRight });
exports.IndSum = IndSum;
const Fix = (sig) => ({ tag: 'Fix', sig });
exports.Fix = Fix;
const Con = (val) => ({ tag: 'Con', val });
exports.Con = Con;
const IndFix = (usage, motive, scrut, cas) => ({ tag: 'IndFix', usage, motive, scrut, cas });
exports.IndFix = IndFix;
exports.World = { tag: 'World' };
const UpdateWorld = (usage, type, cont) => ({ tag: 'UpdateWorld', usage, type, cont });
exports.UpdateWorld = UpdateWorld;
const HelloWorld = (arg) => ({ tag: 'HelloWorld', arg });
exports.HelloWorld = HelloWorld;
const Hole = (name) => ({ tag: 'Hole', name });
exports.Hole = Hole;
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
const flattenSigma = (t) => {
    const params = [];
    let c = t;
    while (c.tag === 'Sigma') {
        params.push([c.usage, c.name, c.type]);
        c = c.body;
    }
    return [params, c];
};
exports.flattenSigma = flattenSigma;
const flattenPair = (t) => {
    const r = [];
    while (t.tag === 'Pair') {
        r.push(t.fst);
        t = t.snd;
    }
    r.push(t);
    return r;
};
exports.flattenPair = flattenPair;
const flattenSum = (t) => {
    const r = [];
    while (t.tag === 'Sum') {
        r.push(t.left);
        t = t.right;
    }
    r.push(t);
    return r;
};
exports.flattenSum = flattenSum;
const showP = (b, t) => b ? `(${exports.show(t)})` : exports.show(t);
const isSimple = (t) => t.tag === 'Type' || t.tag === 'Var' || t.tag === 'Void' || t.tag === 'UnitType' || t.tag === 'Unit' || t.tag === 'Pair' || t.tag === 'World';
const showS = (t) => showP(!isSimple(t), t);
const show = (t) => {
    if (t.tag === 'Type')
        return 'Type';
    if (t.tag === 'Void')
        return 'Void';
    if (t.tag === 'UnitType')
        return '()';
    if (t.tag === 'Unit')
        return '*';
    if (t.tag === 'Var')
        return t.name;
    if (t.tag === 'Pi') {
        const [params, ret] = exports.flattenPi(t);
        return `${params.map(([u, x, t]) => u === usage_1.UsageRig.default && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Sigma' || t.tag === 'Let', t) : `(${u === usage_1.UsageRig.default ? '' : `${u} `}${x} : ${exports.show(t)})`).join(' -> ')} -> ${exports.show(ret)}`;
    }
    if (t.tag === 'Sigma') {
        const [params, ret] = exports.flattenSigma(t);
        return `${params.map(([u, x, t]) => u === usage_1.UsageRig.default && x === '_' ? showP(t.tag === 'Pi' || t.tag === 'Sigma' || t.tag === 'Let', t) : `(${u === usage_1.UsageRig.default ? '' : `${u} `}${x} : ${exports.show(t)})`).join(' ** ')} ** ${exports.show(ret)}`;
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
    if (t.tag === 'Pair') {
        const ps = exports.flattenPair(t);
        return `(${ps.map(exports.show).join(', ')})`;
    }
    if (t.tag === 'Sum')
        return exports.flattenSum(t).map(x => showP(!isSimple(x) && x.tag !== 'App', x)).join(' ++ ');
    if (t.tag === 'Inj')
        return `${t.which} ${showS(t.val)}`;
    if (t.tag === 'IndVoid')
        return `indVoid ${showS(t.motive)} ${showS(t.scrut)}`;
    if (t.tag === 'IndUnit')
        return `indUnit ${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
    if (t.tag === 'IndSum')
        return `indSum ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.caseLeft)} ${showS(t.caseRight)}`;
    if (t.tag === 'IndSigma')
        return `indSigma ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
    if (t.tag === 'Fix')
        return `Fix ${showS(t.sig)}`;
    if (t.tag === 'Con')
        return `Con ${showS(t.val)}`;
    if (t.tag === 'IndFix')
        return `indFix ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${showS(t.motive)} ${showS(t.scrut)} ${showS(t.cas)}`;
    if (t.tag === 'World')
        return 'World';
    if (t.tag === 'UpdateWorld')
        return `updateWorld ${t.usage === usage_1.UsageRig.default ? '' : `${t.usage} `}${showS(t.type)} ${showS(t.cont)}`;
    if (t.tag === 'HelloWorld')
        return `helloWorld ${showS(t.arg)}`;
    if (t.tag === 'Hole')
        return `_${t.name}`;
    return t;
};
exports.show = show;
const fromCore = (t, ns = list_1.Nil) => {
    if (t.tag === 'Type')
        return exports.Type;
    if (t.tag === 'Void')
        return exports.Void;
    if (t.tag === 'UnitType')
        return exports.UnitType;
    if (t.tag === 'Unit')
        return exports.Unit;
    if (t.tag === 'Var')
        return exports.Var(list_1.index(ns, t.index) || utils_1.impossible(`var out of scope in fromCore: ${t.index}`));
    if (t.tag === 'App')
        return exports.App(exports.fromCore(t.fn, ns), exports.fromCore(t.arg, ns));
    if (t.tag === 'Pi') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Pi(t.usage, x, exports.fromCore(t.type, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    if (t.tag === 'Sigma') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Sigma(t.usage, x, exports.fromCore(t.type, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    if (t.tag === 'Abs') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Abs(t.usage, x, exports.fromCore(t.type, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    if (t.tag === 'Let') {
        const x = names_1.chooseName(t.name, ns);
        return exports.Let(t.usage, x, exports.fromCore(t.type, ns), exports.fromCore(t.val, ns), exports.fromCore(t.body, list_1.Cons(x, ns)));
    }
    if (t.tag === 'Pair')
        return exports.Pair(exports.fromCore(t.fst, ns), exports.fromCore(t.snd, ns));
    if (t.tag === 'Sum')
        return exports.Sum(exports.fromCore(t.left, ns), exports.fromCore(t.right, ns));
    if (t.tag === 'Inj')
        return exports.Inj(t.which, exports.fromCore(t.val, ns));
    if (t.tag === 'IndVoid')
        return exports.IndVoid(exports.fromCore(t.motive, ns), exports.fromCore(t.scrut, ns));
    if (t.tag === 'IndUnit')
        return exports.IndUnit(exports.fromCore(t.motive, ns), exports.fromCore(t.scrut, ns), exports.fromCore(t.cas, ns));
    if (t.tag === 'IndSigma')
        return exports.IndSigma(t.usage, exports.fromCore(t.motive, ns), exports.fromCore(t.scrut, ns), exports.fromCore(t.cas, ns));
    if (t.tag === 'IndSum')
        return exports.IndSum(t.usage, exports.fromCore(t.motive, ns), exports.fromCore(t.scrut, ns), exports.fromCore(t.caseLeft, ns), exports.fromCore(t.caseRight, ns));
    if (t.tag === 'Fix')
        return exports.Fix(exports.fromCore(t.sig, ns));
    if (t.tag === 'Con')
        return exports.Fix(exports.fromCore(t.sig, ns));
    if (t.tag === 'IndFix')
        return exports.IndFix(t.usage, exports.fromCore(t.motive, ns), exports.fromCore(t.scrut, ns), exports.fromCore(t.cas, ns));
    if (t.tag === 'World')
        return exports.World;
    if (t.tag === 'WorldToken')
        return exports.Var('WorldToken');
    if (t.tag === 'UpdateWorld')
        return exports.UpdateWorld(t.usage, exports.fromCore(t.type, ns), exports.fromCore(t.cont, ns));
    if (t.tag === 'HelloWorld')
        return exports.HelloWorld(exports.fromCore(t.arg, ns));
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
exports.show = exports.normalize = exports.quote = exports.evaluate = exports.vhelloworld = exports.vindfix = exports.vindsum = exports.vindsigma = exports.vindunit = exports.vindvoid = exports.vapp = exports.vinst = exports.VVar = exports.VWorldToken = exports.VWorld = exports.VCon = exports.VFix = exports.VInj = exports.VSum = exports.VPair = exports.VSigma = exports.VUnit = exports.VUnitType = exports.VVoid = exports.VPi = exports.VAbs = exports.VNe = exports.VType = exports.EHelloWorld = exports.EIndFix = exports.EIndSum = exports.EIndSigma = exports.EIndUnit = exports.EIndVoid = exports.EApp = exports.HVar = void 0;
const core_1 = require("./core");
const C = require("./core");
const list_1 = require("./utils/list");
const utils_1 = require("./utils/utils");
const usage_1 = require("./usage");
const HVar = (level) => ({ tag: 'HVar', level });
exports.HVar = HVar;
const EApp = (arg) => ({ tag: 'EApp', arg });
exports.EApp = EApp;
const EIndVoid = (motive) => ({ tag: 'EIndVoid', motive });
exports.EIndVoid = EIndVoid;
const EIndUnit = (motive, cas) => ({ tag: 'EIndUnit', motive, cas });
exports.EIndUnit = EIndUnit;
const EIndSigma = (usage, motive, cas) => ({ tag: 'EIndSigma', usage, motive, cas });
exports.EIndSigma = EIndSigma;
const EIndSum = (usage, motive, caseLeft, caseRight) => ({ tag: 'EIndSum', usage, motive, caseLeft, caseRight });
exports.EIndSum = EIndSum;
const EIndFix = (usage, motive, cas) => ({ tag: 'EIndFix', usage, motive, cas });
exports.EIndFix = EIndFix;
exports.EHelloWorld = { tag: 'EHelloWorld' };
exports.VType = { tag: 'VType' };
const VNe = (head, spine) => ({ tag: 'VNe', head, spine });
exports.VNe = VNe;
const VAbs = (usage, name, type, clos) => ({ tag: 'VAbs', usage, name, type, clos });
exports.VAbs = VAbs;
const VPi = (usage, name, type, clos) => ({ tag: 'VPi', usage, name, type, clos });
exports.VPi = VPi;
exports.VVoid = { tag: 'VVoid' };
exports.VUnitType = { tag: 'VUnitType' };
exports.VUnit = { tag: 'VUnit' };
const VSigma = (usage, name, type, clos) => ({ tag: 'VSigma', usage, name, type, clos });
exports.VSigma = VSigma;
const VPair = (fst, snd, type) => ({ tag: 'VPair', fst, snd, type });
exports.VPair = VPair;
const VSum = (left, right) => ({ tag: 'VSum', left, right });
exports.VSum = VSum;
const VInj = (which, left, right, val) => ({ tag: 'VInj', which, left, right, val });
exports.VInj = VInj;
const VFix = (sig) => ({ tag: 'VFix', sig });
exports.VFix = VFix;
const VCon = (sig, val) => ({ tag: 'VCon', sig, val });
exports.VCon = VCon;
exports.VWorld = { tag: 'VWorld' };
exports.VWorldToken = { tag: 'VWorldToken' };
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
const vindvoid = (motive, scrut) => {
    if (scrut.tag === 'VNe')
        return exports.VNe(scrut.head, list_1.Cons(exports.EIndVoid(motive), scrut.spine));
    return utils_1.impossible(`vindvoid: ${scrut.tag}`);
};
exports.vindvoid = vindvoid;
const vindunit = (motive, scrut, cas) => {
    if (scrut.tag === 'VUnit')
        return cas;
    if (scrut.tag === 'VNe')
        return exports.VNe(scrut.head, list_1.Cons(exports.EIndUnit(motive, cas), scrut.spine));
    return utils_1.impossible(`vindunit: ${scrut.tag}`);
};
exports.vindunit = vindunit;
const vindsigma = (usage, motive, scrut, cas) => {
    if (scrut.tag === 'VPair')
        return exports.vapp(exports.vapp(cas, scrut.fst), scrut.snd);
    if (scrut.tag === 'VNe')
        return exports.VNe(scrut.head, list_1.Cons(exports.EIndSigma(usage, motive, cas), scrut.spine));
    return utils_1.impossible(`vindsigma: ${scrut.tag}`);
};
exports.vindsigma = vindsigma;
const vindsum = (usage, motive, scrut, caseLeft, caseRight) => {
    if (scrut.tag === 'VInj')
        return exports.vapp(scrut.which === 'Left' ? caseLeft : caseRight, scrut.val);
    if (scrut.tag === 'VNe')
        return exports.VNe(scrut.head, list_1.Cons(exports.EIndSum(usage, motive, caseLeft, caseRight), scrut.spine));
    return utils_1.impossible(`vindsum: ${scrut.tag}`);
};
exports.vindsum = vindsum;
const vindfix = (usage, motive, scrut, cas) => {
    if (scrut.tag === 'VCon') {
        // indFix q P (Con f x) c ~> c (\(q z : Fix f). indFix q P z c) x
        return exports.vapp(exports.vapp(cas, exports.VAbs(usage, 'z', exports.VFix(scrut.sig), z => exports.vindfix(usage, motive, z, cas))), scrut.val);
    }
    if (scrut.tag === 'VNe')
        return exports.VNe(scrut.head, list_1.Cons(exports.EIndFix(usage, motive, cas), scrut.spine));
    return utils_1.impossible(`vindfix: ${scrut.tag}`);
};
exports.vindfix = vindfix;
const vhelloworld = (scrut) => {
    if (scrut.tag === 'VWorldToken') {
        if (typeof window === 'undefined') {
            console.log('Hello, world!');
        }
        else {
            alert('Hello, world!');
        }
        return scrut;
    }
    if (scrut.tag === 'VNe')
        return exports.VNe(scrut.head, list_1.Cons(exports.EHelloWorld, scrut.spine));
    return utils_1.impossible(`vhelloworld: ${scrut.tag}`);
};
exports.vhelloworld = vhelloworld;
const evaluate = (t, vs) => {
    if (t.tag === 'Type')
        return exports.VType;
    if (t.tag === 'Void')
        return exports.VVoid;
    if (t.tag === 'UnitType')
        return exports.VUnitType;
    if (t.tag === 'Unit')
        return exports.VUnit;
    if (t.tag === 'Abs')
        return exports.VAbs(t.usage, t.name, exports.evaluate(t.type, vs), v => exports.evaluate(t.body, list_1.Cons(v, vs)));
    if (t.tag === 'Pi')
        return exports.VPi(t.usage, t.name, exports.evaluate(t.type, vs), v => exports.evaluate(t.body, list_1.Cons(v, vs)));
    if (t.tag === 'Sigma')
        return exports.VSigma(t.usage, t.name, exports.evaluate(t.type, vs), v => exports.evaluate(t.body, list_1.Cons(v, vs)));
    if (t.tag === 'Var')
        return list_1.index(vs, t.index) || utils_1.impossible(`evaluate: var ${t.index} has no value`);
    if (t.tag === 'App')
        return exports.vapp(exports.evaluate(t.fn, vs), exports.evaluate(t.arg, vs));
    if (t.tag === 'Let')
        return exports.evaluate(t.body, list_1.Cons(exports.evaluate(t.val, vs), vs));
    if (t.tag === 'Pair')
        return exports.VPair(exports.evaluate(t.fst, vs), exports.evaluate(t.snd, vs), exports.evaluate(t.type, vs));
    if (t.tag === 'Sum')
        return exports.VSum(exports.evaluate(t.left, vs), exports.evaluate(t.right, vs));
    if (t.tag === 'Inj')
        return exports.VInj(t.which, exports.evaluate(t.left, vs), exports.evaluate(t.right, vs), exports.evaluate(t.val, vs));
    if (t.tag === 'IndVoid')
        return exports.vindvoid(exports.evaluate(t.motive, vs), exports.evaluate(t.scrut, vs));
    if (t.tag === 'IndUnit')
        return exports.vindunit(exports.evaluate(t.motive, vs), exports.evaluate(t.scrut, vs), exports.evaluate(t.cas, vs));
    if (t.tag === 'IndSigma')
        return exports.vindsigma(t.usage, exports.evaluate(t.motive, vs), exports.evaluate(t.scrut, vs), exports.evaluate(t.cas, vs));
    if (t.tag === 'IndSum')
        return exports.vindsum(t.usage, exports.evaluate(t.motive, vs), exports.evaluate(t.scrut, vs), exports.evaluate(t.caseLeft, vs), exports.evaluate(t.caseRight, vs));
    if (t.tag === 'World')
        return exports.VWorld;
    if (t.tag === 'Fix')
        return exports.VFix(exports.evaluate(t.sig, vs));
    if (t.tag === 'Con')
        return exports.VCon(exports.evaluate(t.sig, vs), exports.evaluate(t.val, vs));
    if (t.tag === 'WorldToken')
        return exports.VWorldToken;
    if (t.tag === 'IndFix')
        return exports.vindfix(t.usage, exports.evaluate(t.motive, vs), exports.evaluate(t.scrut, vs), exports.evaluate(t.cas, vs));
    if (t.tag === 'UpdateWorld') {
        // updateWorld q A c ~> indSigma (\_. A) (c WorldToken) (\x y. x)
        const ty = exports.evaluate(t.type, vs);
        return exports.vindsigma(usage_1.UsageRig.default, exports.VAbs(usage_1.UsageRig.default, '_', exports.VSigma(t.usage, '_', ty, _ => exports.VWorld), _ => ty), exports.vapp(exports.evaluate(t.cont, vs), exports.VWorldToken), exports.VAbs(t.usage, 'x', ty, x => exports.VAbs(usage_1.UsageRig.one, 'w', exports.VWorld, _ => x)));
    }
    if (t.tag === 'HelloWorld')
        return exports.vhelloworld(exports.evaluate(t.arg, vs));
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
    if (e.tag === 'EIndVoid')
        return core_1.IndVoid(exports.quote(e.motive, k), t);
    if (e.tag === 'EIndUnit')
        return core_1.IndUnit(exports.quote(e.motive, k), t, exports.quote(e.cas, k));
    if (e.tag === 'EIndSigma')
        return core_1.IndSigma(e.usage, exports.quote(e.motive, k), t, exports.quote(e.cas, k));
    if (e.tag === 'EIndSum')
        return core_1.IndSum(e.usage, exports.quote(e.motive, k), t, exports.quote(e.caseLeft, k), exports.quote(e.caseRight, k));
    if (e.tag === 'EIndFix')
        return core_1.IndFix(e.usage, exports.quote(e.motive, k), t, exports.quote(e.cas, k));
    if (e.tag === 'EHelloWorld')
        return core_1.HelloWorld(t);
    return e;
};
const quote = (v, k) => {
    if (v.tag === 'VType')
        return core_1.Type;
    if (v.tag === 'VVoid')
        return core_1.Void;
    if (v.tag === 'VUnitType')
        return core_1.UnitType;
    if (v.tag === 'VUnit')
        return core_1.Unit;
    if (v.tag === 'VNe')
        return list_1.foldr((x, y) => quoteElim(y, x, k), quoteHead(v.head, k), v.spine);
    if (v.tag === 'VAbs')
        return core_1.Abs(v.usage, v.name, exports.quote(v.type, k), exports.quote(exports.vinst(v, exports.VVar(k)), k + 1));
    if (v.tag === 'VPi')
        return core_1.Pi(v.usage, v.name, exports.quote(v.type, k), exports.quote(exports.vinst(v, exports.VVar(k)), k + 1));
    if (v.tag === 'VSigma')
        return core_1.Sigma(v.usage, v.name, exports.quote(v.type, k), exports.quote(exports.vinst(v, exports.VVar(k)), k + 1));
    if (v.tag === 'VPair')
        return core_1.Pair(exports.quote(v.fst, k), exports.quote(v.snd, k), exports.quote(v.type, k));
    if (v.tag === 'VSum')
        return core_1.Sum(exports.quote(v.left, k), exports.quote(v.right, k));
    if (v.tag === 'VInj')
        return core_1.Inj(v.which, exports.quote(v.left, k), exports.quote(v.right, k), exports.quote(v.val, k));
    if (v.tag === 'VCon')
        return core_1.Con(exports.quote(v.sig, k), exports.quote(v.val, k));
    if (v.tag === 'VFix')
        return core_1.Fix(exports.quote(v.sig, k));
    if (v.tag === 'VWorld')
        return core_1.World;
    if (v.tag === 'VWorldToken')
        return core_1.WorldToken;
    return v;
};
exports.quote = quote;
const normalize = (t, vs = list_1.Nil) => exports.quote(exports.evaluate(t, vs), 0);
exports.normalize = normalize;
const show = (v, k) => C.show(exports.quote(v, k));
exports.show = show;

},{"./core":3,"./usage":10,"./utils/list":11,"./utils/utils":12}],14:[function(require,module,exports){
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
    if (tm.tag === 'Void')
        return [values_1.VType, usage_1.noUses(local.level)];
    if (tm.tag === 'UnitType')
        return [values_1.VType, usage_1.noUses(local.level)];
    if (tm.tag === 'Unit')
        return [values_1.VUnitType, usage_1.noUses(local.level)];
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
    if (tm.tag === 'Sigma') {
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
    if (tm.tag === 'Pair') {
        check(local, tm.type, values_1.VType);
        const vsigma = values_1.evaluate(tm.type, local.vs);
        if (vsigma.tag !== 'VSigma')
            return utils_1.terr(`pair without sigma type: ${core_1.show(tm)}`);
        const u1 = check(local, tm.fst, vsigma.type);
        const u2 = check(local, tm.snd, values_1.vinst(vsigma, values_1.evaluate(tm.fst, local.vs)));
        return [vsigma, usage_1.addUses(usage_1.multiplyUses(vsigma.usage, u1), u2)];
    }
    if (tm.tag === 'Sum') {
        const u1 = check(local, tm.left, values_1.VType);
        const u2 = check(local, tm.right, values_1.VType);
        return [values_1.VType, usage_1.addUses(u1, u2)];
    }
    if (tm.tag === 'Inj') {
        check(local, tm.left, values_1.VType);
        check(local, tm.right, values_1.VType);
        const vleft = values_1.evaluate(tm.left, local.vs);
        const vright = values_1.evaluate(tm.right, local.vs);
        const u = check(local, tm.val, tm.which === 'Left' ? vleft : vright);
        return [values_1.VSum(vleft, vright), u];
    }
    if (tm.tag === 'IndVoid') {
        check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VVoid, _ => values_1.VType));
        const u = check(local, tm.scrut, values_1.VVoid);
        return [values_1.vapp(values_1.evaluate(tm.motive, local.vs), values_1.evaluate(tm.scrut, local.vs)), u];
    }
    if (tm.tag === 'IndUnit') {
        check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VUnitType, _ => values_1.VType));
        const u1 = check(local, tm.scrut, values_1.VUnitType);
        const motive = values_1.evaluate(tm.motive, local.vs);
        const u2 = check(local, tm.cas, values_1.vapp(motive, values_1.VUnit));
        return [values_1.vapp(motive, values_1.evaluate(tm.scrut, local.vs)), usage_1.addUses(u1, u2)];
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
        if (!usage_1.UsageRig.sub(usage_1.UsageRig.one, tm.usage))
            return utils_1.terr(`usage must be 1 <= q in sigma induction ${core_1.show(tm)}: ${tm.usage}`);
        const [sigma, u1] = synth(local, tm.scrut);
        if (sigma.tag !== 'VSigma')
            return utils_1.terr(`not a sigma type in ${core_1.show(tm)}: ${showVal(local, sigma)}`);
        check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', sigma, _ => values_1.VType));
        const motive = values_1.evaluate(tm.motive, local.vs);
        const u2 = check(local, tm.cas, values_1.VPi(usage_1.UsageRig.multiply(tm.usage, sigma.usage), 'x', sigma.type, x => values_1.VPi(tm.usage, 'y', values_1.vinst(sigma, x), y => values_1.vapp(motive, values_1.VPair(x, y, sigma)))));
        return [values_1.vapp(motive, values_1.evaluate(tm.scrut, local.vs)), usage_1.multiplyUses(tm.usage, usage_1.addUses(u1, u2))];
    }
    if (tm.tag === 'IndSum') {
        if (!usage_1.UsageRig.sub(usage_1.UsageRig.one, tm.usage))
            return utils_1.terr(`usage must be 1 <= q in sum induction ${core_1.show(tm)}: ${tm.usage}`);
        const [sumty, u1] = synth(local, tm.scrut);
        if (sumty.tag !== 'VSum')
            return utils_1.terr(`not a sum type in ${core_1.show(tm)}: ${showVal(local, sumty)}`);
        check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', sumty, _ => values_1.VType));
        const motive = values_1.evaluate(tm.motive, local.vs);
        const uleft = check(local, tm.caseLeft, values_1.VPi(tm.usage, 'x', sumty.left, x => values_1.vapp(motive, values_1.VInj('Left', sumty.left, sumty.right, x))));
        const uright = check(local, tm.caseRight, values_1.VPi(tm.usage, 'x', sumty.right, x => values_1.vapp(motive, values_1.VInj('Right', sumty.left, sumty.right, x))));
        const u2 = usage_1.lubUses(uleft, uright);
        if (!u2) {
            const wrongVars = list_1.toArray(list_1.filter(list_1.zipWith((a, i) => [a, i], list_1.zipWith(usage_1.UsageRig.lub, uleft, uright), list_1.range(local.level)), ([x]) => x === null), ([, i]) => `left: ${list_1.index(uleft, i)}, right: ${list_1.index(uright, i)}, variable: ${i}`);
            return utils_1.terr(`usage mismatch in sum branches ${core_1.show(tm)}: ${wrongVars.join('; ')}`);
        }
        return [values_1.vapp(motive, values_1.evaluate(tm.scrut, local.vs)), usage_1.addUses(usage_1.multiplyUses(tm.usage, u1), u2)];
    }
    if (tm.tag === 'World')
        return [values_1.VType, usage_1.noUses(local.level)];
    if (tm.tag === 'WorldToken')
        return [values_1.VWorld, usage_1.noUses(local.level)];
    if (tm.tag === 'Fix') {
        const u = check(local, tm.sig, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VType, _ => values_1.VType));
        return [values_1.VType, u];
    }
    if (tm.tag === 'Con') {
        check(local, tm.sig, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VType, _ => values_1.VType));
        const vsig = values_1.evaluate(tm.sig, local.vs);
        const u = check(local, tm.val, values_1.vapp(vsig, values_1.VFix(vsig)));
        return [values_1.VFix(vsig), u];
    }
    if (tm.tag === 'IndFix') {
        if (!usage_1.UsageRig.sub(usage_1.UsageRig.one, tm.usage))
            return utils_1.terr(`usage must be 1 <= q in fix induction ${core_1.show(tm)}: ${tm.usage}`);
        const [fixty, u1] = synth(local, tm.scrut);
        if (fixty.tag !== 'VFix')
            return utils_1.terr(`not a fix type in ${core_1.show(tm)}: ${showVal(local, fixty)}`);
        check(local, tm.motive, values_1.VPi(usage_1.UsageRig.default, '_', fixty, _ => values_1.VType));
        const vmotive = values_1.evaluate(tm.motive, local.vs);
        // ((q z : Fix f) -> P z) -> (q y : f (Fix f)) -> P (Con f y)
        const u2 = check(local, tm.cas, values_1.VPi(usage_1.UsageRig.default, '_', values_1.VPi(tm.usage, 'z', fixty, z => values_1.vapp(vmotive, z)), _ => values_1.VPi(tm.usage, 'y', values_1.vapp(fixty.sig, fixty), y => values_1.vapp(vmotive, values_1.VCon(fixty.sig, y)))));
        return [values_1.vapp(vmotive, values_1.evaluate(tm.scrut, local.vs)), usage_1.addUses(usage_1.multiplyUses(tm.usage, u1), u2)];
    }
    if (tm.tag === 'UpdateWorld') {
        check(local, tm.type, values_1.VType);
        const ty = values_1.evaluate(tm.type, local.vs);
        const u = check(local, tm.cont, values_1.VPi(usage_1.UsageRig.one, '_', values_1.VWorld, _ => values_1.VSigma(tm.usage, '_', ty, _ => values_1.VWorld)));
        return [ty, usage_1.multiplyUses(tm.usage, u)];
    }
    if (tm.tag === 'HelloWorld') {
        const u = check(local, tm.arg, values_1.VWorld);
        return [values_1.VWorld, u];
    }
    return tm;
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
