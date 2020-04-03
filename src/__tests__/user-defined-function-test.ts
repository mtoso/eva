import {Eva} from '../Eva';
import {test} from './test-utils';

module.exports = (eva:Eva) => {
    test(
        eva,
        `
            (begin
                (def square (x)
                    (* x x)
                )
                (square 2)
            )
        `,
        4
    );

    // Complex body:
    test(
        eva,
        `
            (begin
                (def calc (x y)
                    (begin
                        (var z 30)
                        (+ (* x y) z)
                    )
                )
                (calc 10 20)
            )
        `,
        230
    );
    
    // Closure:
    test(
        eva,
        `
            (begin
                
                (var value 100)

                (def calc (x y)
                    (begin
                        (var z 30)
                        (def inner (foo)
                            (+ (+ foo z) value)
                        )
                        inner
                    )
                )
                
                (var fn (calc 10 20))

                (fn 30)
            )
        `,
        160
    );

    // Recursive function:
    test(eva,
        `
            (begin
                (def factorial (x)
                    (if (= x 1)
                        1
                        (* x (factorial (- x 1)))
                    )
                )
                (factorial 1)
            )
        `,
        undefined
    );
};