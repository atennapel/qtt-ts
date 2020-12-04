import { config, log, setConfig } from './config';
import { elaborate } from './elaboration';
import { parse } from './parser';
import { Let, show, showCore, Term, Var } from './surface';
import * as C from './core';
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
`.trim();

let showStackTrace = false;
let defs: [Name, Term | null, Term][] = [];
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
      return cb(defs.map(([x, t, v]) => `let ${x}${t ? ` : ${show(t)}` : ''} = ${show(v)}`).join('\n'));
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
    if (s.startsWith(':')) throw new Error(`invalid command: ${s}`);

    log(() => 'PARSE');
    let term = parse(s, true);
    let isDef = false;
    if (term.tag === 'Let' && term.body === null) {
      isDef = true;
      term = Let(term.name, term.type, term.val, Var(term.name));
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
      defs.push([term.name, term.type, term.val]);
      elocal = Elab.localExtend(elocal, term.name, evaluate(etype, elocal.vs), evaluate(eterm, elocal.vs));
      vlocal = Verif.localExtend(vlocal, evaluate(verifty, vlocal.vs), evaluate(eterm, vlocal.vs));
    }

    return cb(`term: ${show(term)}\ntype: ${showCore(etype)}\netrm: ${etermstr}${normstr}`);
  } catch (err) {
    if (showStackTrace) console.error(err);
    return cb(`${err}`, true);
  }
};
