import Interpreter from "./Interpreter"
import { SimpleAlgebra } from "./SimpleAlgebra";
import { instruct } from "./Instruction";

describe(Interpreter, () => {
    let interpreter: Interpreter<number>;

    beforeEach(() => {
        let algebra = new SimpleAlgebra();
        interpreter = new Interpreter<number>(algebra);
    })

    describe('executes instructions', () => {
        it('swaps the top two elements of the stack', () => {
            interpreter.run([
                instruct('push', { value: 10 }),
                instruct('push', { value: 20 }),
                instruct('swap'),
            ])
            expect(interpreter.result).toEqual(10)
        })

        it('decrements values', () => {
            interpreter.run([
                instruct('push', { value: 10 }),
                instruct('dec'),
            ])
            expect(interpreter.result).toEqual(9)
        })

        it('increments values', () => {
            interpreter.run([
                instruct('push', { value: 10 }),
                instruct('inc'),
            ])
            expect(interpreter.result).toEqual(11)
        })

        it('adds values', () => {
            interpreter.run([
                instruct('push', { value: 2 }),
                instruct('push', { value: 3 }),
                instruct('add'),
            ])
            expect(interpreter.result).toEqual(5)
        });

        it('subtracts values', () => {
            interpreter.run([
                instruct('push', { value: 9 }),
                instruct('push', { value: 7 }),
                instruct('sub'),
            ])
            expect(interpreter.result).toEqual(2)
        });

        it('multiplies values', () => {
            interpreter.run([
                instruct('push', { value: 5 }),
                instruct('push', { value: 6 }),
                instruct('mul'),
            ])
            expect(interpreter.result).toEqual(30)
        });

        it('multiplies values', () => {
            interpreter.run([
                instruct('push', { value: 32 }),
                instruct('push', { value: 8 }),
                instruct('div'),
            ])
            expect(interpreter.result).toEqual(4)
        });

        it('saves and loads', () => {
            interpreter.run([
                instruct('push', { value: 9 }),
                instruct('store', { key: 'hello' }),
                instruct('pop'),
                instruct('load', { key: 'hello' }),
            ])
            expect(interpreter.result).toEqual(9)
        });

        describe('compares values', () => {
            it('cmp', () => {
                interpreter.run([
                    instruct('push', { value: 1 }),
                    instruct('push', { value: 0 }),
                    instruct('cmp'),
                ])
                expect(interpreter.result).toEqual(1)

                interpreter.run([
                    instruct('push', { value: 0 }),
                    instruct('push', { value: 1 }),
                    instruct('cmp'),
                ])
                expect(interpreter.result).toEqual(-1)

                interpreter.run([
                    instruct('push', { value: 1 }),
                    instruct('push', { value: 1 }),
                    instruct('cmp'),
                ])
                expect(interpreter.result).toEqual(0)
            })

            it('cmp_gt', () => {
                interpreter.run([
                    instruct('push', { value: 10 }),
                    instruct('push', { value: 20 }),
                    instruct('cmp_gt')
                ])
                expect(interpreter.result).toEqual(false)

                interpreter.run([
                    instruct('push', { value: 20 }),
                    instruct('push', { value: 10 }),
                    instruct('cmp_gt')
                ])
                expect(interpreter.result).toEqual(true)

                interpreter.run([
                    instruct('push', { value: 20 }),
                    instruct('push', { value: 20 }),
                    instruct('cmp_gt')
                ])
                expect(interpreter.result).toEqual(false)
            })

            it('cmp_lt', () => {
                interpreter.run([
                    instruct('push', { value: 10 }),
                    instruct('push', { value: 20 }),
                    instruct('cmp_lt')
                ])
                expect(interpreter.result).toEqual(true)

                interpreter.run([
                    instruct('push', { value: 20 }),
                    instruct('push', { value: 10 }),
                    instruct('cmp_lt')
                ])
                expect(interpreter.result).toEqual(false)

                interpreter.run([
                    instruct('push', { value: 20 }),
                    instruct('push', { value: 20 }),
                    instruct('cmp_lt')
                ])
                expect(interpreter.result).toEqual(false)
            })

            it('cmp_eq', () => {
                interpreter.run([
                    instruct('push', { value: 10 }),
                    instruct('push', { value: 20 }),
                    instruct('cmp_eq')
                ])
                expect(interpreter.result).toEqual(false)

                interpreter.run([
                    instruct('push', { value: 20 }),
                    instruct('push', { value: 10 }),
                    instruct('cmp_eq')
                ])
                expect(interpreter.result).toEqual(false)

                interpreter.run([
                    instruct('push', { value: 20 }),
                    instruct('push', { value: 20 }),
                    instruct('cmp_eq')
                ])
                expect(interpreter.result).toEqual(true)
            })

        })
    })

    it('unconditional jumps', () => {
        interpreter.run([
            instruct('push', { value: 4 }),
            instruct('jump', { target: 'target' }),
            instruct('push', { value: 15 }), // we'll expect to skip this line
            instruct('push', { value: 8, label: 'target' }),
            instruct('add'),
        ])
        expect(interpreter.result).toEqual(12)
    })

    it('looks for a .main label', () => {
        interpreter.run([
            instruct('push', { value: 2 }),
            instruct('push', { value: 1 }),
            // ignored until here
            instruct('push', { value: 3, label: 'main' }),
            instruct('push', { value: 4 }),
            instruct('add'), // i.e., push 7
        ])
        expect(interpreter.result).toEqual(7)
        expect(interpreter.machine.stack.length).toEqual(1)
    })

    it('funcalls', () => {
        interpreter.run([
            instruct('add', { label: 'sum' }),
            instruct('ret'),
            instruct('push', { value: 4, label: 'main' }),
            instruct('push', { value: 9 }),
            instruct('call', { target: 'sum' }),
        ])
        expect(interpreter.result).toEqual(13)
    })

    it('funcalls', () => {
        interpreter.run([
            instruct('add', { label: 'sum' }),
            instruct('ret'),
            instruct('push', { value: 4, label: 'main' }),
            instruct('push', { value: 9 }),
            instruct('call', { target: 'sum' }),
        ])
        expect(interpreter.result).toEqual(13)
    })

    it('nested funcalls', () => {
        interpreter.run([
            // a:
            instruct('noop', { label: 'a' }),
            instruct('call', { target: 'b' }),
            instruct('ret'),
            // b:
            instruct('noop', { label: 'b' }),
            instruct('push', { value: 1 }),
            instruct('ret'),
            // main:
            instruct('noop', { label: 'main' }),
            instruct('call', { target: 'a' }),
            instruct('push', { value: 2 }),
            instruct('add'),
        ])
        expect(interpreter.result).toEqual(3)
    })

    describe('conditional jumps', () => {
        it('jump gt', () => {
            interpreter.run([
                instruct('noop', { label: 'gt_one' }),
                instruct('jump_if_gt', { value: 1, target: 'one' }),
                instruct('push', { value: -1 }),
                instruct('ret'),
                instruct('push', { value: 100, label: 'one' }),
                instruct('ret'),
                instruct('noop', { label: 'main' }),
                instruct('push', { value: 2 }),
                instruct('call', { target: 'gt_one' }),
            ])
            expect(interpreter.result).toEqual(100)
        });

        it('jump z', () => {
            interpreter.run([
                instruct('noop', { label: 'eq_z' }),
                instruct('jump_if_zero', { target: 'one' }),
                instruct('push', { value: -1 }),
                instruct('ret'),
                instruct('push', { value: 100, label: 'one' }),
                instruct('ret'),
                instruct('noop', { label: 'main' }),
                instruct('push', { value: 0 }),
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
            instruct('jump_if_zero', { target: 'done'}),
            instruct('store', { key: 'n' }),
            instruct('pop'),
            instruct('load', { key: 'multiplier'}),
            instruct('load', { key: 'acc'}),
            instruct('add'),
            instruct('store', { key: 'acc' }),
            instruct('pop'),
            instruct('jump', { target: 'loop'}),
            instruct('noop', { label: 'done' }),
            instruct('load', { key: 'acc' }),
            instruct('ret'),
            instruct('noop', { label: 'main' } ),
            instruct('push', { value: 12 }),
            instruct('push', { value: 24 }),
            instruct('call', { target: 'multiply' }),
        ])
        expect(interpreter.result).toEqual(288)
    })

    it('isolates variables to frames', () => {
        interpreter.run([
            instruct('noop', { label: 'subroutine' }),
            instruct('push', { value: 2 }),
            instruct('store', { key: 'i' }),
            instruct('ret'),
            instruct('noop', { label: 'main' }),
            instruct('push', { value: 1 }),
            instruct('store', { key: 'i' }),
            instruct('call', { target: 'subroutine' }),
            instruct('load', { key: 'i' }),
        ])
        expect(interpreter.result).toEqual(1)
    })

    test.todo('dynamic invoke');
})