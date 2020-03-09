import assert from 'assert';
import {Eva} from '../Eva';

module.exports = (eva:Eva) => {
    assert.strictEqual(eva.eval(['+', 1, 5]), 6);
    assert.strictEqual(eva.eval(['+', ['+', 3, 2], ['+', 3, 2]]), 10);
    assert.strictEqual(eva.eval(['-', ['-', 5, 2], 2]), 1);
    assert.strictEqual(eva.eval(['*', ['+', 3, 2], ['+', 3, 2]]), 25);
    assert.strictEqual(eva.eval(['/', ['+', 2, 2], ['+', 1, 1]]), 2);
}