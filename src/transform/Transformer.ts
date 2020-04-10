import type {
    VariableDeclarationExpression,
    FunctionExpression,
    SwitchExpression,
    IfExpression,
    ForExpression,
    WhileExpression,
    Expression,
    BlockExpression,
    UpdateExpression,
    VariableAssignmentExpression
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

    transfromSwitchToIf(switchExp: SwitchExpression): IfExpression {
        const [_tag, ...cases] = switchExp;   
        const ifExp: IfExpression = ['if', null, null, null];
        let current: Expression = ifExp; 
        for (let i = 0; i < cases.length -1; i++) {
            const [currentCond, currentBlock] = cases[i];
            
            current[1] = currentCond;
            current[2] = currentBlock;

            const next = cases[i + 1];
            const [nextCond, nextBlock] = next;
            current[3] = nextCond === 'else' ? nextBlock : (['if', null, null, null] as Expression);

            current = current[3];
        }
        return ifExp;
    }

    transformForToWhile(forExp:ForExpression): BlockExpression {
        const [_tag, init, condition, modifier, expression] = forExp;
        const whileExp: WhileExpression = ['while', condition, ['begin', expression, modifier]];
        const blockExp: BlockExpression = ['begin', init, whileExp];
        return blockExp;
    }

    transfromUpdateToSet(updateExp: UpdateExpression): VariableAssignmentExpression {
        const [operator, identifier, value] = updateExp;
        const varUpdateExp: VariableAssignmentExpression = ['set', null, null];
        switch (operator) {
            case '++': {
                varUpdateExp[1] = identifier;
                varUpdateExp[2] = ['+', identifier, 1];
                return varUpdateExp;
            }
            case '--': {
                varUpdateExp[1] = identifier;
                varUpdateExp[2] = ['-', identifier, 1];
                return varUpdateExp;
            }
            case '+=': {
                varUpdateExp[1] = identifier;
                varUpdateExp[2] = ['+', identifier, value];
                return varUpdateExp;
            }
            case '-=': {
                varUpdateExp[1] = identifier;
                varUpdateExp[2] = ['-', identifier, value];
                return varUpdateExp;
            }
            default:
                throw new Error(`Update operator ${operator} not supported`);
        }
    }
}