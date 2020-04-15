import {Eva} from '../Eva';
import {test} from './test-utils';

module.exports = (eva:Eva) => {
    test(
        eva,
        `
        (module Math
            (begin
                (def abs (value)
                    (if (< value 0)
                        (- value)
                        value
                    )
                )
                (def square (x)
                    (* x x)
                )
                (var MAX_VALUE 1000)
            )
        )
        
        ((prop Math abs) (- 10))
        `,
        10
    ),
    test (
        eva,
        `
            (var abs (prop Math abs))
            (abs (- 10))
        `,
        10
    ),
    test (
        eva,
        `
            (prop Math MAX_VALUE)
        `,
        1000
    )
}