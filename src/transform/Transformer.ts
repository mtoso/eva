/**
 * AST Transformer
 */

export class Transformer {

    /**
     * Translate `def`-expression (function declaration)
     * into a variable declaration with a lambda
     * expression.
     */
    transformDefToVarLambda(defExp) {
        const [_tag, name, params, body] = defExp;
        
    }

}