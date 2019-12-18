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

    private exists(val: Value | null) {
        return val !== null && val !== undefined;
    }

    find(key: string): Value | null {
        // console.log("FIND", { key })
        let value = null
        // if (key instanceof MyrString) { key = key.value }
        let retrievedValue = this.store[key];
        if (this.exists(retrievedValue)) { //} !== undefined) {
            // console.log("FOUND IN LOCAL STORE")
            value = retrievedValue;
        } else {
            let matchingBag = this.underlyingStores.find(store => store.has(key));
            if (matchingBag) {
                // console.log("FOUND IN UNDERLYING STORE")
                value = matchingBag.get(key)
            } else {
                // console.log("NOT FOUND")
            }
        }
        // console.log("FIND", { key, value: (value), exists: this.exists(value) });
        return value;
    }

    has(key: string): boolean {
        let doesHave = !!(this.exists(this.find(key)) || !!this.underlyingStores.find(store => store.has(key)))
        // console.log("HAS KEY?", { key, doesHave })
        return doesHave
        // if (this.exists(this.find(key))) {
        //     return true;
        // }
        // return false;
    }

    get(key: string): Value | any {
        let val = this.find(key);
        if (this.exists(val)) {//} !== null) {
            // console.log("GET VAL", { key, val })
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