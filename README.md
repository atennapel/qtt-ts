This is a (hopefully) simple implementation of Quantitative Type Theory/Graded Dependent Types, in TypeScript.

Try it out at https://atennapel.github.io/qtt-ts

References:
- "Syntax and Semantics of Quantitative Type Theory"
- "A graded dependent type system with a usage-aware semantics", I followed the rules from here
- See https://github.com/AndrasKovacs/elaboration-zoo for an explanation of how the typechecking algorithm works.
- I used some of the rules from https://github.com/BramvanVeenschoten1/qtt

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
- this currently implements the 0, 1- (affine), 1, 1+ (relevant), * (unrestricted) rig (the five-point linearity semiring), but the typechecker can handle any partially ordered semiring
- application does not have the usage annotation, these will be infered from the function type
- lambda with unannotated usage will be * by default unless checked against a function type, then it will use the usage from the type

Currently done:
- basic type theory with dependent functions and type-in-type
- erasure check
- linear check
- void, unit, sigma and sum types

Not yet done:
- elimination of types
- erase to untyped lambda calculus

Will not be implemented:
- implicit arguments/unification
- instance arguments
- consistent universe hierarchy
- datatypes

Bugs:
- "let 0" will fail in REPL
