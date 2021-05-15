import * as assert from "assert";
import { deg2rad } from "../conversions";
import { WindEstimator } from "../windEstimator";

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
        assert.ok(Math.abs(wind.speed - 12.5) < 0.0005, `${wind.speed} != 12.5`);
        assert.ok(Math.abs(wind.direction - 0.204) < 0.0005, `${wind.direction} != 0.204`);
    });

    it("Should interpolate correctly across 0 degrees", () => {
        const sut = new WindEstimator(winds);
        const wind1 = sut.at(200);
        const wind2 = sut.at(400);

        assert.strictEqual(wind1.altitude, 200);
        assert.ok(Math.abs(wind1.speed - 6.667) < 0.0005, `${wind1.speed} != 6.667`);
        assert.ok(Math.abs(wind1.direction - 6.225) < 0.0005, `${wind1.direction} != 6.225`);

        assert.strictEqual(wind2.altitude, 400);
        assert.ok(Math.abs(wind2.speed - 8.333) < 0.0005, `${wind2.speed} != 8.333`);
        assert.ok(Math.abs(wind2.direction - 0.058) < 0.0005, `${wind2.direction} != 0.058`);
    });
});
