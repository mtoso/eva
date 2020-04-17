import {Eva} from '../Eva';
import {test} from './test-utils';

module.exports = (eva:Eva) => {
    test(
        eva,
        `
            (import Math)
            
            ((prop Math abs) (- 10))
        `,
        10
    ),
    test (
        eva,
        `
            (import (abs) Math)
            (abs (- 10))
        `,
        10
    ),
    test (
        eva,
        `
            (import (square) Math)
            (square 2)
        `,
        4
    )
}