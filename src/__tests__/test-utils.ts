import assert from 'assert';
import evaParser from '../parser/evaParser';

export function test (eva, code, expected) {
    const exp = evaParser.parse(code);
    if ( typeof expected !== 'undefined') {
        assert.strictEqual(eva.eval(exp), expected);
    } else {
        // we only eval
        eva.eval(exp);
    }
}