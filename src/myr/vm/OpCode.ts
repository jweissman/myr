export type OpCode = 'push'
                   | 'pop'
                   | 'swap'
                   | 'dup'
                   | 'noop' 

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

                   | 'cmp'
                   | 'cmp_gt'
                   | 'cmp_lt'
                   | 'cmp_eq'

                   | 'jump'
                   | 'jump_if_gt'
                   | 'jump_if_zero'

                   | 'call'            // CALL   -- invoke function at [target]
                   | 'invoke'          // INVOKE -- invoke function with label identified by (top)
                   | 'exec'            // EXEC   -- execute a JS function given as such by [jsMethod],
                                       //           giving stack as positional args up to [arity]
                   | 'ret'
                   ;
