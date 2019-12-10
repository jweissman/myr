import { AbstractMachine } from "./AbstractMachine";
import { Algebra } from "./Algebra";
import { DB } from "./DB";

export type Value = string | boolean | number
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

    topIsZero() { return this.algebra.isZero(this.stackTop as number); }

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
        let top = this.stackTop;
        this.stack.pop()
        let second = this.stackTop;
        this.stack.pop()
        // let [a,b] = this.topTwo;
        let result: number = this.algebra.compare(second as number, top as number);
        this.stack.push(result as Value);
    }

    decrement() {
        let top = this.stackTop as number;
        this.stack.pop();
        this.stack.push(this.algebra.decrement(top));
    }

    increment() {
        let top = this.stackTop as number;
        this.stack.pop();
        this.stack.push(this.algebra.increment(top));
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
            db.put(key, top)
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
        let result = this.algebra.not(this.stackTop as boolean);
        this.stack.pop();
        this.push(result);
    }

    private binaryOp(fn: (left: number, right: number) => number): void {
        let [right, left] = this.topTwo as [number, number];
        if (left !== undefined && right !== undefined) {
            let result = fn(left, right)
            this.stack.pop();
            this.stack.pop();
            this.push(result);
        } else {
            throw new Error("Must have at least two items to perform binary operations?")
        }
    }

    private binaryOpLog(fn: (left: boolean, right: boolean) => boolean): void {
        let [right, left] = this.topTwo as [boolean,boolean];
        if (left !== undefined && right !== undefined) {
            let result = fn(left, right)
            this.stack.pop();
            this.stack.pop();
            this.push(result);
        } else {
            throw new Error("Must have at least two items to perform binary operations?")
        }
    }
}
