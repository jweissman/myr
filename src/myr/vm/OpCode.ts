export type OpCode =
                   | 'noop'

                   | 'push'
                   | 'pop'
                   | 'swap'
                   | 'dup'

                   | 'and'
                   | 'or'
                   | 'not'

                   | 'inc'
                   | 'dec'
                   | 'add'
                   | 'sub'
                   | 'mul'
                   | 'div'
                   | 'pow'

                   | 'store' 
                   | 'load'
                   | 'exists'

                   | 'arr_get'
                   | 'arr_put'
                   | 'hash_get'
                   | 'hash_put'
                //    | 'push_self'
                //    | 'pop_self'
                  //  | 'send' 
                   | 'send_attr' // .a
                   | 'send_call' // .a()
                   | 'send_eq'   // .a=
                   | 'construct' // raw construct, put a new myr object on the stack

                   | 'mark_list' // put a special list marker on the stack
                   | 'gather'    // accum objects until list marker and push a new 'raw' list on the stack

                   | 'cmp'
                   | 'cmp_gt'
                   | 'cmp_lt'
                   | 'cmp_eq'
                   | 'cmp_neq'

                   | 'jump'
                   | 'jump_if_gt'
                   | 'jump_if_zero'

                   | 'call'            // CALL   -- invoke function at [target]
                   | 'invoke'          // INVOKE -- invoke function with label identified by (top)
                   | 'exec'            // EXEC   -- execute a JS function given as such by [jsMethod],
                                       //           giving stack as positional args up to [arity]
                   | 'compile'         // COMPILE -- take ast and generate code for it

                  //  | 'set_self' // set self for current call frame...
                  // | 'enter' // set self...
                  //  | 'pop_self' // set self

                   | 'ret'
                   | 'halt' // hard stop
                   | 'dump' // print stack

                   | 'mark' // push tombstone onto stack
                   | 'sweep' // pop until tombstone is found
                   ;
