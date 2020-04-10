import {Eva} from '../Eva';
import {test} from './test-utils';

module.exports = (eva:Eva) => {
    test(eva,
    `
        (begin
            (var x 10)
            (switch ((= x 10) 100)
                    ((> x 10) 200)
                    (else 300)
            )
        )
    `,
    100);
}