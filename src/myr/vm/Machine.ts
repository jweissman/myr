import { AbstractMachine } from "./AbstractMachine";
import { Algebra } from "./Algebra";
import { DB } from "./DB";
import { SimpleDB } from "./SimpleDB";

export default class Machine<T> extends AbstractMachine<T, string> {
    stack: Array<T> = [];
    db: DB<T, string> = new SimpleDB<T>();

    constructor(private algebra: Algebra<T>) {
        super();
    }

    get stackTop() { return this.stack[this.stack.length - 1]; }
    get topTwo(): [T,T] { 
        return [
            this.stack[this.stack.length - 1],
            this.stack[this.stack.length - 2]
        ];
    }

    topIsZero() { return this.algebra.isZero(this.stackTop); }

    peek(): T | undefined {
        if (this.stackTop !== null) {
            return this.stackTop;
        } else {
            throw new Error("stack top was null, nothing to peek");
        }
    }

    push(value: T): void {
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

    compare(): 0 | 1 | -1 {
        let [a,b] = this.topTwo;
        return this.algebra.compare(b,a);
    }

    dec() {
        let top = this.stackTop;
        this.stack.pop();
        this.stack.push(this.algebra.decrement(top));
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

    store(key: string): void {
        let top = this.peek();
        if (top) {
            this.db.put(key, top)
        } else {
            throw new Error("Called #store on an empty stack.");
        }
    }

    load(key: string): void {
        this.push(this.db.get(key));
    }

    private binaryOp(fn: (left: T, right: T) => T): void {

    // get topTwo(): [T,T] { 
        let [right, left] = this.topTwo;
        // this.pop();
        // let left = this.peek();
        // this.pop();
        if (left && right) {
            let result = fn(left, right)
            this.push(result);
        } else {
            throw new Error("Must have at least two items to perform binary operations?")
        }
    }
}
