# myr

a mirroring abstract machine

## Synopsis

`myr` is an abstract machine language and vm intended to be suitable for general code, but in particular reflection-oriented programming.

It is implemented in typescript.

## Goals

- learn about what is needed to build a vm capable of introspection/reflection and analysis of "running" code
- provide a tiny tool that can be a target for small language projects

## Description

`myr` specifies a tiny stack machine which can be manipulated in a few basic ways.
(The current suite of stack operations is `push`, `pop`, `swap`, and `dup`.)

There is an arithmetic (`add`, `sub`...) and logic (`and`, `or`...) suite of instructions.
There are also instructions for loading and storing values in a simple scoped store (`store` and `load`).
There are even simple comparisons (`cmp`, `cmp_gt`, etc), and a small set of jumps (`jump`, `jump_if_gt`...)

There is a suite of instructions around calling functions.
These include `call` to invoke a function by label, but also includes a mechanism
for dynamically generating code from an ast (`compile`, useful for lambdas), for invoking functions
dynamically (`invoke`).

There is also an escape hatch (`exec`) for calling out to JS for things like `console.log`. (Note it doesn't
do anything with any values that might be returned from the 'foreign' function yet.)

## Instruction Set

Instructions can have a number of different static arguments,
and may always have a `label`.
A label of "main" indicates program execution should begin at that instruction.

OpCode | Args | Description
------------ | ------------- | -------------
push | value | Places value onto the top of the stack
pop  | -- | Discard the top element of the stack
swap | -- | Juxtapose the two top elements of the stack
dup  | -- | Take the top stack element and push it ('again', resulting in a copy of the top element placed on the stack)
and | -- | Logical and` the top two elements of the stack
or | -- | Logical or (top two)
not | -- | Unary logical or the top value
inc | -- | Increment top stack elem
dec | -- | Decrement top stack elem
add | -- | Sum of top two elements of the stack
sub | -- | Difference of top two elements of the stack
mul | -- | Product of top two elements of the stack
div | -- | Quotient of top two elements of the stack
pow | -- | Power of top two elements of the stack
cmp | -- | Compare top two elements of the stack, pushing 0 if equal, 1 if top is greater, -1 if lesser
cmp_gt | -- | Compare top two, pushing true if top is greater, false otherwise
cmp_lt | -- | Compare top two, pushing true if top is lesser, false otherwise
cmp_eq | -- | Compare top two, pushing true if equal, false otherwise
jump | target | Unconditional jump to label given by `target`
jump_if_zero | -- | If stack top is zero, jump to label given by `target`
jump_if_gt | -- | If stack top is greater than second from top, jump to label given by `target`
store | key | Store top stack element under `key`
load | key | Load value at `key` onto stack top
call | target | Call function beginning at label `target`
ret | -- | Return from function (pop frame and resume execution)
invoke | -- | If stack top is a function, call it (error otherwise)
exec | jsMethod, arity | Call out to `jsMethod`, passing `arity` variables from stack top
compile | body | Call out to external compiler to assemble instructions from AST given in `body`, pushing the resulting function on the stack
arr_get | -- | Top of stack is array, second from top is index
arr_put | -- | Top of stack is array, second from top is index, third is value to assign
hash_get | -- | Top of stack is hash, second from top is key
hash_put | -- | Top of stack is hash, second from top is key, third is value to assign
send | key | Retrieve member (if function, call it). Receiver is top of stack, `key` is message
send_eq | key | Assign to member. Value to assign is top of stack, receiver is second
construct | -- | Place a 'blank' object onto the top of the stack
dump | -- | Utility to echo out the stack
mark | -- | Place tombstone on the stack
sweep | -- | Pop stack up to and including tombstone (if not found, clears the entire stack!)
halt | -- | Hard stop