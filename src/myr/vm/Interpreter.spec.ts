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

        it('saves and loads', () => {
            interpreter.run([
                instruct('push', { value: 9 }),
                instruct('store', { key: 'hello' }),
                instruct('pop'),
                instruct('load', { key: 'hello' }),
            ])
            expect(interpreter.result).toEqual(9)
        });
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
            instruct('add'),
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

    it('conditional jumps', () => {
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
    })
})