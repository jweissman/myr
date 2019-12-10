# myr

a mirroring abstract machine

## synopsis

`myr` is an abstract machine language and vm intended to be suitable for general code, but in particular reflection-oriented programming.

It is implemented in typescript.

## goals

- learn about what is needed to build a vm capable of introspection/reflection and analysis of "running" code
- provide a tiny tool that can be a target for small language projects

## description

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

## instructions

OpCode | Args | Description
------------ | ------------- | -------------
push | value | Places value onto the top of the stack
pop  | -- | Discard the top element of the stack
swap | -- | Juxtapose the two top elements of the stack
dup  | -- | Take the top stack element and `push` it ('again')
and | -- | Logical `and` the top two elements of the stack
or | -- | Logical `or` (top two)
not | -- | Unary logical `or` the top value
...
