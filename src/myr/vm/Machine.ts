import { AbstractMachine, Value, MyrNumeric, MyrBoolean, MyrArray, MyrObject, MyrString, MyrHash, MyrNil } from "./AbstractMachine";
import { Algebra } from "./Algebra";
import { DB } from "./DB";

export default class Machine extends AbstractMachine {
    stack: Array<Value> = [];

    constructor(private algebra: Algebra) { //}, private db: DB<T, string>) {
        super();
    }

    get stackTop() { return this.stack[this.stack.length - 1]; }
    get topTwo(): [Value, Value] { 
        return [
            this.stack[this.stack.length - 1],
            this.stack[this.stack.length - 2]
        ];
    }

    topN(arity: number): Value[] {
        return this.stack.slice(this.stack.length - arity);
        // throw new Error("Method not implemented.");
    }

    topIsZero() { return this.algebra.isZero((this.stackTop as MyrNumeric).value); }

    peek(): Value {
        if (this.stackTop !== null) {
            return this.stackTop;
        } else {
            throw new Error("stack top was null, nothing to peek");
        }
    }

    push(value: Value): void {
        // console.log("Machine#push", { value })
        this.stack.push(value);
    }

    pop(): void {
        if (this.stack.length) {
            this.stack.pop();
        } else {
            throw new Error("Attempted to pop an empty stack.");
        }
    }

    swap(): void {
        let top = this.stackTop;
        this.stack.pop()
        let second = this.stackTop;
        this.stack.pop()
        this.stack.push(top)
        this.stack.push(second)
    }

    compare(): void {
        let top = this.stackTop as MyrNumeric;
        this.stack.pop()
        let second = this.stackTop as MyrNumeric;
        this.stack.pop()
        // let [a,b] = this.topTwo;
        let result: number = this.algebra.compare(second.value, top.value);
        this.stack.push(new MyrNumeric(result));
    }

    decrement() {
        let top = (this.stackTop as MyrNumeric).value; //number;
        this.stack.pop();
        let result = this.algebra.decrement(top);
        this.stack.push(new MyrNumeric(result));
    }

    increment() {
        // let top = this.stackTop as number;
        let top = (this.stackTop as MyrNumeric).value; //number;
        this.stack.pop();
        let result = this.algebra.increment(top);
        this.stack.push(new MyrNumeric(result));
    }

    add(): void {
        this.binaryOp(this.algebra.sum)
    }

    subtract(): void {
        this.binaryOp(this.algebra.difference)
    }

    multiply(): void {
        this.binaryOp(this.algebra.product)
    }

    divide(): void {
        this.binaryOp(this.algebra.quotient)
    }

    exponentiate(): void {
        this.binaryOp(this.algebra.power)
    }

    store(key: string, db: DB): void {
        let top = this.peek();
        if (top !== undefined) {
            // console.log("PUT " + key + " into " + JSON.stringify(db))
            db.put(key, top)
            // this.pop();
            // console.log("(after) PUT " + key + " into " + JSON.stringify(db))
        } else {
            throw new Error("Called #store on an empty stack.");
        }
    }

    load(key: string, db: DB): void {
        this.push(db.get(key));
    }

    and() {
        return this.binaryOpLog(this.algebra.and);
    }

    or() {
        return this.binaryOpLog(this.algebra.or);
    }

    not() {
        let result = this.algebra.not((this.stackTop as MyrBoolean).value);
        this.stack.pop();
        this.push(new MyrBoolean(result));
    }

    arrayPut() {
        // console.log("ARRAY PUT", { stack: this.stack })
        let valueToPush = this.stackTop;
        this.stack.pop();
        let indexToAssign = this.stackTop as MyrNumeric;
        this.stack.pop();
        let theArray = this.stackTop as MyrArray;
        this.stack.pop();
        //console.log("ARRAY PUT", { valueToPush, indexToAssign, theArray })
        theArray.elements[indexToAssign.value] = valueToPush;
        // this.stack.push(theArray);
    }

    arrayGet(): void {
        let indexToRetrieve = this.stackTop as MyrNumeric;
        this.stack.pop();
        let theArray = this.stackTop as MyrArray;
        this.stack.pop();
        let retrieved = theArray.elements[indexToRetrieve.value];
        if (retrieved !== undefined) {
            this.stack.push(retrieved);
        } else {
            this.stack.push(new MyrNil())
            // throw new Error("array index out of bounds")
        }
    }

    hashPut() {
        // hash | key | val
        let valueToAssign = this.stackTop as MyrObject;
        this.stack.pop()
        let key = this.stackTop as MyrString;
        this.stack.pop()
        let hash = this.stackTop as MyrHash;
        this.stack.pop()

        hash.set(key, valueToAssign);
        this.stack.push(hash);
        // throw new Error("Method not implemented.");
    }

    hashGet() {
        let keyToRetrieve = this.stackTop as MyrString;
        this.stack.pop();
        let hash = this.stackTop as MyrHash;
        this.stack.pop();

        let retrieved: MyrObject = hash.get(keyToRetrieve)
        // console.log({ key: keyToRetrieve, hash, retrieved })

        this.stack.push(retrieved);
    }

    // objSet() {
    //     let member = this.stackTop as MyrObject;
    //     this.stack.pop();
    //     let key = this.stackTop as MyrString;
    //     this.stack.pop();
    //     let obj = this.stackTop as MyrObject;
    //     this.stack.pop();
    //     obj.members.put(key.value, member);
    //     return;
    // }

    // objGet() {
    //     let key = this.stackTop as MyrString;
    //     this.stack.pop();
    //     let obj = this.stackTop as MyrObject;
    //     this.stack.pop();
    //     let retreived = obj.members.get(key.value);
    //     this.stack.push(retreived);
    // }

    private binaryOp(fn: (left: number, right: number) => number): void {
        let [right, left] = this.topTwo as [MyrNumeric, MyrNumeric];
        if (left !== undefined && right !== undefined) {
            let result = fn(left.value, right.value)
            this.stack.pop();
            this.stack.pop();
            this.push(new MyrNumeric(result));
        } else {
            throw new Error("Must have at least two items to perform binary operations?")
        }
    }

    private binaryOpLog(fn: (left: boolean, right: boolean) => boolean): void {
        let [right, left] = this.topTwo as [MyrBoolean,MyrBoolean];
        if (left !== undefined && right !== undefined) {
            let result = fn(left.value, right.value)
            this.stack.pop();
            this.stack.pop();
            this.push(new MyrBoolean(result));
        } else {
            throw new Error("Must have at least two items to perform binary operations?")
        }
    }
}
