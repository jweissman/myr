import { DB } from "./DB";
import { SimpleDB } from "./SimpleDB";

function omit(key: string, obj: object): object {
    const { [key]: omitted, ...rest }: { [name: string]: any } = obj;
    return rest;
}

class BasicObject {
    public members: DB = new SimpleDB();
}

export class MyrObject extends BasicObject {
    public jsMethods: {[key: string]: Function} = {
        // meld: (other: MyrObject) => {
        //     this.members.putAll(other.members)
        // }
    };

    // constructor() {
    //     super();
    //     // this.members.put(SHARED_SLOT, new BasicObject())
    // }

    public members: DB = new SimpleDB();
    get value(): any {
        let comparableMembers = omit("initialize", this.members.toJS());
        return comparableMembers;
    }

    toJS(): any {
        if (this.members.has("class") && this.members.get("class").name === arrayClass.name) {
            let unk: unknown = this;
            let arr = (unk as MyrArray).members.get("arr");
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

export const SHARED_SLOT = 'shared'
export class MyrClass extends MyrObject {
    // public shared: MyrObject = new MyrObject();
    constructor(public name: string) {
        super();

        this.members.put(SHARED_SLOT, new BasicObject())
    }

    toJS() {
        return this.name; //`MyrClass[${this.name}]`; //{ className: this.name }
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

const ARRAY_CLASS_NAME = 'List';

const arrayClass = new MyrClass(ARRAY_CLASS_NAME)
arrayClass.name = ARRAY_CLASS_NAME;
arrayClass.members.put("name", ARRAY_CLASS_NAME);
export { arrayClass };

// const CLASS_CLASS_NAME = 'Class';
const classClass = new MyrClass('MyrClass')
classClass.members.put("class", classClass);
export { classClass };

const myrClasses: { [key: string]: MyrClass }  = { [ARRAY_CLASS_NAME]: arrayClass, MyrClass: classClass }
export { myrClasses };

export class MyrArray extends MyrObject {
    constructor(elements: MyrObject[] = []) {
        super();
        this.members.put("class", arrayClass);
        this.members.put("arr", elements);
    } 

    get elements(): MyrObject[] { return this.members.get("arr")}

    equals(other: MyrArray): boolean {
        let cmp = this.elements.length === other.elements.length && this.elements.every(
            (_element,index) => this.elements[index].equals(other.elements[index]))
        return cmp
    }

    toJS() {
        return this.elements.map(elem => (elem instanceof MyrObject) ? elem.toJS() : elem);
    }

    jsMethods = {
        length: () => new MyrNumeric(this.elements.length),
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

const myrTypes: { [key: string]: typeof MyrObject } = { [ARRAY_CLASS_NAME]: MyrArray, MyrHash }
export { myrTypes }


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
}
