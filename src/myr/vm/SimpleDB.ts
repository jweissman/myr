import { DB } from "./DB";
export class SimpleDB<T> extends DB<T, string> {
    store: {
        [key: string]: T;
    } = {};
    get(key: string): T {
        return this.store[key];
    }
    put(key: string, value: T): void {
        this.store[key] = value;
    }
}
