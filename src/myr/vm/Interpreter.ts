import assertNever from 'assert-never';
import Machine from "./Machine";
import { Algebra } from "./Algebra";
import { prettyInstruction, prettyProgram, Instruction, instruct } from "./Instruction";
import { DB } from './DB';
import { SimpleDB } from './SimpleDB';
import { OpCode } from './OpCode';
import { Value, FunctionReference } from './AbstractMachine';

const average = (arr: number[]) => arr.reduce((a,b) => a + b, 0) / arr.length

type Frame = { retAddr: number, db: DB }

abstract class Compiler<T> {
    abstract generateCode(ast: T): Instruction[];
}

class Interpreter<T> {
    private trace: boolean = false;

    public machine: Machine;

    private ip: number = -1;
    private frames: Frame[] = [{ retAddr: -1, db: new SimpleDB() }]

    constructor(algebra: Algebra, private compiler: Compiler<T>) {
        this.machine = new Machine(algebra);
    }

    private get topFrame() { return this.frames[this.frames.length-1]; }

    private get retAddr(): number {
        return this.topFrame.retAddr;
    }

    public get db(): DB {
        return this.topFrame.db;
    }

    private currentProgram: Instruction[] = [];

    get code(): Instruction[] { return this.currentProgram }

    install(program: Instruction[]): void {
        this.currentProgram = [ ...program, instruct('halt') ]; 
    }

    run(program: Instruction[]) {
        this.install(program);
        let startTime = new Date().getTime();
        this.ip = this.indexForLabel("main") || 0;
        // console.debug('\n---\n'+prettyProgram(program)+'\n---\n');
        // let maxSteps = 1024 * 1024 * 256; // halt if we ran away :D
        let steps = 0;
        let stackLengths = []
        while (this.ip < this.currentProgram.length) { //} && steps++ < maxSteps) {
            steps += 1;
            let instruction = this.currentInstruction;
            if (this.trace) {
                console.log(
                    `@${this.ip}: ` +
                    prettyInstruction(instruction)
                    );
            }

            // if (this.trace && this.machine.stack.length) {
            //     console.log(" (stack before: " + this.machine.stack + ")");
            // }
            this.execute(instruction);
            if (this.trace && this.machine.stack.length) {
                console.log(
                    " (stack after: " + this.machine.stack + ")"
                );
            }
            this.ip++;
            stackLengths.push(this.machine.stack.length)
        }
        let endTime = new Date().getTime();
        let elapsed = endTime - startTime;
        // if (this.trace) {
        console.log(`---> Ran ${steps} instructions in ${elapsed}ms: ${steps / elapsed} ops/ms`)
        console.log(`---> Avg stack size: ${average(stackLengths)}`)
        // }
    }

    private get currentInstruction() { return this.currentProgram[this.ip]; }

    get result() {
        let value = this.machine.peek();
        if (value !== undefined) {
            this.machine.pop();
        }
        return value;
    }

    private push(value: Value | undefined) {
        if (value !== undefined) {
            this.machine.push(value);
        } else {
            throw new Error("Push must have a value")
        }
    }

    private store(key: string | undefined) {
        if (key !== undefined) {
            this.machine.store(key, this.db);
        } else {
            throw new Error("Must have a key to reference stored variable by")
        }
    }

    private load(key: string | undefined) {
        if (key) {
            this.machine.load(key, this.db);
        } else {
            throw new Error("Must have a key to reference loaded variable by")
        }
    }

    private jump(target: string | undefined) {
        if (target) {
            let index = this.indexForLabel(target)
            if (index !== null) {
                this.ip = index - 1
            } else {
                    console.log("CURRENT PROG BEFORE JUMP", prettyProgram(this.code), { target })
                throw new Error("Jump target not found: " + target)
            }
        } else {
            throw new Error("must have a label to jump to!")
        };
    }

    private jump_gt(value: Value | undefined, target: string | undefined) {
        if (value && target) {
            this.machine.push(value);
            this.machine.compare();
            let doJump = this.machine.stackTop === 1;
            this.machine.pop();
            if (doJump) {
                this.jump(target)
            }
        } else {
            throw new Error("Conditional jump must have a value and a target")
        }
    }

