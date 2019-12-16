import chalk from 'chalk';
import assertNever from 'assert-never';
import { Value, MyrNumeric, MyrFunction, MyrObject } from './AbstractMachine';
import { Algebra } from "./Algebra";
import { Controller } from './Controller';
import { DB } from './DB';
import { prettyInstruction, Instruction, instruct } from "./Instruction";
import Machine from "./Machine";
import { OpCode } from './OpCode';
import { SimpleDB } from './SimpleDB';

type Frame = { retAddr: number, db: DB, self: MyrObject }

let main = new MyrObject();

abstract class Compiler<T> {
    abstract generateCode(ast: T): Instruction[];
}

class Interpreter<T> {
    public trace: boolean = false;

    public machine: Machine;
    public controls: Controller;

    private ip: number = -1;
    private frames: Frame[] = [{ retAddr: -1, db: new SimpleDB(), self: main }]
    // private selves: MyrObject[] = [main];

    constructor(algebra: Algebra, private compiler: Compiler<T>) {
        this.machine = new Machine(algebra);
        this.controls = new Controller(this.machine);
    }

    private get topFrame() { return this.frames[this.frames.length-1]; }

    private get retAddr(): number {
        return this.topFrame.retAddr;
    }

    public get self(): MyrObject {
        return this.topFrame.self;
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
        let steps = 0;
        let stackLengths = []
        while (this.ip < this.currentProgram.length) {
            steps += 1;
            let instruction = this.currentInstruction;
            if (this.trace) {
                console.log(
                    `@${this.ip}: ` +
                    prettyInstruction(instruction)
                    );
            }

            if (this.trace && this.machine.stack.length) {
                this.dumpStack('stack before')
            }
            try {
                this.execute(instruction);
            } catch(e) {
                console.warn(
                    chalk.red("Error executing instruction " + prettyInstruction(instruction) + ":"+ e.message)
                )
                console.debug(this.currentProgram.slice(this.ip-5,this.ip+5))
                throw(e);
            }
            if (this.trace && this.machine.stack.length) {
                this.dumpStack('stack after')
            }

            // this.store(this.result)
            if (this.machine.stack.length) {
                this.machine.store("_", this.db);
            }

            this.ip++;
            stackLengths.push(this.machine.stack.length)
        }
        let endTime = new Date().getTime();
        let elapsed = endTime - startTime;
        if (elapsed > 10) {
            console.log(`---> Ran ${steps} instructions in ${elapsed}ms: ${steps / elapsed} ops/ms`)
        }
    }

    get rawResult() { return this.controls.rawResult; }
    get result() { return this.controls.result; }
    private get currentInstruction() { return this.currentProgram[this.ip]; }


    private jump(target: string | undefined) {
        if (target) {
            let index = this.indexForLabel(target)
            if (index !== null) {
                this.ip = index - 1
            } else {
                    // console.log("CURRENT PROG BEFORE JUMP", prettyProgram(this.code), { target })
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
            let doJump = (this.machine.stackTop as MyrNumeric).value === 1;
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

    private invoke(self = this.self) {
        let top = this.machine.stackTop;
        if (top && top instanceof MyrFunction) {
            let { label, closure } = top;
            this.machine.pop()
            // console.log("INVOKE FUNCTION", { label, self })
            this.frames.push({ retAddr: this.ip, db: new SimpleDB(closure, this.db), self });
            this.jump(label);
        } else {
            console.log("no function to call?")
            throw new Error("invoke expects stack top to have function to call...")
        }
    }

    private deconflictLabel(label: string) {
        this.lambdaCount += 1
        if (this.currentProgram.find(instruction => instruction.label === label)) {
            return `${label}[${this.lambdaCount}]`
        } else {
            return label;
        }

    }

    private compile(body: any) {
        if (body) {
            this.lambdaCount += 1
            let label = body.label
                ? this.deconflictLabel(body.label)
                : `lambda-${this.lambdaCount}`;
            let functionRef: MyrFunction = new MyrFunction( label, this.db.clone() )
            let code = this.compiler.generateCode(body)
            this.currentProgram = [
                ...this.code,
                instruct('halt'),
                instruct('noop', { label }),
                ...code,
            ]
            this.controls.push(functionRef);
        } else {
            throw new Error("asked to gen code without code (ast expected in instr. 'body')")
        }
    }

    lambdaCount: number = 0;
    private execute(instruction: Instruction) {
        let op: OpCode = instruction.op;
        switch (op) {
            case 'noop': break;
            case 'push': this.controls.push(instruction.value); break;
            case 'pop': this.machine.pop(); break;
            case 'dup':
                this.machine.push(this.machine.stackTop);
                break;
            case 'swap': this.machine.swap(); break;
            case 'dec': this.machine.decrement(); break;
            case 'inc': this.machine.increment(); break;
            case 'add': this.machine.add(); break;
            case 'sub': this.machine.subtract(); break;
            case 'mul': this.machine.multiply(); break;
            case 'div': this.machine.divide(); break;
            case 'pow': this.machine.exponentiate(); break;
            case 'and': this.machine.and(); break;
            case 'or': this.machine.or(); break;
            case 'not':   this.machine.not(); break;
            case 'cmp':   this.machine.compare(); break;
            case 'cmp_gt': this.controls.compare(1); break;
            case 'cmp_lt': this.controls.compare(-1); break;
            case 'cmp_eq': this.controls.compare(0); break;
            case 'cmp_neq': this.controls.compare(0,(l,r)=>l!=r); break;
            case 'exists': this.controls.exists(instruction.key, this.db); break;
            case 'store': this.controls.store(instruction.key, this.db); break;
            case 'load':
                this.controls.load(instruction.key, this.db, { self: this.self });
                break;
            case 'jump':  this.jump(instruction.target); break;
            case 'jump_if_gt':
                this.jump_gt(instruction.value, instruction.target);
                break;
            case 'jump_if_zero':
                this.jump_z(instruction.target);
                break;
            case 'call': 
                let newFrame = { retAddr: this.ip, db: new SimpleDB(this.db), self: this.self }
                this.frames.push(newFrame)
                this.jump(instruction.target);
                break;
            case 'invoke': this.invoke(); break;
            case 'exec':
                if (instruction.jsMethod) {
                    this.controls.callExec(instruction.jsMethod, instruction.arity || 0);
                }
                break;
            case 'compile': this.compile(instruction.body); break;
            case 'ret':
                this.ip = this.retAddr;
                this.frames.pop();
                break;
            case 'halt':
                this.ip = this.currentProgram.length;
                break;
            case 'arr_get': this.machine.arrayGet(); break;
            case 'arr_put': this.machine.arrayPut(); break;
            case 'hash_get': this.machine.hashGet(); break;
            case 'hash_put': this.machine.hashPut(); break;
            case 'send_eq':this.controls.sendEq(instruction.key); break;
            case 'send_attr': this.controls.send(instruction.key); break;
            case 'send_call': 
                let { receiver, called } = this.controls.send(instruction.key); 
                // if (receiver) {
                if (!called) {
                    this.invoke(receiver);
                }
                break;
            case 'construct':
                let newObj = new MyrObject();
                this.controls.push(newObj);
                break;
            case 'dump':
                if (instruction.key) {
                    console.log(chalk.green(instruction.key));
                }
                this.dumpStack('[stack dump]')
                break;
            case 'mark': this.controls.mark(); break;
            case 'sweep': this.controls.sweep(); break;
            default: assertNever(op);
        }
    }

    private dumpStack(message="Stack") {
        console.log(message + ": " + this.machine.stack.map(val => (val.toJS())));
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