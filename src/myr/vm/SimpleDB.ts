import { DB } from "./DB";
import { Value, MyrNil } from "./AbstractMachine";
type Store = { [key: string]: Value; }
export class SimpleDB extends DB {
    underlyingStores: DB[];
    store: Store = {};

    constructor(...underlyingStores: DB[]) {
        super();
        this.underlyingStores = underlyingStores;
    }

    static fromStore(store: Store, ...underlyingStores: DB[]) {
        let db = new SimpleDB(...underlyingStores)
        db.store = store;
        return db;
    }

    find(key: string): Value | null {
        let retrievedValue = this.store[key];
        if (retrievedValue !== undefined) {
            return retrievedValue;
        } else {
            let matchingBag = this.underlyingStores.find(store => store.get(key) !== undefined);
            if (matchingBag) {
                return matchingBag.get(key)
            }
        }
        return null;
    }

    has(key: string): boolean {
        if (this.find(key)) {
            return true;
        }
        return false;
    }

    get(key: string): Value {
        let val = this.find(key);
        if (val) {
            return val;
        } else {
            // return new MyrNil()
            console.trace("No variable!", { key, store: this.store, underlying: this.underlyingStores })
            throw new Error("No such variable defined: " + key)
        }
        // we can see through to outer frames, but favor our values?
        // /let retrievedValue = this.store[key];
        // /if (retrievedValue !== undefined) {
        // /    return retrievedValue;
        // /} else {
        // /    let matchingBag = this.underlyingStores.find(store => store.get(key) !== undefined);
        // /    if (matchingBag) {
        // /        return matchingBag.get(key)
        // /    } else {
        // /        // return new MyrNil()
        // /        console.trace("No variable!", { key, store: this.store, underlying: this.underlyingStores })
        // /        throw new Error("No such variable defined: " + key)
        // /    }
        // /}
    }

    put(key: string, value: Value): void {
        this.store[key] = value;
    }

    clone(): SimpleDB {
        // return this;
        let {store} = this;
        let copy = {...store}
        return SimpleDB.fromStore(copy, this)
    }

    toJS() { return Object.fromEntries(
        Object.entries({...this.store}).map(([key,value]) => [key, value.toJS()])
     ) }
}