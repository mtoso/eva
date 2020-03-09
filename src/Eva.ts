import {Environment} from './Environment';

/**
 * Eva interpreter
 */
export class Eva {
    private global: Environment;

    /**
     * Creates an instance of Eva with a global environment.
     */
    constructor(global = new Environment()) {
        this.global = global;
    }

    eval(exp, env = this.global) {
        
        // Self-evaluating expressions:
        if (isNumber(exp)) {
            return exp;
        }
        if (isString(exp)) {
            return exp.slice(1, -1);
        }
        
        // Math operations:
        if (exp[0] === '+') {
            return this.eval(exp[1], env) + this.eval(exp[2], env);
        }
        if (exp[0] === '*') {
            return this.eval(exp[1], env) * this.eval(exp[2], env);
        }
        if (exp[0] === '-') {
            return this.eval(exp[1], env) - this.eval(exp[2], env);
        }
        if (exp[0] === '/') {
            return this.eval(exp[1], env) / this.eval(exp[2], env);
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
        if (isVariableName(exp)) {
            return env.lookup(exp);
        }
        throw `Unimplemented: ${JSON.stringify(exp)}`
    }

    private _evalBlock(block, env) {
        let result;
        const [_tag, ...expressions] = block;
        expressions.forEach(exp => {
            result = this.eval(exp, env);
        });
        return result;
    }
}

function isNumber(exp) {
    return typeof exp === 'number';
}

function isString(exp) {
    return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
}

function isVariableName(exp) {
    return typeof exp === 'string' && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(exp);
}