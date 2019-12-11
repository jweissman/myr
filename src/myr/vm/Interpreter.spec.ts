import Interpreter, { Compiler } from "./Interpreter"
import { SimpleAlgebra } from "./SimpleAlgebra";
import { instruct, Instruction } from "./Instruction";
import assertNever from "assert-never";
import { MyrNumeric, MyrBoolean } from "./AbstractMachine";

// support compile spec
abstract class AbstractASTNode { abstract get gen(): Instruction[] }
class Defun extends AbstractASTNode {
    constructor(public params: string[], public body: AbstractASTNode) {
        super();
    }
    get gen(): Instruction[] {
        return [instruct('noop', { label: 'defun' })]
    }
}
class Funcall extends AbstractASTNode {
    constructor(public name: string, public args: AbstractASTNode[]) {
        super();
    }
    get gen(): Instruction[] {
        // throw new Error("Method not implemented.");
        return [instruct('noop', { label: 'funcall' })]
    }
}

class Ident extends AbstractASTNode {
    constructor(public name: string) { super(); }
    get gen(): Instruction[] {
        return [instruct('load', { key: this.name })]
    }
}

class MiniCompiler extends Compiler<AbstractASTNode> {
    generateCode(ast: AbstractASTNode): Instruction[] { return ast.gen; }
}

