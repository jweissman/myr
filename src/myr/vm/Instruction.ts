import chalk from 'chalk';
import { OpCode } from "./OpCode";
import { Value } from './AbstractMachine';

export type Instruction = {
    op: OpCode;

    // sparse little dict
    key?: string;     // key to store/load
    value?: Value;        // value to push
    label?: string;   // label at this instruction
    target?: string;  // jump/call target

    // for 'builtin' methods to be supplied literally...
    jsMethod?: Function; 
    arity?: number; // really for builtins right now...

    body?: any;
};

export function instruct(
    op: OpCode,
    details: {
        value?: Value,
        label?: string,
        key?: string,
        target?: string,
        jsMethod?: Function,
        arity?: number,
        body?: any
    } = {}
) {
    return { op, ...details }
}

let pad = 12;
export function prettyInstruction(inst: Instruction) {
    let arg = inst.value || inst.key || inst.target 
    let result;
    if (arg && !(arg === undefined)) {
        result = `${inst.op}(${(arg)})`.padEnd(pad);
    } else {
        result = String(inst.op).padEnd(pad);
    }
    if (inst.label) {
        return chalk.blueBright(result) + chalk.gray('#' + inst.label)
    }
    return chalk.blueBright(result);
}

export function prettyProgram(prog: Instruction[]) {
    return prog.map((instruction, index) =>
        String(index).padEnd(4) + prettyInstruction(instruction)
    ).join("\n")
}

// export type Instruction;