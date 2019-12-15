import { Value, MyrObject, MyrHash, MyrString, Tombstone, MyrBoolean } from "./AbstractMachine";
import Machine from "./Machine";
import { DB } from "./DB";
import { SimpleDB } from "./SimpleDB";

export class Controller {
    constructor(private machine: Machine) {}

    get rawResult() { 
        let value = this.machine.peek();
        if (value !== undefined) {
            this.machine.pop();
            return value;
        } else {
            return null;
        }
    }

    get result() {
        let raw = this.rawResult
        if (raw !== null) {
            return raw.toJS();
        } else {
            return null;
        }
    }

    public push(value: Value | undefined) {
        if (value !== undefined) {
            this.machine.push(value);
        } else {
            throw new Error("Push must have a value")
        }
    }

    public store(key: string | undefined, db: DB) {
        if (key !== undefined) {
            // console.log("STORE", { key, db: this.db })
            this.machine.store(key, db);
            // this.machine.pop()
        } else {
            throw new Error("Must have a key to reference stored variable by")
        }
    }

    public load(key: string | undefined, db: DB, overrides: { [k: string]: MyrObject}) {
        if (key) {
            if (Object.keys(overrides).indexOf(key) !== -1) {
                this.push(overrides[key])

            } else {
                // console.log("LOAD", { key, db: JSON.stringify(this.db) })
                this.machine.load(key, db);
            }
        } else {
            throw new Error("Must have a key to reference loaded variable by")
        }
    }

    public sendEq(key: string | undefined) {
        let value = this.machine.peek();
        this.machine.pop();
        let recv = this.machine.peek();
        this.machine.pop();
        let msg = key;
        if (msg) {
            if (recv instanceof MyrHash) {
                this.push(recv);
                this.push(new MyrString(msg));
                this.push(value);
                this.machine.hashPut();
            } else {
                recv.members.put(msg, value);
            }
        } else {
            throw new Error("must provide a key for send_eq?")
        }
    }

    public send(key: string | undefined) { //(instruction: Instruction) {
        let receiver = this.machine.peek();
        if (receiver instanceof MyrHash && key) {
            this.machine.push(new MyrString(key));
            this.machine.hashGet();
        } else { // assume we're an object
            this.machine.pop();
            let message = (key);
            if (message) {
                if ((receiver.members as SimpleDB).has(message)) {
                    let member = receiver.members.get(message);
                    this.push(member);
                } else {
                    // could send method missing
                    // for now maybe check if method is defined on object? and exec
                    // (we could compile the wrapped function at defn?)
                    let fn = receiver.jsMethods[message];
                    if (fn) {
                        this.callExec(fn,0)
                        // fall thru for builtins?
                        // this.ex
                    } else {
                        throw new Error("Method missing on " + receiver.toJS() + ": " + message);
                    }
                }
            } else {
                throw new Error("send expects key of message to dispatch");
            }
        }
        return receiver;
    }

    public callExec(jsMethod: Function, arity: number) {
        // if (instruction.jsMethod) {
        let fn = jsMethod;
        let jsResult = null;
        if (arity) {
            let args = this.machine.topN(arity);
            jsResult = fn(...args);
            for (let i = 0; i < arity; i++) {
                this.machine.pop();
            }
        } else {
            jsResult = fn()
        }

        if (jsResult && (jsResult instanceof MyrObject)) {
            this.push(jsResult);
        }
    }

    public mark() {
        this.push(new Tombstone());
    }

    public sweep() {
        let done = false;
        while (this.machine.stack.length > 0 && !done) {
            if (this.machine.peek() instanceof Tombstone) {
                done = true;
            }
            this.machine.pop();
        }
    }

    public compare(expected: number, cmp=(l: number,r: number)=>l===r) {
        this.machine.compare();
        let eq: boolean = cmp(
            this.machine.peek().value,
            expected
        );
        this.machine.pop();
        this.push(new MyrBoolean(eq));
    }
}