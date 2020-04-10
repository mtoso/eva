import {Eva} from '../Eva';

const tests = [
    require('./self-eval-test'),
    require('./variables-test'),
    require('./math-test'),
    require('./block-test'),
    require('./if-test'),
    require('./while-test'),
    require('./built-in-function-test'),
    require('./user-defined-function-test'),
    require('./lambda-function-test'),
    require('./switch-test'),
];

const eva =  new Eva();

tests.forEach(test => test(eva));

console.log('\nAll assertions passed!\n');