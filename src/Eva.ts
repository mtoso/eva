import { Environment } from './Environment';
import { Transformer } from './transform/Transformer';
import evaParser from './parser/evaParser';
import fs from 'fs';

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
export type VariableAssignmentExpression = ['set', VariableIdentifier|ClassPropertyAccessExpression, Expression];
export type IfExpression = ['if', Expression, Expression, Expression];
export type WhileExpression = ['while', Expression, Expression];
export type FunctionExpression = ['def', string, string[], Expression];
export type LambdaExpression = ['lambda', string[], Expression];
export type BinaryExpression = [BinaryOperator, Expression, Expression];
export type SwitchExpression = ['switch', Expression[], ['else', Expression]];
export type ForExpression = ['for', Expression, Expression, Expression, Expression];
export type UpdateExpression = [UpdateOperator, VariableIdentifier, Expression | null];
export type ClassExpression = ['class', string, string | null, Expression];
export type ClassInstantiationExpression = ['new', string, ...any[]];
export type ClassPropertyAccessExpression = ['prop', string, string];
export type ClassSuperExpression = ['super', string];
export type ModuleExpression = ['module', string, BlockExpression];
export type ImportExpression = ['import', string[]|null, string];
export type ExportsExpression = ['exports', ...string[]];

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
    | UpdateExpression
    | ClassExpression
    | ClassInstantiationExpression
    | ClassPropertyAccessExpression
    | ClassSuperExpression
    | ModuleExpression
    | ImportExpression
    | ExportsExpression;

/**
 * Eva interpreter
 */
export class Eva {
    #global: Environment;
    #executionStack: StackFrame[];
    #transformer: Transformer;
    #moduleCache: object;

    /**
     * Creates an instance of Eva with a global environment.
     */
    constructor(global = GlobalEnviroment) {
        this.#global = global;        
        this.#executionStack = [];
        this.#transformer = new Transformer();
        this.#moduleCache = Object.create(null);
    }

    /**
     * Evaluates global code wrapping into a block.
     */
    evalGlobal(exp: Expression) {
        return this._evalBody(exp,this.#global);
    }

    /**
     * Evaluates an expression in a given environment.
     */
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
        if (exp[0] === 'begin') {
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
            const [_, ref, value] = (exp as VariableAssignmentExpression);
            
            // Assignment to a property:
            if (ref[0] === 'prop') {
                const [_tag, instance, propName] = ref as ClassPropertyAccessExpression;
                const instanceEnv: Environment = this.eval(instance, env);
                return instanceEnv.define(
                    propName,
                    this.eval(value, env)
                );
            }

            // Simple assignment
            return env.assign(ref as VariableIdentifier, this.eval(value, env));
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

        // Lambda function: (lambda (x) (* x x))
        if (exp[0] === 'lambda') {
            const [_tag, params, body] = (exp as LambdaExpression);
            return {
                params,
                body,
                env, // Closure
            }
        }

        // Class declaration: (class <ClassName> <Parent> <Body>)
        if (exp[0] === 'class') {
            const [_tag, name, parent, body] = exp as ClassExpression;

            // A class is an enviroment! -- a storage of methods and shared properties.
            const parentEnv: Environment = this.eval(parent, env) || env;
            const classEnv = new Environment({}, parentEnv);

            // Body is evaluated in the class enviroment.
            this._evalBody(body, classEnv);

            // Class is accesible by name.
            return env.define(name, classEnv);
        }

        // Super expression: (super <ClassNeame>)
        if (exp[0] === 'super') {
            const [_tag, className] = exp as ClassSuperExpression;
            return (this.eval(className, env) as Environment).parent;
        }

        // Class instantiation: (new <ClassName> <Arguments>...)
        if (exp[0] === 'new') {
            const [_tag, className] = (exp as ClassInstantiationExpression);
            const classEnv: Environment = this.eval(className, env);

            // An instance of a class is an environment
            // The `parent` component of the instance environment
            // is set to its class environment.
            const instanceEnv = new Environment({}, classEnv);
            const args = (exp as ClassInstantiationExpression).slice(2).map(arg => this.eval(arg, env));
            this._callUserDefinedFunction(
                classEnv.lookup('constructor'),
                [instanceEnv, ...args]
            );
            return instanceEnv;
        }

        // Property access: (prop <instance> <name>)
        if(exp[0] === 'prop') {
            const [_tag, instance, name] = exp as ClassPropertyAccessExpression;
            const instanceEnv: Environment = this.eval(instance, env);
            return instanceEnv.lookup(name);
        }

        // Module declaration: (module <body>)
        if (exp[0] === 'module') {
            const [_tag, name, body] = exp as ModuleExpression;
            const moduleEnv = new Environment({}, env);
            // populate the moduleEnv
            this._evalBody(body, moduleEnv);
            // define the env
            return env.define(name, moduleEnv);
        }

        // Exports expression: (exports export1, export2, ...)
        if (exp[0] === 'exports') {
            const [_tag, ...exports] = exp as ExportsExpression;
            return exports.forEach(e => {
                env.parent.define(e, env.lookup(e));
            });
        }

        // Import expression: (import <name>)
        // (import (export1, export2) <name>)
        if (exp[0] === 'import') {
            let name;
            let namedImports;
            if (Array.isArray(exp[1])) {
                namedImports = exp[1];
                name = exp[2];
            } else {
                name = exp[1];
            }
            
            // Read the module from the cache if possible
            const moduleSrc = this.#moduleCache[name] = this.#moduleCache[name] || fs.readFileSync(`${__dirname}/../modules/${name}.eva`, 'utf-8');            
            let body: BlockExpression = evaParser.parse(`(begin ${moduleSrc})`);

            if (namedImports) {
                const namedImportsBody = <BlockExpression>body.filter(exp => {
                    if (Array.isArray(exp)) {
                        // ignore the exports when we have named import
                        if (exp[0] !== 'exports') {
                            return namedImports.includes(exp[1])
                        }
                        return false;
                    }
                    return true;
                });                
                
                return this._evalBlock(namedImportsBody, this.#global);
            }

            const moduleExp: ModuleExpression = ['module', name, body];
            return this.eval(moduleExp, this.#global);
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

            return this._callUserDefinedFunction(fn, args);
        }

        throw `Unimplemented: ${JSON.stringify(exp)}`
    }

    private _callUserDefinedFunction(fn, args) {
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

    private _evalBody(body: Expression, env: Environment) {
        // if it is a block
        if (body[0] === 'begin') {
            return this._evalBlock((body as BlockExpression), env);
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