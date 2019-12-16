import Interpreter from './src/myr/vm/Interpreter';
import { SimpleAlgebra } from './src/myr/vm/SimpleAlgebra';
import { instruct, prettyProgram, Instruction as Inst } from './src/myr/vm/Instruction';
import { OpCode as Op } from './src/myr/vm/OpCode';
import { MyrObject, MyrNumeric, MyrBoolean, MyrFunction, MyrString, MyrNil, MyrArray, MyrHash, MyrClass, classClass, arrayClass } from './src/myr/vm/AbstractMachine';
import Assembler from './src/myr/vm/Assembler';

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
    MyrClass,

    Assembler,

    arrayClass,
    classClass,
};