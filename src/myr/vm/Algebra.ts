export type Comparison = -1 | 0 | 1
export abstract class Algebra {
    abstract isZero(x: number): boolean;

    abstract decrement(x: number): number;
    abstract increment(x: number): number;

    abstract sum(x: number, y: number): number;
    abstract difference(x: number, y: number): number;
    abstract product(x: number, y: number): number;
    abstract quotient(x: number, y: number): number;
    abstract power(x: number, y: number): number;

    abstract compare(x: number, y: number): Comparison;

    abstract and(x: boolean, y: boolean): boolean;
    abstract or(x: boolean, y: boolean): boolean;
    abstract not(x: boolean): boolean;
}
