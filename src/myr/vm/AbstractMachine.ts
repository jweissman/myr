import { DB } from "./DB";

export abstract class AbstractMachine<T extends number | boolean | string, ID> {
    abstract push(value: T): void;
    abstract pop(): void;
    abstract peek(): T | undefined;

    abstract decrement(): void;
    abstract add(): void;
    abstract subtract(): void;
    abstract multiply(): void;
    abstract divide(): void;
    abstract exponentiate(): void;

    abstract swap(): void;
    abstract compare(): void;

    abstract store(key: ID, db: DB<T, ID>): void;
    abstract load(key: ID, db: DB<T, ID>): void;
}
