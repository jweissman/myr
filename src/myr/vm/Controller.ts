import { Value, MyrObject, MyrHash, MyrString, Tombstone, MyrBoolean, MyrClass } from "./AbstractMachine";
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
            return (raw as MyrObject).toJS();
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
    
    public exists(key: string | undefined, db: DB) {
        if (key !== undefined) {
            this.machine.push(
                new MyrBoolean(db.has(key))
            );
        } else {
            throw new Error("must have a key to check exists")
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
                (recv as MyrObject).members.put(msg, value);
            }
        } else {
            throw new Error("must provide a key for send_eq?")
        }
    }

    public send(key: string | undefined): { called: boolean, receiver: MyrObject } { //(instruction: Instruction) {
        let receiver = this.machine.peek();
        let called = false;
        if (receiver instanceof MyrHash && key) {
            this.machine.push(new MyrString(key));
            this.machine.hashGet();
        } else if (receiver instanceof MyrObject) { // assume we're an object
            this.machine.pop();
            let message = (key);
            if (message) {
                let hasClass = receiver.members.has("class");
                let klass = hasClass ? receiver.members.get("class") : undefined;
                let hasClassMethod = hasClass &&
                    receiver.members.get("class").members.has("shared") &&
                    receiver.members.get("class").members.get("shared").members.has(message);
                        // debugger;

                if ((receiver.members as SimpleDB).has(message)) {
                    let member = receiver.members.get(message);
                    this.push(member);
                } else if (hasClass && hasClassMethod) {
                    // receiver.members.get("class").members.has("shared") &&
                    // receiver.members.get("class").members.get("shared").members.has(message)) {
                    let member = // receiver.members.get("class").shared
                        receiver.members.get("class").members.get("shared").members.get(message);
                    // let member = definition.members.get(message);
                    this.push(member);
                } else {
                    let fn = receiver.jsMethods[message];
                    if (fn) {
                        this.callExec(fn,fn.length)
                        called = true;
                    } else {
                        console.trace("method missing", { klass, receiver, message, hasClass, hasClassMethod  })
                        throw new Error("Method missing on " + (receiver.toJS()) + ": " + message);
                    }
                }
            } else {
                throw new Error("send expects key of message to dispatch");
            }
        } else {
            throw new Error("send expects receiver to be object");
        }
        return { receiver, called } ;
    }

    public callExec(jsMethod: Function, arity: number) {
        // console.log("CALL EXEC", jsMethod)
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

        // console.log("CALL EXEC RETURN", jsResult)

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
            (this.machine.peek() as MyrObject).value,
            expected
        );
        this.machine.pop();
        this.push(new MyrBoolean(eq));
    }
}