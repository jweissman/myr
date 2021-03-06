import Machine from "./Machine";
import { Algebra } from "./Algebra";
import { SimpleAlgebra } from "./SimpleAlgebra";
import { SimpleDB } from "./SimpleDB";
import { MyrNumeric, MyrArray, MyrString, MyrObject, MyrHash } from "./Types";

describe(Machine, () => {
    let machine: Machine;
    let algebra: Algebra = new SimpleAlgebra();

    beforeEach(() => { machine = new Machine(algebra); });

    it('pushes, pops, peeks', () => {
        expect(machine.peek()).toEqual(undefined)
        machine.push(new MyrNumeric(1))
        expect((machine.peek() as MyrNumeric).value).toEqual(1)
        machine.push(new MyrNumeric(2))
        expect((machine.peek() as MyrNumeric).value).toEqual(2)
        machine.pop()
        expect((machine.peek() as MyrNumeric).value).toEqual(1)
        machine.pop()
        expect(machine.peek()).toEqual(undefined)
    })

    it('swaps', () => {
        machine.push(new MyrNumeric(1))
        machine.push(new MyrNumeric(0))
        expect((machine.peek() as MyrNumeric).value).toEqual(0)
        machine.swap()
        expect((machine.peek() as MyrNumeric).value).toEqual(1)
    })

    describe('arithmetic', () => {
        beforeEach(() => {
            machine.push(new MyrNumeric(2))
            machine.push(new MyrNumeric(3))
        })

        it('adds', () => {
            machine.add()
            // expect(machine.peek()).toEqual(new MyrNumeric(5))
            expect((machine.peek() as MyrNumeric).value).toEqual(5)
        })

        it('subtracts', () => {
            machine.subtract()
            // expect(machine.peek()).toEqual(new MyrNumeric(-1))
            expect((machine.peek() as MyrNumeric).value).toEqual(-1)
        })

        it('multiplies', () => {
            machine.multiply()
            expect((machine.peek() as MyrNumeric).value).toEqual(6)
        })

        it('divides', () => {
            machine.push(new MyrNumeric(4))
            machine.push(new MyrNumeric(2))
            machine.divide()
            expect((machine.peek() as MyrNumeric).value).toEqual(2)
        })

        it('exponentiates', () => {
            machine.exponentiate()
            expect((machine.peek() as MyrNumeric).value).toEqual(8)
        })

        it('compares', () => {
            machine.push(new MyrNumeric(2))
            machine.push(new MyrNumeric(3))
            machine.compare()
            expect((machine.peek() as MyrNumeric).value).toEqual(-1) // 3 > 2
            machine.pop()

            machine.push(new MyrNumeric(3))
            machine.push(new MyrNumeric(2))
            machine.compare()
            expect((machine.peek() as MyrNumeric).value).toEqual(1)  // 2 < 3
            machine.pop()

            machine.push(new MyrNumeric(2))
            machine.push(new MyrNumeric(2))
            machine.compare()
            expect((machine.peek() as MyrNumeric).value).toEqual(0)  // 2 == 2
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
        expect((machine.peek() as MyrNumeric).value).toEqual(123)
    })

    it('array assembly', () => {
        let db = new SimpleDB();
        machine.push(new MyrArray([]))
        machine.store("arr", db)
        machine.push(new MyrNumeric(0)) // index
        machine.push(new MyrString("hello")) // value
        machine.arrayPut();

        machine.load("arr", db)
        machine.push(new MyrNumeric(1)) // index
        machine.push(new MyrString("world")) // value
        machine.arrayPut();

        machine.load("arr", db)
        expect((machine.peek() as MyrObject).equals(new MyrArray([
            new MyrString("hello"),
            new MyrString("world"),
        ]))).toBe(true)
    })

    it('array index', () => {
        let array = new MyrArray([
            new MyrString("hello"),
            new MyrString("there"),
            new MyrString("world")
        ])

        machine.push(array)
        machine.push(new MyrNumeric(0))
        machine.arrayGet();
        expect((machine.peek() as MyrString).value).toEqual("hello")

        machine.push(array);
        machine.push(new MyrNumeric(1))
        machine.arrayGet();
        expect((machine.peek() as MyrString).value).toEqual("there")

        machine.push(array);
        machine.push(new MyrNumeric(2))
        machine.arrayGet();
        expect((machine.peek() as MyrString).value).toEqual("world")
    })

    it('hash assemble', () => {
        let hash = new MyrHash();
        machine.push(hash);

        // should this be a tuple
        machine.push(new MyrString("hello")); // key -- hard limited to strings
        machine.push(new MyrNumeric(12345)); // value

        machine.hashPut(); // value
        expect((machine.peek() as MyrHash).keyValues['hello'].equals(new MyrNumeric(12345))).toEqual(true);
    })

    it('hash inspect', () => {
        let hash = new MyrHash({
            name: new MyrString("John Smith"),
            scores: new MyrArray([
                new MyrNumeric(123),
                new MyrNumeric(89),
                new MyrNumeric(95),
            ])
        });
        machine.push(hash);
        machine.push(new MyrString("name"));
        machine.hashGet();
        expect((machine.peek() as MyrString).value).toEqual("John Smith")

        machine.push(hash);
        machine.push(new MyrString("scores"));
        machine.hashGet();
        expect((machine.peek() as MyrObject).equals(new MyrArray([
            new MyrNumeric(123),
            new MyrNumeric(89),
            new MyrNumeric(95),
        ]))).toBe(true);
    })
})