import { config, log, setConfig } from './config';
import { elaborate } from './elaboration';
import { parse } from './parser';
import { Let, show, showCore, Term, Var } from './surface';
import * as C from './core';
import { Usage, UsageRig } from './usage';
import { evaluate, normalize } from './values';
import { Name } from './names';
import { verify } from './verification';
import * as Elab from './elaboration';
import * as Verif from './verification';

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
let defs: [Usage, Name, Term | null, Term][] = [];
let elocal: Elab.Local = Elab.localEmpty;
let vlocal: Verif.Local = Verif.localEmpty;

export const initREPL = () => {
  showStackTrace = false;
  defs = [];
  elocal = Elab.localEmpty;
  vlocal = Verif.localEmpty;
};

export const runREPL = (s_: string, cb: (msg: string, err?: boolean) => void) => {
  try {
    let s = s_.trim();
    if (s === ':help' || s === ':h')
      return cb(help);
    if (s === ':d' || s === ':debug') {
      const d = !config.debug;
      setConfig({ debug: d });
      return cb(`debug: ${d}`);
    }
    if (s === ':showStackTrace') {
      showStackTrace = !showStackTrace;
      return cb(`showStackTrace: ${showStackTrace}`);
    }
    if (s === ':defs')
      return cb(defs.map(([u, x, t, v]) => `let ${u === '*' ? '' : `${u} `}${x}${t ? ` : ${show(t)}` : ''} = ${show(v)}`).join('\n'));
    if (s === ':clear') {
      defs = [];
      elocal = Elab.localEmpty;
      vlocal = Verif.localEmpty;
      return cb(`cleared definitions`);
    }
    if (s === ':undoDef') {
      if (defs.length > 0) {
        const [u, x, t, v] = (defs.pop() as any);
        elocal = Elab.unsafeLocalPop(elocal);
        vlocal = Verif.unsafeLocalPop(vlocal);
        return cb(`undid let ${u === '*' ? '' : `${u} `}${x}${t ? ` : ${show(t)}` : ''} = ${show(v)}`);
      }
      cb(`no def to undo`);
    }
    let typeOnly = false;    
    if (s.startsWith(':type') || s.startsWith(':t')) {
      typeOnly = true;
      s = s.startsWith(':type') ? s.slice(5) : s.slice(2);
    }
    if (s.startsWith(':')) throw new Error(`invalid command: ${s}`);

    log(() => 'PARSE');
    let term = parse(s, true);
    let isDef = false;
    let usage = UsageRig.default;
    if (term.tag === 'Let' && term.body === null) {
      isDef = true;
      usage = term.usage;
      term = Let(term.usage === UsageRig.zero ? UsageRig.default : term.usage, term.name, term.type, term.val, Var(term.name));
    }
    log(() => show(term));

    log(() => 'ELABORATE');
    const [eterm, etype] = elaborate(term, elocal);
    log(() => C.show(eterm));
    log(() => showCore(eterm));
    log(() => C.show(etype));
    log(() => showCore(etype));

    log(() => 'VERIFICATION');
    const verifty = verify(eterm, vlocal);

    let normstr = '';
    if (!typeOnly) {
      log(() => 'NORMALIZE');
      const norm = normalize(eterm, elocal.vs);
      log(() => C.show(norm));
      log(() => showCore(norm));
      normstr = `\nnorm: ${showCore(norm)}`;
    }

    const etermstr = showCore(eterm, elocal.ns);

    if (isDef && term.tag === 'Let') {
      defs.push([usage, term.name, term.type, term.val]);
      const value = evaluate(eterm, elocal.vs);
      elocal = Elab.localExtend(elocal, term.name, evaluate(etype, elocal.vs), usage, value);
      vlocal = Verif.localExtend(vlocal, evaluate(verifty, vlocal.vs), usage, value);
    }

    return cb(`term: ${show(term)}\ntype: ${showCore(etype)}\netrm: ${etermstr}${normstr}`);
  } catch (err) {
    if (showStackTrace) console.error(err);
    return cb(`${err}`, true);
  }
};
