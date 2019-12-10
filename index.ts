import Interpreter from './src/myr/vm/Interpreter';
import { SimpleAlgebra } from './src/myr/vm/SimpleAlgebra';
import { instruct, prettyProgram, Instruction as Inst } from './src/myr/vm/Instruction';
import { OpCode as Op } from './src/myr/vm/OpCode';

export type Instruction = Inst;
export type OpCode = Op;
export {
    Interpreter,
    SimpleAlgebra,
    instruct,
    prettyProgram,
};