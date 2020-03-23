import {Environment} from './Environment';

/**
 * Eva interpreter
 */
export class Eva {
    private global: Environment;

    /**
     * Creates an instance of Eva with a global environment.
     */
    constructor(global = GlobalEnviroment) {
        this.global = global;
    }

    eval(exp, env = this.global) {
        
        // Self-evaluating expressions:
        if (this._isNumber(exp)) {
            return exp;
        }
        
        if (this._isString(exp)) {
            return exp.slice(1, -1);
        }
        
        // Block: sequence of expressions
        if(exp[0] === 'begin') {
            const blockEnv = new Environment({}, env);
            return this._evalBlock(exp, blockEnv);
        }

        // Variable declaration: (var foo 10)
        if (exp[0] === 'var') {
            const [_, name, value] = exp;
            return env.define(name, this.eval(value, env));
        }

        // Variable update: (set foo 100)
        if (exp[0] === 'set') {
            const [_, name, value] = exp;
            return env.assign(name, this.eval(value, env));
        }

        // Variable access: foo
        if (this._isVariableName(exp)) {
            return env.lookup(exp);
        }

        // if-expression:
        if (exp[0] === 'if') {
            const [_tag, condition, consequent, alternate] = exp;
            if (this.eval(condition, env)) {
                return this.eval(consequent, env);
            }
            return this.eval(alternate, env);
        }

        // while-expression:
        if (exp[0] === 'while') {
            const [_tag, condition, body] = exp;
            let result;
            while (this.eval(condition, env)) {
                result = this.eval(body, env);
            }
            return result;
        }

        // Function declaration: (def square (x) (* x x))
        //
        // Syntatic sugar for: (var square (lambda (x) (* x x)))
        if (exp[0] === 'def') {
            const [_tag, name, params, body] = exp;

            // JIT-transpile to a variable declaration
            const varExp = ['var', name, ['lambda', params, body]];
            
            return this.eval(varExp, env);
        }

        // Lambda function: (lambda (x) (* x x))
        if (exp[0] === 'lambda') {
            const [_tag, params, body] = exp;
            return {
                params,
                body,
                env, // Closure
            }
        }

        // Function calls:
        //
        // (print "Hello World")
        // (+ x 5) built-in + fn
        // (> foo bar) built-in > fn

        if (Array.isArray(exp)) {
            const fn = this.eval(exp[0], env);
            const args = exp.slice(1).map(arg => this.eval(arg, env));

            // Native function:
            if (typeof fn === 'function') {
                return fn(...args);
            }

            // User-defined function:
            const activationRecord = {};

            // instoll all the params with the passed arguments
            fn.params.forEach((param, index) => {
                activationRecord[param] = args[index];
            });

            const activationEnviroment = new Environment(
                activationRecord,
                fn.env // static scope
            );

            return this._evalBody(fn.body, activationEnviroment);
        }

        throw `Unimplemented: ${JSON.stringify(exp)}`
    }

    private _evalBody(body, env) {
        // if it is a block
        if (body[0] === 'begin') {
            return this._evalBlock(body, env);
        }
        // or is a simple expression
        return this.eval(body, env);
    }

    private _evalBlock(block, env) {
        let result;
        const [_tag, ...expressions] = block;
        expressions.forEach(exp => {
            result = this.eval(exp, env);
        });
        return result;
    }

    private _isNumber(exp) {
        return typeof exp === 'number';
    }
    
    private _isString(exp) {
        return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
    }
    
    private _isVariableName(exp) {
        return typeof exp === 'string' && /^[+\-*/<>=a-zA-Za-zA-Z0-9_]*$/.test(exp);
    }
}

/**
 * Default Global Eviroment
 */
const GlobalEnviroment = new Environment({
    null: null,

    true: true,
    false: false,

    VERSION: '0.1',

    // Operators:
    '+'(op1: number, op2: number) { 
        return op1 + op2 
    },
    '*'(op1: number, op2: number) { 
        return op1 * op2
    },
    '-'(op1: number, op2 = null) {
        if (op2 == null) {
            return -op1;
        }
        return op1 - op2;
    },
    '/'(op1: number, op2) { 
        return op1 / op2
    },

    //Comparison:
    '>'(op1: number, op2: number) { 
        return op1 > op2 
    },
    '>='(op1: number, op2: number) { 
        return op1 >= op2
    },
    '<'(op1: number, op2: number) { 
        return op1 < op2 
    },
    '<='(op1: number, op2: number) { 
        return op1 <= op2
    },
    '='(op1: number, op2: number) {
        return op1 === op2
    },

    print: (...args) => console.log(...args)
});