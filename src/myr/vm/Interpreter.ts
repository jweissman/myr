import chalk from 'chalk';
import assertNever from 'assert-never';
import { Value } from './AbstractMachine';
import { Algebra } from "./Algebra";
import { Controller } from './Controller';

import { DB } from './DB';
import { prettyInstruction, Instruction, instruct } from "./Instruction";
import Machine from "./Machine";
import { OpCode } from './OpCode';
import { SimpleDB } from './SimpleDB';
import Assembler from './Assembler';
import { MyrObject, MyrNumeric, MyrFunction, myrTypes, myrClasses, WrappedFunction, MyrClass } from './Types';

type Frame = { retAddr: number, db: DB,
    self: MyrObject }
    // selves: MyrObject[] } //self: MyrObject }
class MainClass extends MyrClass { get name() {return 'Main'}}
let main = new MyrObject();
main.members.put("class", MainClass);

abstract class Compiler<T> {
    abstract generateCode(ast: T): Instruction[];
}

class Interpreter<T> {
    public trace: boolean = false;

    public machine: Machine;
    public controls: Controller<T>;

    private ip: number = -1;
    private frames: Frame[] = [{ retAddr: -1, db: new SimpleDB(),
        self: main }]
        // selves: [main]
    // }]
    // private selves: MyrObject[] = [main];

    constructor(algebra: Algebra, private compiler: Compiler<T>) {
        this.machine = new Machine(algebra);
        this.controls = new Controller(this);

        this.run(Assembler.prelude())
    }

    public get topFrame() { return this.frames[this.frames.length-1]; }

    private get retAddr(): number {
        return this.topFrame.retAddr;
    }

    public get self(): MyrObject {
        return this.topFrame.self //ves[thisselfame.selves.length-1];
        // return this.topFrame.selves[this.topFrame.selves.length-1];
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
        // let stackLengths = []
        let seenInstructions: { [key in OpCode]?: number } = {}
        let lastLabel: string = '---'
        while (this.ip < this.currentProgram.length) {
            steps += 1;
            let instruction = this.currentInstruction;
            if (this.trace) {
                console.log(`@${this.ip}: ` + prettyInstruction(instruction));
            }

            if (instruction.op === 'noop') {
                lastLabel = instruction.label || 'no-label';
            } else {
                // if (this.trace && this.machine.stack.length) {
                //     this.dumpStack('stack before')
                // }
                try {
                    this.execute(instruction);
                    seenInstructions[instruction.op] = //push(instruction);
                        (seenInstructions[instruction.op] || 0) + 1;
                } catch (e) {
                    console.warn(
                        chalk.red("Error executing instruction " + prettyInstruction(instruction) + ":" + e.message)
                    )
                    console.debug("at method " + chalk.blue(lastLabel))
                    console.debug(this.currentProgram.slice(this.ip - 5, this.ip + 5))
                    throw (e);
                }
                if (this.trace && this.machine.stack.length) {
                    this.dumpStack(chalk.green('stack after'))
                }

                // this.store(this.result)
                if (this.machine.stack.length) {
                    this.machine.store("_", this.db);
                }

            }
            this.ip++;
            // stackLengths.push(this.machine.stack.length)
        }
        let endTime = new Date().getTime();
        let elapsed = endTime - startTime;
        if (elapsed > 10) {
            console.log(`---> Ran ${steps} instructions in ${elapsed}ms: ${steps / elapsed} ops/ms`)
            // console.debug(`---> opcodes invoked: ${JSON.stringify(seenInstructions)}`)
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


    public invoke(self = this.self) {
        let top = this.machine.stackTop;
        this.machine.pop()
        if (top && top instanceof WrappedFunction) {
            let { label, impl, closure } = top;
            // this.machine.pop();
            this.controls.callExec(impl, impl.length)
        } else if (top && top instanceof MyrFunction) {
            let { label, closure } = top;
            let db = new SimpleDB(closure, this.db)
            this.frames.push({ retAddr: this.ip, db, self });
            // console.log("INVOKE NORMAL FUNCTION", { label, closure, self, dbSelf: db.get("self") })
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
                let newFrame = { retAddr: this.ip, db: new SimpleDB(this.db),
                    self: this.self };
                    // selves: [this.self] } //ves: [this.self] }
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
            case 'send_attr': this.controls.send(instruction.key, this.db); break;
            case 'send_call': 
                // console.log(`send call ${instruction.key}`)
                // debugger;
                let { receiver, called } = this.controls.send(instruction.key, this.db); 
                // if (receiver) {
                if (!called) {
                    // console.log(`${instruction.key} -- attempting to invoke...`, { receiver })
                    this.invoke(receiver);
                }
                break;
            case 'construct':
                if (instruction.key) {
                    if (myrTypes[instruction.key]) {
                        let Klass = myrTypes[instruction.key];
                        let klass = new Klass()
                        klass.members.put("class", myrClasses[instruction.key])
                        // let { shared } = klass.members.store.class.members.store
                        // console.log("FABRICATE INSTANCE", {
                        //     key: instruction.key, instance: klass, shared: shared.members
                        // })
                        this.controls.push(klass)
                    } else {
                        this.controls.push(new MyrObject())
                    }
                } else {
                    let newObj = new MyrObject();
                    this.controls.push(newObj);
                }
                break;
            case 'dump':
                if (instruction.key) {
                    console.log(chalk.green(instruction.key));
                }
                this.dumpStack('[stack dump]')
                break;
            case 'mark': this.controls.mark('floor'); break;
            case 'sweep': this.controls.sweep('floor'); break;
            case 'mark_list': this.controls.mark('list'); break;
            case 'gather': this.controls.gather('list'); break;
            default: assertNever(op);
        }
    }

    private dumpStack(message="Stack") {
        let theStack = this.machine.stack.map(val => (val instanceof MyrObject ? val.toJS() : JSON.stringify(val)))
        console.log(
            message + ": " + theStack
        );
        console.log(chalk.gray("self: " + this.self.toJS()));
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