describe(Interpreter, () => {
    let interpreter: Interpreter<AbstractASTNode>;

    beforeEach(() => {
        let algebra = new SimpleAlgebra();
        let compiler = new MiniCompiler();
        interpreter = new Interpreter(algebra, compiler);
    })

    it('swaps the top two elements of the stack', () => {
        interpreter.run([
            instruct('push', { value: new MyrNumeric(10) }),
            instruct('push', { value: new MyrNumeric(20) }),
            instruct('swap'),
        ])
        expect(interpreter.result).toEqual(10)
    })

    it('saves and loads', () => {
        interpreter.run([
            instruct('push', { value: new MyrNumeric(9) }),
            instruct('store', { key: 'hello' }),
            instruct('pop'),
            instruct('load', { key: 'hello' }),
        ])
        expect(interpreter.result).toEqual(9)
    });

    describe('compares values', () => {
        it('cmp', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(1) }),
                instruct('push', { value: new MyrNumeric(0) }),
                instruct('cmp'),
            ])
            expect(interpreter.result).toEqual(1)

            interpreter.run([
                instruct('push', { value: new MyrNumeric(0) }),
                instruct('push', { value: new MyrNumeric(1) }),
                instruct('cmp'),
            ])
            expect(interpreter.result).toEqual(-1)

            interpreter.run([
                instruct('push', { value: new MyrNumeric(1) }),
                instruct('push', { value: new MyrNumeric(1) }),
                instruct('cmp'),
            ])
            expect(interpreter.result).toEqual(0)
        })

        it('cmp_gt', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(10) }),
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('cmp_gt')
            ])
            expect(interpreter.result).toEqual(false)

            interpreter.run([
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('push', { value: new MyrNumeric(10) }),
                instruct('cmp_gt')
            ])
            expect(interpreter.result).toEqual(true)

            interpreter.run([
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('cmp_gt')
            ])
            expect(interpreter.result).toEqual(false)
        })

        it('cmp_lt', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(10) }),
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('cmp_lt')
            ])
            expect(interpreter.result).toEqual(true)

            interpreter.run([
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('push', { value: new MyrNumeric(10) }),
                instruct('cmp_lt')
            ])
            expect(interpreter.result).toEqual(false)

            interpreter.run([
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('cmp_lt')
            ])
            expect(interpreter.result).toEqual(false)
        })

        it('cmp_eq', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(10) }),
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('cmp_eq')
            ])
            expect(interpreter.result).toEqual(false)

            interpreter.run([
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('push', { value: new MyrNumeric(10) }),
                instruct('cmp_eq')
            ])
            expect(interpreter.result).toEqual(false)

            interpreter.run([
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('push', { value: new MyrNumeric(20) }),
                instruct('cmp_eq')
            ])
            expect(interpreter.result).toEqual(true)
        })
    })

    describe('boolean algebra', () => {
        it('and', () => {
            interpreter.run([
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('and'),
            ])
            expect(interpreter.result).toEqual(true)

            interpreter.run([
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('and'),
            ])
            expect(interpreter.result).toEqual(false)

            interpreter.run([
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('and'),
            ])
            expect(interpreter.result).toEqual(false)

            interpreter.run([
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('and'),
            ])
            expect(interpreter.result).toEqual(false)
        })

        it('or', () => {
            interpreter.run([
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('or'),
            ])
            expect(interpreter.result).toEqual(true)

            interpreter.run([
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('or'),
            ])
            expect(interpreter.result).toEqual(true)

            interpreter.run([
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('or'),
            ])
            expect(interpreter.result).toEqual(true)

            interpreter.run([
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('or'),
            ])
            expect(interpreter.result).toEqual(false)
        })

        it('not', () => {
            interpreter.run([
                instruct('push', { value: new MyrBoolean(true) }),
                instruct('not'),
            ])
            expect(interpreter.result).toEqual(false)

            interpreter.run([
                instruct('push', { value: new MyrBoolean(false) }),
                instruct('not'),
            ])
            expect(interpreter.result).toEqual(true)
        });


    })

    describe('arithmetic', () => {
        it('decrements values', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(10) }),
                instruct('dec'),
            ])
            expect(interpreter.result).toEqual(9)
        })

        it('increments values', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(10) }),
                instruct('inc'),
            ])
            expect(interpreter.result).toEqual(11)
        })

        it('adds values', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(2) }),
                instruct('push', { value: new MyrNumeric(3) }),
                instruct('add'),
            ])
            expect(interpreter.result).toEqual(5)
        });

        it('subtracts values', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(9) }),
                instruct('push', { value: new MyrNumeric(7) }),
                instruct('sub'),
            ])
            expect(interpreter.result).toEqual(2)
        });

        it('multiplies values', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(5) }),
                instruct('push', { value: new MyrNumeric(6) }),
                instruct('mul'),
            ])
            expect(interpreter.result).toEqual(30)
        });

        it('multiplies values', () => {
            interpreter.run([
                instruct('push', { value: new MyrNumeric(32) }),
                instruct('push', { value: new MyrNumeric(8) }),
                instruct('div'),
            ])
            expect(interpreter.result).toEqual(4)
        });
    })

    it('unconditional jumps', () => {
        interpreter.run([
            instruct('push', { value: new MyrNumeric(4) }),
            instruct('jump', { target: 'target' }),
            instruct('push', { value: new MyrNumeric(15) }), // we'll expect to skip this line
            instruct('push', { value: new MyrNumeric(8), label: 'target' }),
            instruct('add'),
        ])
        expect(interpreter.result).toEqual(12)
    })

    it('looks for a .main label', () => {
        interpreter.run([
            instruct('push', { value: new MyrNumeric(2) }),
            instruct('push', { value: new MyrNumeric(1) }),
            // ignored until here
            instruct('push', { value: new MyrNumeric(3), label: 'main' }),
            instruct('push', { value: new MyrNumeric(4) }),
            instruct('add'), // i.e., push 7
        ])
        expect(interpreter.result).toEqual(7)
        expect(interpreter.machine.stack.length).toEqual(0)
    })

    it('funcalls', () => {
        interpreter.run([
            instruct('add', { label: 'sum' }),
            instruct('ret'),
            instruct('push', { value: new MyrNumeric(4), label: 'main' }),
            instruct('push', { value: new MyrNumeric(9) }),
            instruct('call', { target: 'sum' }),
        ])
        expect(interpreter.result).toEqual(13)
    })

    // it('funcalls', () => {
    //     interpreter.run([
    //         instruct('add', { label: 'sum' }),
    //         instruct('ret'),
    //         instruct('push', { value: 4, label: 'main' }),
    //         instruct('push', { value: 9 }),
    //         instruct('call', { target: 'sum' }),
    //     ])
    //     expect(interpreter.result).toEqual(13)
    // })

    it('nested funcalls', () => {
        interpreter.run([
            // a:
            instruct('noop', { label: 'a' }),
            instruct('call', { target: 'b' }),
            instruct('ret'),
            // b:
            instruct('noop', { label: 'b' }),
            instruct('push', { value: new MyrNumeric(1) }),
            instruct('ret'),
            // main:
            instruct('noop', { label: 'main' }),
            instruct('call', { target: 'a' }),
            instruct('push', { value: new MyrNumeric(2) }),
            instruct('add'),
        ])
        expect(interpreter.result).toEqual(3)
    })

    it('compiles lambdas dynamically', () => {
        // twice = (f) => (x) => f(f(x))
        let body = new Defun(['f'],
            new Defun(
                ['x'],
                new Funcall('f',
                    [new Funcall('f',
                        [new Ident('x')]
                    )]
                )
            )
        )

        let compile = instruct('compile', { body }) 
        let program = [compile]
        interpreter.install(program)
        let initialCodeLen = interpreter.code.length
        interpreter.run(program)
        // expect that we have new code for this function...
        expect(interpreter.code.length).toBeGreaterThan(initialCodeLen)
    })

    describe('conditional jumps', () => {
        it('jump gt', () => {
            interpreter.run([
                instruct('noop', { label: 'gt_one' }),
                instruct('jump_if_gt', { value: new MyrNumeric(1), target: 'one' }),
                instruct('push', { value: new MyrNumeric(-1) }),
                instruct('ret'),
                instruct('push', { value: new MyrNumeric(100), label: 'one' }),
                instruct('ret'),
                instruct('noop', { label: 'main' }),
                instruct('push', { value: new MyrNumeric(2) }),
                instruct('call', { target: 'gt_one' }),
            ])
            expect(interpreter.result).toEqual(100)
        });

        it('jump z', () => {
            interpreter.run([
                instruct('noop', { label: 'eq_z' }),
                instruct('jump_if_zero', { target: 'one' }),
                instruct('push', { value: new MyrNumeric(-1) }),
                instruct('ret'),
                instruct('push', { value: new MyrNumeric(100), label: 'one' }),
                instruct('ret'),
                instruct('noop', { label: 'main' }),
                instruct('push', { value: new MyrNumeric(0) }),
                instruct('call', { target: 'eq_z' }),
            ])
            expect(interpreter.result).toEqual(100)
        });
    })

    it('iterates', () => {
        interpreter.run([
            instruct('noop', { label: 'multiply' }),
            instruct('store', { key: 'multiplier' }),
            instruct('store', { key: 'acc' }), // accum
            instruct('pop'),
            instruct('store', { key: 'n' }), // multiplicand
            instruct('pop'),
            instruct('noop', { label: 'loop' }),
            instruct('load', { key: 'n' }),
            instruct('dec'),
            instruct('jump_if_zero', { target: 'done' }),
            instruct('store', { key: 'n' }),
            instruct('pop'),
            instruct('load', { key: 'multiplier' }),
            instruct('load', { key: 'acc' }),
            instruct('add'),
            instruct('store', { key: 'acc' }),
            instruct('pop'),
            instruct('jump', { target: 'loop' }),
            instruct('noop', { label: 'done' }),
            instruct('load', { key: 'acc' }),
            instruct('ret'),
            instruct('noop', { label: 'main' }),
            instruct('push', { value: new MyrNumeric(12) }),
            instruct('push', { value: new MyrNumeric(24) }),
            instruct('call', { target: 'multiply' }),
        ])
        expect(interpreter.result).toEqual(288)
    })

    it('isolates variables to frames', () => {
        interpreter.run([
            instruct('noop', { label: 'subroutine' }),
            instruct('push', { value: new MyrNumeric(2) }),
            instruct('store', { key: 'i' }),
            instruct('ret'),
            instruct('noop', { label: 'main' }),
            instruct('push', { value: new MyrNumeric(1) }),
            instruct('store', { key: 'i' }),
            instruct('call', { target: 'subroutine' }),
            instruct('load', { key: 'i' }),
        ])
        expect(interpreter.result).toEqual(1)
    })

    test.todo('dynamic invoke');
})