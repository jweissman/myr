import { DB } from "./DB";

export abstract class AbstractMachine {
    abstract push(value: number | string | boolean): void;
    abstract pop(): void;
    abstract peek(): number | string | boolean | undefined;

    abstract decrement(): void;
    abstract add(): void;
    abstract subtract(): void;
    abstract multiply(): void;
    abstract divide(): void;
    abstract exponentiate(): void;

    abstract swap(): void;
    abstract compare(): void;

    abstract store(key: string, db: DB): void;
    abstract load(key: string, db: DB): void;
}
