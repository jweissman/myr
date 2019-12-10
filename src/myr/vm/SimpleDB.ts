import { DB } from "./DB";
import { Value } from "./Machine";
export class SimpleDB extends DB {
    store: {
        [key: string]: Value;
    } = {};

    constructor(private underlyingStore: DB | null = null) {
        super();
    }

    get(key: string): Value {
        // we can see through to outer frames, but favor our values?
        let retrievedValue = this.store[key];
        if (retrievedValue !== undefined) {
            return retrievedValue;
        } else {
            if (this.underlyingStore && this.underlyingStore.get(key) !== undefined) {
                return this.underlyingStore.get(key);
            } else {
                console.trace("No variable!", { key, store: this.store, underlying: this.underlyingStore })
                throw new Error("No such variable defined: " + key)
            }
        }
    }

    put(key: string, value: Value): void {
        this.store[key] = value;
    }
}
