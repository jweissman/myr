import { DB } from "./DB";
import { SimpleDB } from "./SimpleDB";
import { SimpleAlgebra } from "./SimpleAlgebra";

function omit(key: string, obj: object): object {
    const { [key]: omitted, ...rest }: { [name: string]: any } = obj;
    return rest;
}

class BasicObject {
    public members: DB = new SimpleDB();
}

export class MyrObject extends BasicObject {
    public jsMethods: {[key: string]: Function} = {
        "==": (other: MyrObject) => new MyrBoolean(this.value === other.value),
    };
    public members: DB = new SimpleDB();
    static count = 0;
    

    get value(): any {
        let comparableMembers = omit("initialize", this.members.toJS());
        return comparableMembers;
    }
    toJS(): any {
        // if (this.members.has("class") && this.members.get("class").name === arrayClass.name) {
        //     let unk: unknown = this;
        //     let arr = (unk as MyrArray).members.get("arr");
        //     return arr.map((elem: any) => elem.toJS());
        // } else if (this.members.has("class") && this.members.get("class").name === numberClass.name) {
        //     let unk: unknown = this;
        //     let val = (unk as MyrNumeric).value;
        //     return val;
        // } else {
            let printableMembers = omit("initialize",
                omit("class", this.members.toJS()));
            let klass = (this.members as SimpleDB).has("class") ? this.members.get("class").name : "anonymous";
            return klass + "(" + JSON.stringify(printableMembers) + ")";
        // }
    };

    equals(other: MyrObject): boolean {
        return (this.value === other.value)
    }
}

export const SHARED_SLOT = 'shared'
export class MyrClass extends MyrObject {
    static registry: { [name: string]: MyrClass } = {}

    constructor(public name: string) {
        super();
        MyrClass.registry[name] = this;
        this.members.put(SHARED_SLOT, new BasicObject())
    }

    toJS() {
        return this.name;
    }

    public jsMethods: { [key: string]: Function } = {
        "==": (other: MyrObject) => new MyrBoolean(other instanceof MyrClass && this.name === other.name),
    };
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
    jsMethods = {
        "==": (other: MyrObject) => new MyrBoolean(other instanceof MyrNil),
        "!=": (other: MyrObject) => new MyrBoolean(!(other instanceof MyrNil)),
    }
}

const NUMBER_CLASS_NAME = 'Number';
const numberClass = new MyrClass(NUMBER_CLASS_NAME);
numberClass.name = NUMBER_CLASS_NAME;
numberClass.members.put("name", NUMBER_CLASS_NAME)
export { numberClass };

const STRING_CLASS_NAME = 'String';
const stringClass = new MyrClass(STRING_CLASS_NAME);
stringClass.name = STRING_CLASS_NAME;
stringClass.members.put("name", STRING_CLASS_NAME);
export { stringClass };

const ARRAY_CLASS_NAME = 'List';
const arrayClass = new MyrClass(ARRAY_CLASS_NAME)
arrayClass.name = ARRAY_CLASS_NAME;
arrayClass.members.put("name", ARRAY_CLASS_NAME);
export { arrayClass };

const BOOLEAN_CLASS_NAME = 'Boolean';
const boolClass = new MyrClass(BOOLEAN_CLASS_NAME)
boolClass.name = BOOLEAN_CLASS_NAME;
boolClass.members.put("name", BOOLEAN_CLASS_NAME)
export { boolClass };

// const CLASS_CLASS_NAME = 'Class';
const classClass = new MyrClass('MyrClass')
classClass.members.put("class", classClass);
export { classClass };


const MIRROR_CLASS_NAME = 'Mirror';
const mirrorClass = new MyrClass(MIRROR_CLASS_NAME);
mirrorClass.members.put("class", mirrorClass);
export { mirrorClass };

const myrClasses: { [key: string]: MyrClass }  = {
    [ARRAY_CLASS_NAME]: arrayClass,
    [NUMBER_CLASS_NAME]: numberClass,
    [STRING_CLASS_NAME]: stringClass,
    [BOOLEAN_CLASS_NAME]: boolClass,
    MyrClass: classClass,
    [MIRROR_CLASS_NAME]: mirrorClass,
}
export { myrClasses };


export class MyrBoolean extends MyrObject {
    constructor(public val: boolean) {
        super();
        this.members.put("class", boolClass);
    }
    get value() { return this.val; }
    toJS(): boolean { return this.val; }
    public jsMethods: { [key: string]: Function } = {
        // todo truthiness !
        "_set": (val: boolean | MyrBoolean) => {
            let v = val instanceof MyrBoolean ? val.val : val;
            this.val = v;
        },
        "true": () => new MyrBoolean(this.val === true),
        "==": (other: MyrObject) => new MyrBoolean(other instanceof MyrBoolean && other.val === this.val),
        "!=": (other: MyrObject) => new MyrBoolean(other instanceof MyrBoolean && other.val !== this.val),
    };
}

