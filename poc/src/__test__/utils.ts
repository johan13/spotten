import * as assert from "assert";

export function assertApprox(actual: number, expected: number, errorMargin = 0.0001) {
    const error = Math.abs(actual - expected);
    if (error > errorMargin) {
        assert.fail(`Expected values to be within ${errorMargin}:\n\n${actual} != ${expected}\n`);
    }
}
