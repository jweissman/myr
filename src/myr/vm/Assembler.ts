import { instruct, Instruction } from "./Instruction";

import { MyrBoolean, arrayClass, numberClass } from "./AbstractMachine";

type MyrProgram = Instruction[]
export default class Assembler {

    static prelude(): Instruction[] { return [...Assembler.embeds()]}

    static embeds(): Instruction[] {
        return [
            instruct('push', { value: arrayClass }),
            instruct('store', { key: arrayClass.name }),
            instruct('pop'),

            instruct('push', { value: numberClass }),
            instruct('store', { key: numberClass.name }),
            instruct('pop'),
        ]
    }

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