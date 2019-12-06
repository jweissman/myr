import Machine from "./Machine";
import { Algebra } from "./Algebra";
import { SimpleAlgebra } from "./SimpleAlgebra";

describe(Machine, () => {
    let machine: Machine<number>;
    let algebra: Algebra<number> = new SimpleAlgebra();

    beforeEach(() => { machine = new Machine(algebra); });

    it('pushes, pops, peeks', () => {
        expect(machine.peek()).toEqual(undefined)
        machine.push(1)
        expect(machine.peek()).toEqual(1)
        machine.push(2)
        expect(machine.peek()).toEqual(2)
        machine.pop()
        expect(machine.peek()).toEqual(1)
        machine.pop()
        expect(machine.peek()).toEqual(undefined)
    })

    it('swaps', () => {
        machine.push(1)
        machine.push(0)
        expect(machine.peek()).toEqual(0)
        machine.swap()
        expect(machine.peek()).toEqual(1)
    })

    describe('arithmetic', () => {
        beforeEach(() => {
            machine.push(2)
            machine.push(3)
        })

        it('adds', () => {
            machine.add()
            expect(machine.peek()).toEqual(5)
        })

        it('subtracts', () => {
            machine.subtract()
            expect(machine.peek()).toEqual(-1)
        })

        it('multiplies', () => {
            machine.multiply()
            expect(machine.peek()).toEqual(6)
        })

        it('divides', () => {
            machine.divide()
            expect(machine.peek()).toEqual(2/3)
        })

        it('exponentiates', () => {
            machine.exponentiate()
            expect(machine.peek()).toEqual(8)
        })

        it('compares', () => {
            expect(machine.compare()).toEqual(-1) // 3 > 2
            machine.swap()
            expect(machine.compare()).toEqual(1)  // 2 < 3
            machine.push(2)
            expect(machine.compare()).toEqual(0)  // 2 == 2
        })
    })

    it('storage and retrieval of values', () => {
        machine.push(123);
        machine.store('hello');
        machine.pop();
        expect(machine.peek()).toEqual(undefined)
        machine.load('hello')
        expect(machine.peek()).toEqual(123)
    })
})