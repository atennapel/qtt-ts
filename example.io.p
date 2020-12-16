let IO : Type -> Type = \(A : Type). (1 _ : World) -> A ** World;

let return : (0 A : Type) -> A -> IO A = \A x w. (x, w);

let bind : (0 A B : Type) -> IO A -> (A -> IO B) -> IO B
  = \A B x f w. indSigma 1 (\_. B ** World) (x w) (\y w. f y w);

let helloWorldIO : IO () = \w. (*, helloWorld w);

let unsafePerformIO : (0 A : Type) -> IO A -> A
  = \A x. updateWorld A x;

unsafePerformIO () helloWorldIO
