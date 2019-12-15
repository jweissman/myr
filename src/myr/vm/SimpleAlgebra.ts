import { Algebra } from "./Algebra";

export class SimpleAlgebra extends Algebra {
    and(x: boolean, y: boolean): boolean {
        return x && y;
    }

    or(x: boolean, y: boolean): boolean {
        // if (x instanceof MyrNil) {}
        // if (x) { return x; }
        // return y;
        return x || y;
    }

    not(x: boolean): boolean {
        return !x;
    }

    isZero(x: number): boolean {
        return x === 0;
    }

    decrement(x: number): number {
        return x - 1;
    }

    increment(x: number): number {
        return x + 1;
    }

    sum(x: number, y: number): number {
        return x + y;
    }

    difference(x: number, y: number): number {
        return x - y;
    }

    product(x: number, y: number): number {
        return x * y;
    }

    quotient(x: number, y: number): number {
        return x / y;
    }

    power(x: number, y: number): number {
        return Math.pow(x, y);
    }

    compare(x: number, y: number): 0 | 1 | -1 {
        let result: 0 | 1 | -1 = 0;
        // if (x instanceof MyrObject)
        if (x > y) {
            result = 1;
        } else if (x < y) {
            result = -1;
        } else if (x == y) {
            result = 0;
        } else {
            result = -1;
        }
        return result;
    }
}
