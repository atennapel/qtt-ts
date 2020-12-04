import { parse } from './parser';
import { show, showCore } from './surface';
import * as fs from 'fs';
import { elaborate } from './elaboration';
import { normalize } from './values';
import { setConfig } from './config';
import { verify } from './verification';

setConfig({ debug: false });

const s = fs.readFileSync('test.p', 'utf8');
const e = parse(s);
console.log(show(e));
const [tm, ty] = elaborate(e);
console.log(showCore(tm));
console.log(showCore(ty));
verify(tm);
console.log(showCore(normalize(tm)));
