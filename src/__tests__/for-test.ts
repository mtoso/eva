import {Eva} from '../Eva';
import {test} from './test-utils';

module.exports = (eva:Eva) => {
    test(eva,
    `
        (begin
            (print "Test for-loop")
            (for
                (var x 0)
                (< x 10)
                (++ x)
                (print x)
            )
        )

    `,
    undefined);

    test(eva,
    `   
        (begin
            (print "Test inverse for-loop")
            (for
                (var x 10)
                (> x 0)
                (-- x)
                (print x)
            )
        )
    `,
    undefined);

    test(eva,
    `
        (begin
            (print "Test -= in for-loop")
            (for
                (var x 10)
                (> x 0)
                (-= x 2)
                (print x)
            )
        )
    `,
    undefined);
    
    test(eva,
    `
        (begin 
            (print "Test += in for-loop")
            (for
                (var x 0)
                (< x 10)
                (+= x 2)
                (print x)
            )
        )
    `,
    undefined);
}