import { DB } from "./DB";
import { Instruction } from "./Instruction";
import { SimpleDB } from "./SimpleDB";

export class MyrObject {
    public members: DB = new SimpleDB();
    // private klass
    constructor(public name: string='') {}
    // private members: { [name: string]: MyrObject } = {};
    // private methods: { [name: string]: MyrFunction } = {};
    // klass!: MyrClass;
    toJS(): any { return this; };

    // createMember(name: string, value: MyrObject) {
    //     this.members[name] = value;
    // }
    // createMethod(name: string, value: MyrObject) {
    //     this.methods[name] = value;
    // }
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

//  MyrTuple // :D

export class MyrHash extends MyrObject {
    constructor(public keyValues: {[key: string]: MyrObject} = {}) { super();}
    toJS() {
        let fields = { ...this.keyValues };
        Object.keys(fields).map((key) => {
            fields[key] = fields[key].toJS();
        });
        return fields;
    }
    set(key: MyrString, valueToAssign: MyrObject) {
        this.keyValues[key.value] = valueToAssign;
    }
    get(keyToRetrieve: MyrString): MyrObject {
        return this.keyValues[keyToRetrieve.value];
    }
}

export class MyrClass extends MyrObject {
    constructor(public name: string, public ctor: Instruction[] = []) { super(); }
    toJS() {
        return this; //{ className: this.name }
        // throw new Error("MyrClass#toJS -- Method not implemented.");
    }
}

// const objectFactory = (klass: MyrClass) => {
//     let object: MyrObject = new MyrObject();
//     object.klass = klass;
//     return object;
// }

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

    abstract hashPut(): void;
    abstract hashGet(): void;

    // enter/exit scopes (object/module...)
    // abstract objEnter(): void;
    abstract selfSet(): void;
    abstract selfGet(): void;
    // abstract objExit(): void;
    // these may be more for the interpreter layer??
    // which governs the scoped db currently
    // abstract pushSelf(): void;
    // abstract popSelf(): void;
}
