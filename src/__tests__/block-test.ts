import assert from 'assert';
import {Eva} from '../Eva';
import {test} from './test-utils';

module.exports = (eva:Eva) => {
    assert.strictEqual(eva.eval(
        ['begin',
            ['var', 'x', 10],
            ['var', 'y', 20],
            ['+', ['*', 'x', 'y'], 30],
        ]),
    230);

    // nested blocks
    assert.strictEqual(eva.eval(
        ['begin',
            ['var', 'x', 10],
            ['begin',
                ['var', 'x', 20],
                'x'
            ],
            'x'
        ]),
    10);

    // access to the outer block var
    assert.strictEqual(eva.eval(
        ['begin',
            ['var', 'value', 10],
            ['var', 'result', ['begin',
                ['var', 'x', ['+', 'value', 10]],
                'x'
            ]],
            'result'
        ]),
    20);

    // Update parent variables.
    assert.strictEqual(eva.eval(
        ['begin',
            ['var', 'data', 10],
            ['begin',
                ['set', 'data', 100],
            ],
            'data'
        ]),
    100);

    test(eva,
    `
        (begin
            (var x 10)
            (var y 20)
            (+ (* x 10)y)
        )
    `, 
    120);
}