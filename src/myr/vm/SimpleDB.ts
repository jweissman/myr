import { DB } from "./DB";
import { Value } from "./AbstractMachine";
import { MyrObject } from "./Types";

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

    get(key: string): Value | any {
        let val = this.find(key);
        if (val !== undefined) {
            return val;
        } else {
            throw new Error("No such variable defined: " + key)
        }
    }

    put(key: string, value: Value): void {
        this.store[key] = value;
    }

    clone(): SimpleDB {
        let {store} = this;
        let copy = {...store}
        return SimpleDB.fromStore(copy, this)
    }

    toJS() {
        return Object.fromEntries(
            Object.entries({ ...this.store }).map(([key, value]) => [key, value instanceof MyrObject ? value.toJS() : value])
        )
    }
}