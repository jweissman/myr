import Interpreter from './src/myr/vm/Interpreter';
import { SimpleAlgebra } from './src/myr/vm/SimpleAlgebra';
import { instruct, prettyProgram, Instruction as Inst } from './src/myr/vm/Instruction';
import { OpCode as Op } from './src/myr/vm/OpCode';
import Assembler from './src/myr/vm/Assembler';
import { MyrObject, MyrNil, MyrNumeric, MyrBoolean, MyrFunction, MyrString, MyrArray, MyrHash, MyrClass, arrayClass, classClass, numberClass, stringClass, boolClass, hashClass } from './src/myr/vm/Types';

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
    numberClass,
    stringClass,
    boolClass,
    hashClass,
};