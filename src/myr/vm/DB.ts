export abstract class DB<T, ID> {
    abstract get(key: ID): T;
    abstract put(key: ID, value: T): void;

    // add/remove frames...?
    // abstract push(): void;
    // abstract pop(): void;
}
