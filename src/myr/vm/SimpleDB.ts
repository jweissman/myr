import { DB } from "./DB";
import { Value } from "./AbstractMachine";
export class SimpleDB extends DB {
    underlyingStores: DB[];
    store: {
        [key: string]: Value;
    } = {};

    constructor(...underlyingStores: DB[]) {
        super();
        this.underlyingStores = underlyingStores;
    }

    get(key: string): Value {
        // we can see through to outer frames, but favor our values?
        let retrievedValue = this.store[key];
        if (retrievedValue !== undefined) {
            return retrievedValue;
        } else {
            let matchingBag = this.underlyingStores.find(store => store.get(key) !== undefined);
            if (matchingBag) {
                return matchingBag.get(key)
            } else {
                console.trace("No variable!", { key, store: this.store, underlying: this.underlyingStores })
                throw new Error("No such variable defined: " + key)
            }
        }
    }

    put(key: string, value: Value): void {
        this.store[key] = value;
    }
}