import { Value } from "./AbstractMachine";
import Machine from "./Machine";
import { DB } from "./DB";
import { SimpleDB } from "./SimpleDB";
import { MyrObject, MyrBoolean, MyrString, Tombstone, MyrArray, WrappedFunction } from "./Types";
import Interpreter from "./Interpreter";

export class Controller<T> {
    private get machine(): Machine { return this.meta.machine; }

    constructor(private meta: Interpreter<T>) {}

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

    public load(key: string | undefined, db: DB, fallbacks: { [k: string]: MyrObject}) {
        if (key) {
          if (db.has(key)) {
              // console.log("LOAD", { key, db: JSON.stringify(this.db) })
              this.machine.load(key, db);
          } else if (Object.keys(fallbacks).indexOf(key) !== -1) {
              this.push(fallbacks[key])
          } else {
              throw new Error("Not found at load '" + key + "'")
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
        //     if (recv instanceof MyrHash) {
        //         this.push(recv);
        //         this.push(new MyrString(msg));
        //         this.push(value);

            (recv as MyrObject).members.put(msg, value);
        //     }
        } else {
            throw new Error("must provide a key for send_eq?")
        }
    }

    private respondsTo(key: string | undefined): boolean {
        let receiver = this.machine.peek();
        if (receiver instanceof MyrObject) { // assume we're an object
            // this.machine.pop();
            let message = (key);
            if (message) {
                let hasClass = receiver.members.has("class");
                let klass = hasClass ? receiver.members.get("class") : undefined;
                let hasClassMethod = hasClass &&
                    receiver.members.get("class").members.has("shared") &&
                    receiver.members.get("class").members.get("shared").members.has(message);
                if ((receiver.members as SimpleDB).has(message)) {
                    return true;
                    // let member = receiver.members.get(message);

                    // this.push(member);
                } else if (hasClass && hasClassMethod) {
                    return true;
                    // let member = receiver.members.get("class").members.get("shared").members.get(message);
                    // this.push(member);
                } else {
                    let fn = receiver.jsMethods[message];
                    if (fn) {
                        // this.callExec(fn,fn.length)
                        // called = true;
                        return true;
                    } else {
                        console.trace("method missing", { klass, receiver, message, hasClass, hasClassMethod })
                        // this.push(key);
                        // this.machine.push(receiver);
                        // this.send('method_missing') //receiver
                        // if (failMissing) {
                            // throw new Error("Method missing on " + (receiver.toJS()) + ": " + message);
                        // }
                    }
                }
            } else {
                throw new Error("respond to expects key of message to dispatch");
            }
        } else {
            throw new Error("respond to expects receiver to be object");
        }
        return false;

    }

    private methodMissing(message: string, receiver: MyrObject, db: DB) {
        this.machine.push(receiver);
        if (this.respondsTo("method_missing")) {
            this.machine.pop();
            this.machine.push(new MyrString(message))
            this.machine.push(receiver);
            this.send('method_missing', db)
            // this.meta.topFrame.selves.push(receiver);
            this.meta.invoke(receiver)
            // this.meta.topFrame.selves.pop()
        } else {
            throw new Error("Method missing on " + (receiver.toJS()) + ": " + message);
        }
    }

    public send(key: string | undefined, db: DB): { called: boolean, receiver: MyrObject } {
        let receiver = this.machine.peek();
        let called = false;
        // console.log("SEND", { key, receiver})
        // if (receiver instanceof MyrHash && key) {
        //     this.machine.push(new MyrString(key));
        //     this.machine.hashGet();
        // } else
        if (receiver instanceof MyrObject) { // assume we're an object
            this.machine.pop();
            let message = (key);
            if (message) {
                let hasClass = receiver.members.has("class");
                // let klass = hasClass ? receiver.members.get("class") : undefined;
                let hasClassMethod = hasClass &&
                    receiver.members.get("class").members.has("shared") &&
                    receiver.members.get("class").members.get("shared").members.has(message);
                if ((receiver.members as SimpleDB).has(message)) {
                    let member = receiver.members.get(message);
                    this.push(member);
                } else if (hasClass && hasClassMethod) {
                    let member = receiver.members.get("class").members.get("shared").members.get(message);
                    this.push(member);
                } else {
                    let fn = receiver.jsMethods[message];
                    if (fn) {
                        let wrappedDb = db.clone();
                        wrappedDb.put("self", receiver);
                        this.machine.push(new WrappedFunction(message, fn, wrappedDb));
                        called = false;
                    } else {
                        this.methodMissing(message, receiver, db)
                        called = false;
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

    public mark(label: string) {
        this.push(new Tombstone(label));
    }

    public sweep(label: string) {
        let done = false;
        while (this.machine.stack.length > 0 && !done) {
            let it = this.machine.peek()
            if (it instanceof Tombstone) {
                if (it.label === label) {
                    done = true;
                }
            }
            this.machine.pop();
        }
    }

    public gather(label: string) {
        let done = false;
        let list = new MyrArray();
        while (this.machine.stack.length > 0 && !done) {
            let it = this.machine.peek()
            if (it instanceof Tombstone) {
                if (it.label === label) {
                    done = true;
                }
            } else {
                list.members.get("arr").push(this.machine.peek());
            }
            this.machine.pop();
        }
        this.machine.push(list);
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