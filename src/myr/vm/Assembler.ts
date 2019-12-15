import { instruct, Instruction } from "./Instruction";

import { MyrBoolean } from "./AbstractMachine";

type MyrProgram = Instruction[]
export default class Assembler {
    static conds: number = 0;

    static if(test: MyrProgram, left: MyrProgram, right: MyrProgram, label: string = `if-${Assembler.conds++}`) {
        return [
            instruct('noop', { label: `${label}-test` }),
            ...test,
            instruct('push', { value: new MyrBoolean(true) }),
            instruct('cmp'),
            instruct('jump_if_zero', { target: `${label}-truthy` }),
            instruct('pop'),
            instruct('noop', { label: `${label}-falsy` }),
            ...right,
            instruct('jump', { target: `${label}-done` }),
            instruct('noop', { label: `${label}-truthy` }),
            instruct('pop'),
            ...left,
            instruct('noop', { label: `${label}-done` }),
        ]
    }
}