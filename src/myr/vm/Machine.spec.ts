import Machine from "./Machine";
import { Algebra } from "./Algebra";
import { SimpleAlgebra } from "./SimpleAlgebra";
import { SimpleDB } from "./SimpleDB";
import { DB } from "./DB";
import { MyrObject, MyrNumeric } from "./AbstractMachine";

describe(Machine, () => {
    let machine: Machine;
    let algebra: Algebra = new SimpleAlgebra();

    beforeEach(() => { machine = new Machine(algebra); });

    it('pushes, pops, peeks', () => {
        expect(machine.peek()).toEqual(undefined)
        machine.push(new MyrNumeric(1))
        expect(machine.peek()).toEqual(new MyrNumeric(1))
        machine.push(new MyrNumeric(2))
        expect(machine.peek()).toEqual(new MyrNumeric(2))
        machine.pop()
        expect(machine.peek()).toEqual(new MyrNumeric(1))
        machine.pop()
        expect(machine.peek()).toEqual(undefined)
    })

    it('swaps', () => {
        machine.push(new MyrNumeric(1))
        machine.push(new MyrNumeric(0))
        expect(machine.peek()).toEqual(new MyrNumeric(0))
        machine.swap()
        expect(machine.peek()).toEqual(new MyrNumeric(1))
    })

    describe('arithmetic', () => {
        beforeEach(() => {
            machine.push(new MyrNumeric(2))
            machine.push(new MyrNumeric(3))
        })

        it('adds', () => {
            machine.add()
            expect(machine.peek()).toEqual(new MyrNumeric(5))
        })

        it('subtracts', () => {
            machine.subtract()
            expect(machine.peek()).toEqual(new MyrNumeric(-1))
        })

        it('multiplies', () => {
            machine.multiply()
            expect(machine.peek()).toEqual(new MyrNumeric(6))
        })

        it('divides', () => {
            machine.push(new MyrNumeric(4))
            machine.push(new MyrNumeric(2))
            machine.divide()
            expect(machine.peek()).toEqual(new MyrNumeric(2))
        })

        it('exponentiates', () => {
            machine.exponentiate()
            expect(machine.peek()).toEqual(new MyrNumeric(8))
        })

        it('compares', () => {
            machine.push(new MyrNumeric(2))
            machine.push(new MyrNumeric(3))
            machine.compare()
            expect(machine.peek()).toEqual(new MyrNumeric(-1)) // 3 > 2
            machine.pop()

            machine.push(new MyrNumeric(3))
            machine.push(new MyrNumeric(2))
            machine.compare()
            expect(machine.peek()).toEqual(new MyrNumeric(1))  // 2 < 3
            machine.pop()

            machine.push(new MyrNumeric(2))
            machine.push(new MyrNumeric(2))
            machine.compare()
            expect(machine.peek()).toEqual(new MyrNumeric(0))  // 2 == 2
            machine.pop()
        })
    })

    it('storage and retrieval of values', () => {
        let db = new SimpleDB();
        machine.push(new MyrNumeric(123));
        machine.store('hello', db);
        machine.pop();
        expect(machine.peek()).toEqual(undefined)
        machine.load('hello', db)
        machine.peek()
        expect(machine.peek()).toEqual(new MyrNumeric(123))
    })
})