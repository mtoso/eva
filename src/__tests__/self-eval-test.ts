import assert from 'assert';
import {Eva} from '../Eva';

module.exports = (eva:Eva) => {
    assert.strictEqual(eva.eval(1), 1);
    assert.strictEqual(eva.eval('"hello"'), 'hello');
}