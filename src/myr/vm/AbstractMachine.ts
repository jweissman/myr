export abstract class AbstractMachine<T, ID> {
    abstract push(value: T): void;
    abstract pop(): void;
    abstract peek(): T | undefined;

    abstract add(): void;
    abstract subtract(): void;
    abstract multiply(): void;
    abstract divide(): void;
    abstract exponentiate(): void;

    abstract swap(): void;
    abstract compare(): -1 | 0 | 1;

    abstract store(key: ID): void;
    abstract load(key: ID): void;
}
