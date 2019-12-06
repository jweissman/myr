import assertNever from 'assert-never';
import Machine from "./Machine";
import { Algebra } from "./Algebra";
import Instruction, { prettyInstruction, instruct, prettyProgram } from "./Instruction";
import chalk from 'chalk';

// type Frame = { retAddr: ... }

class Interpreter<T> {
    public machine: Machine<T>;

    private ip: number = -1;
    private retAddr: number = -1;
    private currentProgram: Instruction<T>[] = [];

    constructor(algebra: Algebra<T>) {
        this.machine = new Machine<T>(algebra);
    }

    run(program: Instruction<T>[]) {
        this.currentProgram = program; 
        this.ip = this.indexForLabel("main") || 0;
        console.debug('\n---\n'+prettyProgram(program)+'\n---\n');
        while (this.ip < this.currentProgram.length) {
            let instruction = this.currentInstruction;
            // console.log(chalk.yellow(String(this.ip).padEnd(4)) + prettyInstruction(instruction))
            this.execute(instruction);
            this.ip++;
        }
    }

    private get currentInstruction() { return this.currentProgram[this.ip]; }

    get result() { return this.machine.peek(); }

    private push(value: T | undefined) {
        if (value) {
            this.machine.push(value);
        } else {
            throw new Error("Push must have a value")
        }
    }

    private store(key: string | undefined) {
        if (key) {
            this.machine.store(key);
        } else {
            throw new Error("Must have a key to reference stored variable by")
        }
    }

    private load(key: string | undefined) {
        if (key) {
            this.machine.load(key);
        } else {
            throw new Error("Must have a key to reference loaded variable by")
        }
    }

    private jump(target: string | undefined) {
        if (target) {
            let index = this.indexForLabel(target)
            // debugger;
            if (index !== null) {
                this.ip = index - 1
            } else {
                throw new Error("Jump target not found: " + target)
            }
        } else {
            throw new Error("must have a label to jump to!")
        };
    }

    private jump_gt(value: T | undefined, target: string | undefined) {
        if (value && target) {
            this.machine.push(value);
            let doJump = this.machine.compare() === 1;
            this.machine.pop();
            if (doJump) {
                this.jump(target)
            }
        } else {
            throw new Error("Conditional jump must have a value and a target")
        }
    }

    private execute(instruction: Instruction<T>) {
        let { op } = instruction;
        switch (op) {
            case 'noop': break;
            case 'add': this.machine.add(); break;
            case 'sub': this.machine.subtract(); break;
            case 'mul': this.machine.multiply(); break;
            case 'div': this.machine.divide(); break;
            case 'pow': this.machine.exponentiate(); break;
            case 'pop': this.machine.pop(); break;
            case 'push': this.push(instruction.value); break;
            case 'store': this.store(instruction.key); break;
            case 'load': this.load(instruction.key); break;
            case 'jump': this.jump(instruction.target); break;
            case 'jump_if_gt':
                this.jump_gt(instruction.value, instruction.target);
                break;
            case 'call': 
                this.retAddr = this.ip;
                this.jump(instruction.target);
                break;
            case 'ret':
                this.ip = this.retAddr; // won't work more than one level deep,
                                      // needs to be a stack of frames... :/
                break;
            default: assertNever(op);
        }
    }

    private indexForLabel(label: string): number | null {
        let labelledStep = this.currentProgram.find(
            instruction => instruction.label === label
        )

        if (labelledStep) {
            let at = this.currentProgram.indexOf(labelledStep);
            return at;
        } else {
            // console.warn("Could not find an instruction with label: " + label)
            return null;
        }
    }
}

export default Interpreter;