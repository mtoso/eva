import assert from 'assert';
import {Eva} from '../Eva';

module.exports = (eva:Eva) => {
    assert.strictEqual(eva.eval(
    ['begin',
        
        ['var', 'counter', 0],
        ['var', 'result', 0],

        ['while', ['<', 'counter', 10],
            // result++
            ['begin',
                ['set', 'result', ['+', 'result', 1]],
                ['set', 'counter', ['+', 'counter', 1]],
            ],
        ],
        'result'
    ]),
    10);
};