export abstract class Algebra<T> {
    abstract isZero(x: T): boolean;
    abstract decrement(x: T): T;
    abstract increment(x: T): T;
    abstract sum(x: T, y: T): T;
    abstract difference(x: T, y: T): T;
    abstract product(x: T, y: T): T;
    abstract quotient(x: T, y: T): T;
    abstract power(x: T, y: T): T;
    abstract compare(x: T, y: T): -1 | 0 | 1;
}
