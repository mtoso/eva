import {Eva} from '../Eva';
import {Environment} from '../Environment';

const tests = [
    require('./self-eval-test'),
    require('./variables-test'),
    require('./math-test'),
    require('./block-test'),
    require('./if-test'),
    require('./while-test'),
    require('./built-in-function-test'),
    require('./user-defined-function-test'),
];

const eva =  new Eva();

tests.forEach(test => test(eva));

eva.eval(['print', '"Hello"', '"World!"'])

console.log('All assertions passed!');