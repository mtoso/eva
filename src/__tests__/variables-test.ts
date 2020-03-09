import assert from 'assert';
import {Eva} from '../Eva';

module.exports = (eva:Eva) => {
    assert.strictEqual(eva.eval(['var', 'x', 10]), 10);
    assert.strictEqual(eva.eval('x'), 10);
    assert.strictEqual(eva.eval(['var', 'isUser', 'true']), true);
    assert.strictEqual(eva.eval('isUser'), true);
}