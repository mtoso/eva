import assert from 'assert';
import evaParser from '../parser/evaParser';
import {Eva} from '../Eva';

export function test (eva: Eva, code: string, expected: any) {
    const exp = evaParser.parse(`(begin ${code})`);
    if (typeof expected !== 'undefined') {
        assert.strictEqual(eva.evalGlobal(exp), expected);
    } else {
        // we only eval
        eva.evalGlobal(exp);
    }
}