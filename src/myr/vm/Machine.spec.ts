import Machine from "./Machine";
import { Algebra } from "./Algebra";
import { SimpleAlgebra } from "./SimpleAlgebra";
import { SimpleDB } from "./SimpleDB";
import { DB } from "./DB";

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
            machine.push(2)
            machine.push(3)
            machine.compare()
            expect(machine.peek()).toEqual(-1) // 3 > 2
            machine.pop()

            machine.push(3)
            machine.push(2)
            machine.compare()
            expect(machine.peek()).toEqual(1)  // 2 < 3
            machine.pop()

            machine.push(2)
            machine.push(2)
            machine.compare()
            expect(machine.peek()).toEqual(0)  // 2 == 2
            machine.pop()
        })
    })

    it('storage and retrieval of values', () => {
        let db: DB<number, string> = new SimpleDB();
        machine.push(123);
        machine.store('hello', db);
        machine.pop();
        expect(machine.peek()).toEqual(undefined)
        machine.load('hello', db)
        expect(machine.peek()).toEqual(123)
    })
})