import { Algebra } from "./Algebra";
export class SimpleAlgebra extends Algebra<number> {
    isZero(x: number): boolean {
        return x === 0;
    }

    decrement(x: number): number {
        return x - 1;
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
        if (x > y) {
            return 1;
        } else if (x < y) {
            return -1;
        } else {
            return 0;
        }
    }
}
