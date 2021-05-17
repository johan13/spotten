import * as assert from "assert";
import { SpotCalculator } from "../spotCalculator";
import { kt2ms } from "../utils";
import { assertApprox } from "./utils";

describe("SpotCalculator", () => {
    it("In absence of wind and hoirzontal movement, the spot should be all zeros", () => {
        const spot = new SpotCalculator({
            winds: [{ altitude: 0, speed: 0, direction: 0 }],
            config: { jumpRunTAS: 0, horizontalCanopySpeed: 0 },
        }).calculate();
        assert.deepStrictEqual(spot, {
            track: 0,
            longitudinalOffset: 0,
            transverseOffset: 0,
            deplCircle: { x: 0, y: 0, radius: 0 },
            exitCircle: { x: 0, y: 0, radius: 0 },
            redLight: { bearing: Math.PI, distance: 0 },
            timeBetweenGroups: Infinity,
            jumpRunDuration: 0,
        });
    });

    it("At 90 knots the forward throw should be 370 meters", () => {
        const { deplCircle, exitCircle } = new SpotCalculator({
            winds: [{ altitude: 0, speed: 0, direction: 0 }],
            config: { jumpRunTAS: kt2ms(90) },
        }).calculate();
        const throwDistance = deplCircle.y - exitCircle.y;
        assertApprox(throwDistance, 370, 1);
    });

    it("The circles' radii should be the canopy flight distance from depl. to final", () => {
        const { deplCircle, exitCircle } = new SpotCalculator({
            winds: [
                { altitude: 0, speed: 5, direction: 0.5 },
                { altitude: 2000, speed: 8, direction: 0.8 },
                { altitude: 10000, speed: 12, direction: 1.0 },
            ],
            config: {
                verticalCanopySpeed: 5,
                horizontalCanopySpeed: 10,
                deplAltitude: 700,
                finalAltitude: 100,
            },
        }).calculate();
        const flightDistance = ((700 - 100) / 5) * 10;
        assertApprox(deplCircle.radius, flightDistance);
        assertApprox(exitCircle.radius, flightDistance);
    });

    it("At storm wind speed, the freefall drift should be 1494.5 m", () => {
        const { deplCircle, exitCircle } = new SpotCalculator({
            winds: [
                { altitude: 0, speed: 24.5, direction: (3 * Math.PI) / 2 },
                { altitude: 2000, speed: 24.5, direction: (3 * Math.PI) / 2 },
                { altitude: 10000, speed: 24.5, direction: (3 * Math.PI) / 2 },
            ],
            config: {
                jumpRunTAS: 0,
                exitAltitude: 4000,
                deplAltitude: 700,
            },
        }).calculate();
        const drift = deplCircle.x - exitCircle.x;
        assertApprox(drift, 1494.5, 1);
    });
});
