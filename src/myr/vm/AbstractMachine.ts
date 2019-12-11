import { DB } from "./DB";

export abstract class MyrObject {
    abstract toJS(): any;
}

export class MyrNumeric extends MyrObject {
    constructor(public value: number) { super(); }
    toJS(): number { return this.value; }
}
export class MyrString extends MyrObject {
    constructor(public value: string) { super(); }
    toJS(): string { return this.value; }
}
export class MyrBoolean extends MyrObject {
    constructor(public value: boolean) { super(); }
    toJS(): boolean { return this.value; }
}
export class MyrFunction extends MyrObject {
    constructor(public label: string, public closure: DB) {
        super();
    }
    toJS(): string { return `MyrFunction(${this.label})`; }
}

export class MyrNil extends MyrObject {
    toJS(): null { return null; }
}

export class MyrArray extends MyrObject {
    constructor(public elements: MyrObject[] = []) {
        super();
    } 
    toJS() {
        return this.elements.map(elem => elem.toJS());
    }
}

// class MyrHash
// class MyrClass 

export type Value = MyrObject

export abstract class AbstractMachine {
    abstract push(value: Value): void;
    abstract pop(): void;
    abstract peek(): Value;

    abstract decrement(): void;
    abstract add(): void;
    abstract subtract(): void;
    abstract multiply(): void;
    abstract divide(): void;
    abstract exponentiate(): void;

    abstract swap(): void;
    abstract compare(): void;

    abstract store(key: string, db: DB): void;
    abstract load(key: string, db: DB): void;

    abstract arrayPut(): void;
    abstract arrayGet(): void;
}