export class MyrString extends MyrObject {
    constructor(public val: string) {
        super();
        this.members.put("class", stringClass);
    }
    get value() { return this.val; }
    toJS(): string {
        return this.val;
    }
    jsMethods = {
        "+": (other: MyrString) => { 
            let joined = String(other.val) + String(this.val);
            return new MyrString(joined);
        },
        "*": (other: MyrNumeric) => {
            let copies = [];
            let i=0;
            while (i++<other.val) { copies.push(this.val); }
            return new MyrString(copies.join(""))
        },
        "to_a": () => {
            return new MyrArray(
                this.val.split("").map(ch => new MyrString(ch))
            )
        },
        "[]": (index: MyrNumeric) => { return new MyrString(this.val.charAt(index.value)); },
        //"length": () => new MyrNumeric(this.val.length),
        "_set": (val: MyrString | string) => {
            this.val = val instanceof MyrString ? val.val : val; return new MyrNil();
        },
        // todo truthiness !
        "==": (other: MyrObject) => new MyrBoolean(other instanceof MyrString && other.val === this.val),
    };
}

export class MyrMirror extends MyrObject {
    constructor() {
        super();
        this.members.put("class", mirrorClass);
    } 

    toJS(): string { return `MyrMirror`; }
    jsMethods = {
        conjure: (className: MyrString) => {
            return MyrClass.registry[className.value];
        },
    }
}

export class MyrNumeric extends MyrObject {
    constructor(public val: number) {
        super();
        this.members.put("class", numberClass);
    }
    get value() { return this.val; }
    toJS(): number { return this.val; }
    spaceship(other: MyrNumeric) {
        return (new SimpleAlgebra()).compare(this.val, other.val);
    }
    jsMethods = {
        "+": (other: MyrNumeric) => {
            if (other instanceof MyrString) {
                return new MyrString(other.val + String(this.val))
            } else {
                return new MyrNumeric(this.val + other.val);
            }
        },
        "*": (other: MyrNumeric): MyrObject => {
            if (other instanceof MyrString) {
                return other.jsMethods['*'](this);
            }
            return new MyrNumeric(this.val * other.val);
        },
        "-": (other: MyrNumeric) => { return new MyrNumeric(other.val - this.val); },
        "/": (other: MyrNumeric) => { return new MyrNumeric(other.val / this.val); },
        "^": (other: MyrNumeric) => { return new MyrNumeric(Math.pow(other.val, this.val)); },
        "_set": (val: MyrNumeric | number) => {
            this.val = val instanceof MyrNumeric
              ? val.val : val; return new MyrNil()
        },
        "to_s": () => { return new MyrString(String(this.val))},

        "<=>": this.spaceship,
        ">": (other: MyrNumeric) => new MyrBoolean(this.spaceship(other) === -1),
        ">=": (other: MyrNumeric) => new MyrBoolean(this.spaceship(other) <= 1),
        "<": (other: MyrNumeric) => new MyrBoolean(this.spaceship(other) === 1),
        "<=": (other: MyrNumeric) => new MyrBoolean(this.spaceship(other) >= -1),
        "==": (other: MyrNumeric) => new MyrBoolean(this.spaceship(other) === 0),
        "!=": (other: MyrNumeric) => new MyrBoolean(this.spaceship(other) !== 0),
    }
}

export class MyrArray extends MyrObject {
    constructor(elements: MyrObject[] = []) {
        super();
        this.members.put("class", arrayClass);
        this.members.put("arr", elements);
    } 

    get elements(): MyrObject[] { return this.members.get("arr")}

    equals(other: MyrArray): boolean {
        if (other instanceof MyrArray) {
            let cmp = this.elements.length === other.elements.length && this.elements.every(
                (_element, index) => this.elements[index].equals(other.elements[index]))

            return cmp
        } else {
            return false
        }
    }

    toJS() {
        return this.elements.map(elem => (elem instanceof MyrObject) ? elem.toJS() : elem);
    }

    jsMethods = {
        length: () => new MyrNumeric(this.elements.length),
        "[]": (index: MyrNumeric) => { return this.elements[index.value] || new MyrNil(); },
        "==": (other: MyrArray) => { return new MyrBoolean(this.equals(other)); },
        "!=": (other: MyrArray) => { return new MyrBoolean(!this.equals(other)); },
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
        Object.keys(fields).forEach((key) => fields[key] = fields[key].toJS());
        return fields;
    }
    set(key: MyrString, valueToAssign: MyrObject) {
        this.keyValues[key.value] = valueToAssign;
    }
    get(keyToRetrieve: MyrString): MyrObject {
        return this.keyValues[keyToRetrieve.value] || new MyrNil();
    }
}

const myrTypes: { [key: string]: typeof MyrObject } = {
    [ARRAY_CLASS_NAME]: MyrArray,
    [MIRROR_CLASS_NAME]: MyrMirror,
    // @ts-ignore
    [STRING_CLASS_NAME]: MyrString,
    // @ts-ignore
    [NUMBER_CLASS_NAME]: MyrNumeric,
    // @ts-ignore
    [BOOLEAN_CLASS_NAME]: MyrBoolean,
    MyrHash,
}
export { myrTypes }
