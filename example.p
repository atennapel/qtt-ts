let id : (A : Type) -> A -> A = \A x. x;
let const : (A B : Type) -> A -> B -> A = \A B x y. x;

let the = id;

let Eq : (A : Type) -> A -> A -> Type = \A x y. (F : A -> Type) -> F x -> F y;
let Refl : (A : Type) -> (x : A) -> Eq A x x = \A x F y. y;

let U = (A : Type) -> A -> A;
let Unit : U = \A x. x;

let Bool = (A : Type) -> A -> A -> A;
let True : Bool = \A t f. t;
let False : Bool = \A t f. f;
let if : (A : Type) -> Bool -> A -> A -> A = \A c a b. c A a b;
let not : Bool -> Bool = \b. if Bool b False True;
let or : Bool -> Bool -> Bool = \a b. if Bool a True b;
let and : Bool -> Bool -> Bool = \a b. if Bool a b False;

let Nat = (A : Type) -> A -> (A -> A) -> A;
let Z : Nat = \A z s. z;
let S : Nat -> Nat = \n A z s. s (n A z s);
let cataNat : (A : Type) -> Nat -> A -> (A -> A) -> A = \A n z s. n A z s;
let add : Nat -> Nat -> Nat = \a b. cataNat Nat a b S;
let mul : Nat -> Nat -> Nat = \a b. cataNat Nat a Z (add b);

the (Eq Nat (add 1 2) 3)
  (Refl Nat 3)
