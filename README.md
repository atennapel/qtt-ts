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
- checks from graded dependent types
- void, unit, sigma and sum types
- induction on the types
- fixpoint type
- a "world" token to play around with

Not yet done:
- erase to untyped lambda calculus

Will not be implemented:
- implicit arguments/unification
- instance arguments
- consistent universe hierarchy
- inductive datatypes

The language:
```
u ::= elements of partially ordered semigroup

t ::=
  Type                -- universe
  x                   -- variable
  (u x : t) -> t      -- pi/function type
  \(u x : t). t       -- lambda
  t t                 -- application
  let u x : t = t; t  -- let

  Void                -- void/empty type
  indVoid P x         -- void induction

  ()                  -- unit type
  *                   -- unit value
  indUnit P x p       -- unit induction

  (u x : t) ** t      -- sigma/pair type
  (t, t : t)          -- pair
  indSigma t t t      -- sigma induction

  t ++ t              -- sum type
  Left t t t          -- left injection
  Right t t t         -- right injection
  indSum u t t t t    -- sum induction

  Fix t               -- fixpoint of a functor
  Con t t             -- constructor of fixpoint
  indFix u t t t      -- fix induction

  World               -- the world
  WorldToken          -- token to represent the world
  updateWorld u t t   -- update the world
```
