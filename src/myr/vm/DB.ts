export abstract class DB {
    abstract get(key: string): any;
    abstract put(key: string, value: any): void;
    abstract clone(): DB;

    abstract get store(): { [key: string]: any; };

    // add/remove frames...?
    // abstract push(): void;
    // abstract pop(): void;
}
