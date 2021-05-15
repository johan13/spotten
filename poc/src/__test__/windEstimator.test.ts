import * as assert from "assert";
import { deg2rad } from "../conversions";
import { WindEstimator } from "../windEstimator";
import { assertApprox } from "./utils";

const winds = [
    { altitude: 0, speed: 5, direction: deg2rad(350) },
    { altitude: 600, speed: 10, direction: deg2rad(10) },
    { altitude: 3000, speed: 25, direction: deg2rad(20) },
];

describe("WindEstimator", () => {
    it("Should handle exact matches", () => {
        const sut = new WindEstimator(winds);
        assert.deepStrictEqual(sut.at(0), winds[0]);
        assert.deepStrictEqual(sut.at(600), winds[1]);
        assert.deepStrictEqual(sut.at(3000), winds[2]);
    });

    it("Should handle out-of-range requests", () => {
        const sut = new WindEstimator(winds);
        assert.deepStrictEqual(sut.at(-10), winds[0]);
        assert.deepStrictEqual(sut.at(4000), winds[2]);
    });

    it("Should interpolate correctly", () => {
        const sut = new WindEstimator(winds);
        const wind = sut.at(1000);
        assert.strictEqual(wind.altitude, 1000);
        assertApprox(wind.speed, 12.5);
        assertApprox(wind.direction, deg2rad(11.667));
    });

    it("Should interpolate correctly across 0 degrees", () => {
        const sut = new WindEstimator(winds);

        const wind1 = sut.at(200);
        assertApprox(wind1.speed, 6.6667);
        assertApprox(wind1.direction, deg2rad(356.667));

        const wind2 = sut.at(400);
        assertApprox(wind2.speed, 8.3333);
        assertApprox(wind2.direction, deg2rad(3.333));
    });
});
