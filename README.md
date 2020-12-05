This is a (hopefully) simple implementation of Quantitative Type Theory, in TypeScript.

See https://github.com/AndrasKovacs/elaboration-zoo for an explanation of how the typechecking algorithm works.

Try it out at https://atennapel.github.io/qtt-ts

Run CLI REPL:
```
yarn install
yarn start
```

Typecheck file:
```
yarn install
yarn start example.p
```

Notes:
- this implements the 0, 1, unrestricted (which I denote with *) rig
- application does not have the usage annotation, these will be infered from the function type

Currently done:
- basic type theory with dependent functions and type-in-type
- erasure check

Not yet done:
- linear check
- sigma types
- erase to untyped lambda calculus

Will not be implemented:
- implicit arguments/unification
- instance arguments
- consistent universe hierarchy
- datatypes
