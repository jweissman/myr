import chalk from 'chalk';
import { OpCode } from "./OpCode";

type Instruction<T> = {
    op: OpCode;

    // sparse little dict
    key?: string;     // key to store/load
    value?: T;        // value to push
    label?: string;   // label at this instruction
    target?: string;  // jump/call target
};

export function instruct<T>(
    op: OpCode,
    details: { value?: T, label?: string, key?: string, target?: string} = {}
) {
    return { op, ...details }
}

let pad = 12;
export function prettyInstruction<T>(inst: Instruction<T>) {
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

export function prettyProgram<T>(prog: Instruction<T>[]) {
    return prog.map((instruction, index) =>
        String(index).padEnd(4) + prettyInstruction(instruction)
    ).join("\n")
}

export default Instruction;