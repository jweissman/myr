export abstract class DB {
    abstract has(key: string): boolean;
    abstract get(key: string): any;
    abstract put(key: string, value: any): void;
    abstract clone(): DB;

    abstract get store(): { [key: string]: any; };


    abstract toJS(): any;
    // add/remove frames...?
    // abstract push(): void;
    // abstract pop(): void;
}
