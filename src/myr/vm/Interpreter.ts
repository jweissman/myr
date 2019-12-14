import assertNever from 'assert-never';
import Machine from "./Machine";
import { Algebra } from "./Algebra";
import { prettyInstruction, Instruction, instruct } from "./Instruction";
import { DB } from './DB';
import { SimpleDB } from './SimpleDB';
import { OpCode } from './OpCode';
import { Value, MyrNumeric, MyrFunction, MyrBoolean, MyrObject, MyrString, MyrHash, MyrNil, Tombstone } from './AbstractMachine';
import chalk from 'chalk';

type Frame = { retAddr: number, db: DB, self: MyrObject }

let main = new MyrObject();

abstract class Compiler<T> {
    abstract generateCode(ast: T): Instruction[];
}

class Interpreter<T> {
    public trace: boolean = false;

    public machine: Machine;

    private ip: number = -1;
    private frames: Frame[] = [{ retAddr: -1, db: new SimpleDB(), self: main }]
    // private selves: MyrObject[] = [main];

    constructor(algebra: Algebra, private compiler: Compiler<T>) {
        this.machine = new Machine(algebra);
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
                console.warn("Error executing instruction: " + prettyInstruction(instruction));
                console.debug(this.currentProgram)
                throw(e);
            }
            if (this.trace && this.machine.stack.length) {
                this.dumpStack('stack after')
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

    private get currentInstruction() { return this.currentProgram[this.ip]; }

    get result() {
        let value = this.machine.peek();
        if (value !== undefined) {
            this.machine.pop();
            return value.toJS();
        } else {
            // this.machine.pop();
            return null;
        }
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
            // console.log("STORE", { key, db: this.db })
            this.machine.store(key, this.db);
        } else {
            throw new Error("Must have a key to reference stored variable by")
        }
    }

    private load(key: string | undefined) {
        if (key) {
            // console.log("LOAD", { key, db: JSON.stringify(this.db) })
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
            this.frames.push({ retAddr: this.ip, db: new SimpleDB(closure, this.db), self });
            this.jump(label);
        } else {
            throw new Error("invoke expects stack top to have function to call...")
        }
    }

    private compile(body: any) {
        if (body) {
            this.lambdaCount += 1
            let label = `lambda-${this.lambdaCount}`;
            let functionRef: MyrFunction = new MyrFunction( label, this.db.clone() )
            let code = this.compiler.generateCode(body)
            this.currentProgram = [
                ...this.code,
                instruct('halt'),
                instruct('noop', { label }),
                ...code,
            ]
            this.push(functionRef);
        } else {
            throw new Error("asked to gen code without code (ast expected in instr. 'body')")
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
                let gt: boolean = (this.machine.peek() as MyrNumeric).value === 1;
                this.machine.pop();
                this.push(new MyrBoolean(gt));
                break;
            case 'cmp_lt': 
                this.machine.compare();
                let lt: boolean = (this.machine.peek() as MyrNumeric).value === -1;
                this.machine.pop();
                this.push(new MyrBoolean(lt));
                break;
            case 'cmp_eq': 
                // let top = this.machine.peek();
                // if (top instanceof MyrNumeric || top instanceof MyrBoolean || top instanceof MyrString) {
                    this.machine.compare();
                    let eq: boolean = (this.machine.peek() as MyrNumeric).value === 0;
                    this.machine.pop();
                    this.push(new MyrBoolean(eq));
                // } else {
                    // send object equals??
                    // this
                    // let [top,second] = this.machine.topTwo;
                    // this.machine.objCompare();
                    // let eq: boolean = (this.machine.peek() as MyrNumeric).value === 0;
                    // this.machine.pop();
                    // this.push(new MyrBoolean(eq));
                    // this.push(new MyrBoolean((top as MyrObject).equals(second)))
                // }
                break;
            case 'cmp_neq': 
                this.machine.compare();
                let neq: boolean = (this.machine.peek() as MyrNumeric).value != 0;
                this.machine.pop();
                this.push(new MyrBoolean(neq));
                break;
            case 'store':
                this.store(instruction.key);
                // console.log("SELF AFTER STORE", { self: this.self, store: this.self.members.store })
                break;
            case 'load': 
                if (instruction.key === 'self') {
                    // console.log("LOAD SELF", { self: this.self })
                    this.push(this.self);
                    // load self as object???
                    // throw new Error("Don't know self")
                } else {
                    this.load(instruction.key);
                }
                break;
            case 'jump':  this.jump(instruction.target); break;
            case 'jump_if_gt':
                this.jump_gt(instruction.value, instruction.target);
                break;
            case 'jump_if_zero':
                this.jump_z(instruction.target);
                break;
            case 'call': 
                this.frames.push({ retAddr: this.ip, db: new SimpleDB(this.db), self: this.self }) //, self: this.self })
                this.jump(instruction.target);
                break;
            case 'invoke': this.invoke(); break;
            case 'exec':
                if (instruction.jsMethod) {
                    let fn = instruction.jsMethod;
                    if (instruction.arity) {
                        let args = this.machine.topN(instruction.arity);
                        fn(...args);
                        for (let i=0; i<instruction.arity-1; i++) {
                            this.machine.pop();
                        }
                    } else {
                        fn()
                    }
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
            case 'send_eq':
                let value = this.machine.peek();
                this.machine.pop();
                let recv = this.machine.peek();
                this.machine.pop();
                let msg = instruction.key;
                if (msg) {
                    debugger;
                    if (recv instanceof MyrHash) {
                        this.push(recv);
                        this.push(new MyrString(msg));
                        this.push(value);
                        this.machine.hashPut();
                    } else {
                        // console.log("SEND_EQ", { recv, msg, value })
                        recv.members.put(msg, value);
                    }
                } else {
                    throw new Error("must provide a key for send_eq?")
                }
                break;
            case 'send': 
                let receiver = this.machine.peek();
                if (receiver instanceof MyrHash && instruction.key) {
                    this.machine.push(new MyrString(instruction.key));
                    this.machine.hashGet();
                    if (this.machine.stackTop instanceof MyrFunction) {
                        // we should call the function?
                        this.invoke();
                    } else {
                        if (this.machine.stackTop === undefined) {
                            this.machine.pop(); // replace with nil?
                        }
                    }
                } else { // assume we're an object
                    this.machine.pop();
                    let message = (instruction.key);
                    if (message && receiver.members.get(message)) {
                        let member = receiver.members.get(message);
                        if (member instanceof MyrFunction) {
                            this.push(member);
                            this.invoke(receiver);
                        } else {
                            this.push(member);
                        }
                    } else {
                        throw new Error("Method missing on " + receiver.toJS() + ": " + message);
                    }
                }
                break;
            case 'construct':
                let newObj = new MyrObject();
                // newObj.members.put("initialize", new MyrNil())
                this.push(newObj);
                break;
            case 'dump':
                if (instruction.key) {
                    console.log(chalk.green(instruction.key));
                }
                this.dumpStack('[stack dump]')
                break;
            case 'mark':
                this.push(new Tombstone());
                break;
            case 'sweep':
                let done = false;
                while (this.machine.stack.length > 0 && !done) {
                    if (this.machine.peek() instanceof Tombstone) {
                        done = true;
                    }
                    this.machine.pop();
                }
                break;
            // case 'trace':
            default: assertNever(op);
        }
    }

    private dumpStack(message="Stack") {
        console.log(message + ": " + this.machine.stack.map(val => JSON.stringify(val.toJS())));
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