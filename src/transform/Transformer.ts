import type {
    VariableDeclarationExpression,
    FunctionExpression,
    SwithcExpression,
    IfExpression
} from '../Eva';

/**
 * AST Transformer
 */
export class Transformer {

    /**
     * Translate `def`-expression (function declaration)
     * into a variable declaration with a lambda
     * expression.
     */
    transformDefToVarLambda(defExp: FunctionExpression): VariableDeclarationExpression {
        const [_tag, name, params, body] = defExp;
        return ['var', name, ['lambda', params, body]];
    }

    transfromSwitchToIf(switchExp: SwithcExpression): IfExpression {
        const [_tag, ...cases] = switchExp;   
        const ifExp: IfExpression = ['if', null, null, null];
        let current = ifExp; 
        for (let i = 0; i < cases.length -1; i++) {
            const [currentCond, currentBlock] = cases[i];
            
            current[1] = currentCond;
            current[2] = currentBlock;

            const next = cases[i + 1];
            const [nextCond, nextBlock] = next;
            current[3] = nextCond === 'else' ? nextBlock : ['if'];
            //@ts-ignore
            current = current[3];
        }
        return ifExp;
    }

}