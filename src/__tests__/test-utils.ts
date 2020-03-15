import assert from 'assert';
import evaParser from '../parser/evaParser';

export function test (eva, code, expected) {
    const exp = evaParser.parse(code);
    assert.strictEqual(eva.eval(exp), expected);
}