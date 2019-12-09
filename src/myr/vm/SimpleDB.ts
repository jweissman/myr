import { DB } from "./DB";
export class SimpleDB<T> extends DB<T, string> {
    store: {
        [key: string]: T;
    } = {};

    constructor(private underlyingStore: DB<T, string> | null = null) {
        super();
    }

    get(key: string): T {
        // we can see through to outer frames, but favor our values?
        let retrievedValue = this.store[key];
        if (retrievedValue) {
            return retrievedValue;
        } else {
            if (this.underlyingStore && this.underlyingStore.get(key)) {
                return this.underlyingStore.get(key);
            } else {
                throw new Error("No such variable defined: " + key)
            }
        }
    }

    put(key: string, value: T): void {
        this.store[key] = value;
    }
}
