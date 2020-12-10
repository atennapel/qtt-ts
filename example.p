let id : (0 A : Type) -> (1 _ : A) -> A = \A x. x;
let const : (0 A B : Type) -> (1 _ : A) -> (0 _ : B) -> A = \A B x y. x;

let the = id;

let 0 Eq : (A : Type) -> A -> A -> Type = \A x y. (F : A -> Type) -> F x -> F y;
let Refl : (0 A : Type) -> (x : A) -> Eq A x x = \A x F y. y;

let 0 Bool = (0 A : Type) -> A -> A -> A;
let True : Bool = \A t f. t;
let False : Bool = \A t f. f;
let if : (0 A : Type) -> Bool -> A -> A -> A = \A c a b. c A a b;
let not : Bool -> Bool = \b. if Bool b False True;
let or : Bool -> Bool -> Bool = \a b. if Bool a True b;
let and : Bool -> Bool -> Bool = \a b. if Bool a b False;

let 0 Nat = (0 A : Type) -> A -> (A -> A) -> A;
let Z : Nat = \A z s. z;
let S : Nat -> Nat = \n A z s. s (n A z s);
let cataNat : (0 A : Type) -> Nat -> A -> (A -> A) -> A = \A n z s. n A z s;
let add : Nat -> Nat -> Nat = \a b. cataNat Nat a b S;
let mul : Nat -> Nat -> Nat = \a b. cataNat Nat a Z (add b);

let 0 Monoid = (0 A : Type) ** (unit : A) ** (append : A -> A -> A) ** ();
let natMonoid : Monoid = (Nat, Z, add, *);

let 0 Box0 = \(A : Type). (0 x : A) ** ();
let 0 Box1 = \(A : Type). (1 x : A) ** ();

the (Eq Nat (add 1 2) 3)
  (Refl Nat 3)
