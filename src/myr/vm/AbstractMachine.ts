import { DB } from "./DB";
import { SimpleDB } from "./SimpleDB";

function omit(key: string, obj: object): object {
    const { [key]: omitted, ...rest }: { [name: string]: any } = obj;
    return rest;
}

export class MyrObject {
    public jsMethods: {[key: string]: Function} = {};
    public members: DB = new SimpleDB();
    get value(): any {
        let comparableMembers = omit("initialize", this.members.toJS());
        // if (this.members.has("class") && this.members.get("class").name === 'MyrArray') {
        //     comparableMembers = omit("arr", this.members.toJS());
        // }
        return comparableMembers;
    }

    toJS(): any {
        // console.log("TOJS", this.members.get("class").name)
        
        if (this.members.get("class").name === 'MyrArray') {
            let unk: unknown = this;
            let arr = (unk as MyrArray).members.get("arr");
            console.log("GOT WRAPPED MYR ARR", arr)
            return arr.map((elem: any) => elem.toJS());
        } else {
            let printableMembers = omit("initialize",
                omit("class", this.members.toJS()));
            let klass = (this.members as SimpleDB).has("class") ? this.members.get("class").name : "anonymous";
            return klass + "(" + JSON.stringify(printableMembers) + ")";
        }
    };

    equals(other: MyrObject): boolean {
        let cmp = this.value === other.value
        // console.log("EQ?", cmp, this.value, other.value)
        return cmp
    }
}

export class MyrClass extends MyrObject {
    // public shared: MyrObject = new MyrObject();
    constructor(public name: string) {
        super();
    }

    toJS() {
        return `MyrClass[${this.name}]`; //{ className: this.name }
        // throw new Error("MyrClass#toJS -- Method not implemented.");
    }
}

export class MyrNumeric extends MyrObject {
    constructor(public val: number) { super(); }
    get value() { return this.val; }
    toJS(): number { return this.val; }
}
export class MyrString extends MyrObject {
    constructor(public val: string) { super(); }
    get value() { return this.val; }
    toJS(): string {
        return this.val;
    }
}
export class MyrBoolean extends MyrObject {
    constructor(public val: boolean) { super(); }
    get value() { return this.val; }
    toJS(): boolean { return this.val; }
}
export class MyrFunction extends MyrObject {
    constructor(public label: string, public closure: DB = new SimpleDB(), public ast?: any) {
        super();
    }
    toJS(): string { return `MyrFunction(${this.label})`; }
}

export class MyrNil extends MyrObject {
    toJS(): string { return "nil"; }
    get value() { return null; }
}

let arrayClass = new MyrClass('MyrArray')
export class MyrArray extends MyrObject {
    constructor(elements: MyrObject[] = []) {
        super();
        this.members.put("class", arrayClass); //new MyrNumeric(4321))
        this.members.put("arr", elements); //new MyrNumeric(4321))
    } 

    // get value() { return this.toJS() }

    get elements(): MyrObject[] { return this.members.get("arr")}

    equals(other: MyrArray): boolean {
        let cmp = this.elements.length === other.elements.length && this.elements.every(
            (_element,index) => this.elements[index].equals(other.elements[index]))
        // console.log("EQ?", cmp, this.value, other.value)
        return cmp
    }

    toJS() {
        return this.elements.map(elem => (elem instanceof MyrObject) ? elem.toJS() : elem);
    }

    // push = () => 

    jsMethods = {
        to_a: () => new MyrArray(this.elements),
        length: () => new MyrNumeric(this.elements.length),
        push: (x: MyrObject) => {
            console.log("PUSH: " +x);
            this.elements.push(x);
            return new MyrNil()
        },
        get: (i: number) => this.elements[i],
        put: (x: MyrObject, i: number) => {
            this.elements[i] = x;
            return new MyrNil()
        }
    }
}

export class Tombstone extends MyrObject {
    toJS() { return "tombstone"; }
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
        return this.keyValues[keyToRetrieve.value] || new MyrNil();
    }
}


// const objectFactory = (klass: MyrClass) => {
//     let object: MyrObject = new MyrObject();
//     object.klass = klass;
//     return object;
// }

export type Value = MyrObject | Array<MyrObject>

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
    // abstract selfSet(): void;
    // abstract selfGet(): void;
    // abstract objExit(): void;
    // these may be more for the interpreter layer??
    // which governs the scoped db currently
    // abstract pushSelf(): void;
    // abstract popSelf(): void;
}