    private jump_z(target: string | undefined) {
        if (target) {
            if (this.machine.topIsZero()) {
                this.jump(target);
            }
        } else {
            throw new Error("Conditional jump_z must have a target")
        }
    }

    lambdaCount: number = 0;
    private execute(instruction: Instruction) {
        let op: OpCode = instruction.op;
        switch (op) {
            case 'noop': break;
            case 'push':  this.push(instruction.value); break;
            case 'pop':   this.machine.pop(); break;
            case 'dup':
                this.machine.push(this.machine.stackTop);
                break;
            case 'swap':  this.machine.swap(); break;
            case 'dec':   this.machine.decrement(); break;
            case 'inc':   this.machine.increment(); break;
            case 'add':   this.machine.add(); break;
            case 'sub':   this.machine.subtract(); break;
            case 'mul':   this.machine.multiply(); break;
            case 'div':   this.machine.divide(); break;
            case 'pow':   this.machine.exponentiate(); break;
            case 'and':   this.machine.and(); break;
            case 'or':    this.machine.or(); break;
            case 'not':   this.machine.not(); break;
            case 'cmp':   this.machine.compare(); break;
            case 'cmp_gt': 
                this.machine.compare();
                let gt: boolean = this.machine.peek() === 1;
                this.machine.pop();
                this.push(gt);
                break;
            case 'cmp_lt': 
                this.machine.compare();
                let lt: boolean = this.machine.peek() === -1;
                this.machine.pop();
                this.push(lt);
                break;
            case 'cmp_eq': 
                this.machine.compare();
                let eq: boolean = this.machine.peek() === 0;
                this.machine.pop();
                this.push(eq);
                break;
            case 'store': this.store(instruction.key); break;
            case 'load':  this.load(instruction.key); break;
            case 'jump':  this.jump(instruction.target); break;
            case 'jump_if_gt':
                this.jump_gt(instruction.value, instruction.target);
                break;
            case 'jump_if_zero':
                this.jump_z(instruction.target);
                break;
            case 'call': 
                this.frames.push({ retAddr: this.ip, db: new SimpleDB(this.db) })
                this.jump(instruction.target);
                break;
            case 'invoke':  // call a fn dynamically by name...
                // todo test...
                let top = this.machine.stackTop;
                if (top && typeof top === 'string') {
                    this.machine.pop()
                    this.frames.push({ retAddr: this.ip, db: new SimpleDB(this.db) })
                    this.jump(top);
                } else if (top && typeof top === 'object') {
                    let { label, closure } = top as FunctionReference;
                    this.machine.pop()
                    this.frames.push({ retAddr: this.ip, db: new SimpleDB(closure, this.db) }); //new SimpleDB(this.db) })
                    this.jump(label);
                } else {
                    throw new Error("invoke expects stack top to have reference to (string value of) function name to call...")
                }
                break;
            case 'exec':
                if (instruction.jsMethod) {
                    let fn = instruction.jsMethod;
                    if (instruction.arity) {
                        let args = this.machine.topN(instruction.arity);
                        instruction.jsMethod(...args);
                    } else {
                        instruction.jsMethod() // >>?
                    }
                }
                break;
            case 'compile':
                if (instruction.body) {
                    // assume we're building a lambda??
                    // we need to grab the surrounding context here..

                    this.lambdaCount += 1
                    let label = `lambda-${this.lambdaCount}`;
                    // scope: this.db
                    // { label, closureContext }
                    let functionRef: FunctionReference = { label, closure: new SimpleDB(this.db) }

                    // console.log("GEN", { body: instruction.body})
                    let code = this.compiler.generateCode(instruction.body)
                    // console.log("COMPILE'D!", { code })
                    this.currentProgram = [
                        ...this.code,
                        instruct('halt'),
                        instruct('noop', { label }),
                        ...code,
                    ]
                    // console.log("CURRENT PROG AFTER COMPILE", prettyProgram(this.currentProgram))
                    this.push(functionRef);
                } else {
                    throw new Error("asked to gen code without code (ast expected in instr. 'body')")
                }
                break;
            case 'ret':
                this.ip = this.retAddr;
                this.frames.pop();
                break;
            case 'halt':
                this.ip = this.currentProgram.length;
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
            return null;
        }
    }
}

export { Compiler };
export default Interpreter;