import Interpreter from './src/myr/vm/Interpreter';
import { SimpleAlgebra } from './src/myr/vm/SimpleAlgebra';
import { instruct, prettyProgram, Instruction as Inst } from './src/myr/vm/Instruction';
import { OpCode as Op } from './src/myr/vm/OpCode';
import { MyrObject, MyrNumeric, MyrBoolean, MyrFunction, MyrString, MyrNil, MyrArray, MyrHash } from './src/myr/vm/AbstractMachine';

export type Instruction = Inst;
export type OpCode = Op;
export {
    Interpreter,
    SimpleAlgebra,
    instruct,
    prettyProgram,

    MyrObject,
    MyrNil,
    MyrNumeric,
    MyrBoolean,
    MyrFunction,
    MyrString,
    MyrArray,
    MyrHash,
};