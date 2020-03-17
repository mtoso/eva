import {Eva} from '../Eva';
import {test} from './test-utils';

module.exports = (eva:Eva) => {
    // Math functions:
    test(eva, `(+ 1 5)`, 6);
    test(eva, `(+ (+ 3 2) (+ 3 2))`, 10);
    test(eva, `(- (- 5 2) 2)`, 1);
    test(eva, `(* (+ 3 2) (+ 3 2))`, 25);
    test(eva, `(/ (+ 2 2) (+ 1 1))`, 2);

    // // Comparison:
    test(eva, `(> 1 5)`, false);
    test(eva, `(< 1 5)`, true);
    test(eva, `(>= 5 5)`, true);
    test(eva, `(<= 5 5)`, true);
    test(eva, `(= 5 5)`, true);
}