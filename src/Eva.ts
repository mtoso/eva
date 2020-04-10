import {Environment} from './Environment';
import { Transformer } from './transform/Transformer';

interface StackFrame {
    env: Environment;
    fnName: String;
}

export type BinaryOperator = 
    '+'
    | '-'
    | '*'
    | '/'
    | '<'
    | '>'
    | '='
    | '>='
    | '<='

export type UpdateOperator = 
    '++'
    | '--'
    | '+='
    | '-='

export type NumberLiteral = number;
export type StringLiteral = string;
export type BlockExpression = ['begin', ...Expression[]];
export type VariableIdentifier = string;
export type VariableDeclarationExpression = ['var', VariableIdentifier, Expression];
export type VariableAssignmentExpression= ['set', VariableIdentifier, Expression];
export type IfExpression = ['if', Expression, Expression, Expression];
export type WhileExpression = ['while', Expression, Expression];
export type FunctionExpression = ['def', string, string[], Expression];
export type LambdaExpression = ['lambda', string[], Expression];
export type BinaryExpression = [BinaryOperator, Expression, Expression];
export type SwitchExpression = ['switch', Expression[], ['else', Expression]];
export type ForExpression = ['for', Expression, Expression, Expression, Expression];
export type UpdateExpression = [UpdateOperator, VariableIdentifier, Expression | null];

export type Expression = 
    NumberLiteral
    | StringLiteral
    | BlockExpression
    | VariableDeclarationExpression
    | VariableAssignmentExpression
    | VariableIdentifier
    | IfExpression
    | WhileExpression
    | FunctionExpression
    | LambdaExpression
    | BinaryExpression
    | SwitchExpression
    | ForExpression
    | UpdateExpression;

/**
 * Eva interpreter
 */
export class Eva {
    #global: Environment;
    #executionStack: StackFrame[];
    #transformer: Transformer;

    /**
     * Creates an instance of Eva with a global environment.
     */
    constructor(global = GlobalEnviroment) {
        this.#global = global;
        this.#executionStack = [];
        this.#transformer = new Transformer();
    }

    eval(exp: Expression, env = this.#global) {

        // Self-evaluating expressions:
        if (this._isNumberLiteral(exp)) {
            return (exp as NumberLiteral);
        }
        
        if (this._isStringLiteral(exp)) {
            return (exp as StringLiteral).slice(1, -1);
        }

        if (exp[0] === 'print_stack_trace') {
            return this._printStackTrace();
        }
        
        // Block: sequence of expressions
        if(exp[0] === 'begin') {
            const blockEnv = new Environment({}, env);
            return this._evalBlock(exp as BlockExpression, blockEnv);
        }

        // Variable declaration: (var foo 10)
        if (exp[0] === 'var') {
            const [_, name, value] = (exp as VariableDeclarationExpression);
            return env.define(name, this.eval(value, env));
        }

        // Variable assignment: (set foo 100)
        if (exp[0] === 'set') {
            const [_, name, value] = (exp as VariableAssignmentExpression);
            return env.assign(name, this.eval(value, env));
        }

        // Variable access: foo
        if (this._isVariableName(exp)) {
            return env.lookup((exp as VariableIdentifier));
        }

        // if-expression:
        if (exp[0] === 'if') {
            const [_tag, condition, consequent, alternate] = (exp as IfExpression);
            if (this.eval(condition, env)) {
                return this.eval(consequent, env);
            }
            return this.eval(alternate, env);
        }

        // while-expression:
        if (exp[0] === 'while') {
            const [_tag, condition, body] = (exp as WhileExpression);
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
            // JIT-transpile to a variable declaration
            const varExp = this.#transformer.transformDefToVarLambda(exp as FunctionExpression);
            return this.eval(varExp, env);
        }

        // Switch-expression: (switch (cond1, block1) ...)
        //
        // Syntatic sugar for nested if-expresions
        if (exp[0] === 'switch') {
            // JIT-transpile to if-expression
            const ifExp = this.#transformer.transfromSwitchToIf(exp as SwitchExpression);
            return this.eval(ifExp, env);
        }

        // For-expression: (for (init) (condition) (modifier) (exp))
        //
        // Syntatic sugar for nested while-expresions
        if (exp[0] === 'for') {
            // JIT-transpile to while-expression
            const blockExp = this.#transformer.transformForToWhile(exp as ForExpression);
            return this.eval(blockExp, env);
        }

        // ++ Operator: (++ x)
        //
        // Syntatic sugar for (set x (+ x 1))
        if (exp[0] === '++' || exp[0] === '--' || exp[0] === '+=' || exp[0] === '-=') {
            // JIT-transpile to set-expression
            const varUpdateExp = this.#transformer.transfromUpdateToSet(exp as UpdateExpression);
            return this.eval(varUpdateExp, env);
        }

        // Lambda function: 
        //
        // (lambda (x) (* x x))
        if (exp[0] === 'lambda') {
            const [_tag, params, body] = (exp as LambdaExpression);
            return {
                params,
                body,
                env, // Closure
            }
        }

        // Function calls (execution):
        //
        // (print "Hello World") built-in "print" fn call
        // (square 2) user-defined "square" fn call
        // (+ x 5) built-in "plus" operator fn call
        // (> foo bar) built-in "greater" operator fn call
        if (Array.isArray(exp)) {
            const fn = this.eval(exp[0], env);
            const args = (exp.slice(1) as Expression[]).map(arg => this.eval(arg, env));
            
            // Save the execution context stack
            const fnName = typeof exp[0] === 'string' ? exp[0] : '(anonymous)';
            this.#executionStack.push({
                env: fn.env,
                fnName
            });

            // Native function:
            if (typeof fn === 'function') {
                return fn(...args);
            }

            // User-defined function:
            const activationRecord = {};

            // Install all the params with the passed arguments
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

    private _evalBlock(block: BlockExpression, env: Environment) {
        let result;
        const [_tag, ...expressions] = block;
        expressions.forEach(exp => {
            result = this.eval(exp, env);
        });
        return result;
    }

    private _isNumberLiteral(exp: Expression) {
        return typeof exp === 'number';
    }
    
    private _isStringLiteral(exp: Expression) {
        return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
    }
    
    private _isVariableName(exp) {
        return typeof exp === 'string' && /^[+\-*/<>=a-zA-Za-zA-Z0-9_]*$/.test(exp);
    }

    private _printStackTrace() {
        this.#executionStack.reverse().forEach(stackFrame => {
            console.log(`${stackFrame.fnName}: ${stackFrame.env}`);
        });
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