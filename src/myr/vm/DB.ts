export abstract class DB<T, ID> {
    abstract get(key: ID): T;
    abstract put(key: ID, value: T): void;
}
