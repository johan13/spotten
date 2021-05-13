import * as assert from "assert";
import { kt2ms } from "./conversions";

// Note:
//  * All values are in meters, m/s and radians.
//  * Origo is at the DZ and coordinates increase to the NE.
//  * Angles increase clockwise from 12 o'clock.
//  * Deployment altitude is the altitude where the canopy is fully deployed (not the SBF def).

export class SpotCalculator {
    private readonly config: Config;
    private readonly winds: Wind[] = [];
    private fixedTrack: number | undefined; // TODO: Not used yet
    private fixedTransverseOffset: number | undefined; // TODO: Not used yet
    private allowedLandingDirections: number[] | undefined;

    public constructor(config?: Partial<Config>) {
        this.config = { ...defaultConfig, ...config };
    }

    public addWind(altitude: number, speed: number, direction: number) {
        this.winds.push({ altitude, speed, direction });
        return this;
    }

    public setTrack(track: number) {
        this.fixedTrack = track;
        return this;
    }

    public setTransverseOffset(offset: number) {
        this.fixedTransverseOffset = offset;
        return this;
    }

    public setAllowedLandingDirections(directions: number[]) {
        this.allowedLandingDirections = [...directions];
        return this;
    }

    public calculate(): Output {
        if (this.winds.length < 1) {
            throw new Error("No wind information available");
        }
        this.winds.sort((a, b) => a.altitude - b.altitude); // Sort by ascending altitude.

        const deplCircle = this.calculateDeploymentCircle();
        const { driftX, driftY, throwDistance } = this.calculateFreeFall();
        const exitCircle = { ...deplCircle };
        exitCircle.x -= driftX;
        exitCircle.y -= driftY;
        const spot = this.calculateSpot(exitCircle);

        exitCircle.x -= throwDistance * Math.sin(spot.track);
        exitCircle.y -= throwDistance * Math.cos(spot.track);
        spot.longitudinalOffset -= throwDistance;

        // TODO: Compensate wind speed when not flying straight into the wind.
        spot.longitudinalOffset -=
            this.config.climbOutTime *
            (this.config.jumpRunTAS - this.getWind(this.config.exitAltitude).speed);

        const round = (x: number) => 185.2 * Math.round(x / 185.2);
        spot.longitudinalOffset = round(spot.longitudinalOffset);
        spot.transverseOffset = round(spot.transverseOffset);

        return { deplCircle, exitCircle, spot };
    }

    private calculateDeploymentCircle() {
        const landingDirection = this.getLandingDirection();
        const timeStep = 1;
        let altitude = 0;
        let x = 0;
        let y = 0;
        let radius = 0;
        while (altitude < this.config.deplAltitude) {
            const wind = this.getWind(altitude);
            x += Math.sin(wind.direction) * wind.speed * timeStep;
            y += Math.cos(wind.direction) * wind.speed * timeStep;
            if (altitude < this.config.finalAltitude) {
                x -= this.config.horizontalCanopySpeed * Math.sin(landingDirection) * timeStep;
                y -= this.config.horizontalCanopySpeed * Math.cos(landingDirection) * timeStep;
            } else {
                radius += this.config.horizontalCanopySpeed * timeStep;
            }
            altitude += this.config.verticalCanopySpeed * timeStep;
        }
        return { x, y, radius };
    }

    private getLandingDirection() {
        const windDirection = this.getWind(0).direction;
        if (!this.allowedLandingDirections) {
            return windDirection;
        }
        return this.allowedLandingDirections
            .map(ld => ({ ld, delta: Math.abs(angleDiff(windDirection, ld)) }))
            .sort((a, b) => a.delta - b.delta)[0].ld;
    }

    private calculateFreeFall() {
        const timeStep = 0.2;
        let throwDistance = 0;
        let altitude = this.config.exitAltitude;
        let horizontalVelocity = this.config.jumpRunTAS;
        let verticalVelocity = 0;
        let driftX = 0;
        let driftY = 0;
        while (altitude > this.config.deplAltitude) {
            const wind = this.getWind(altitude);
            driftX -= wind.speed * Math.sin(wind.direction) * timeStep;
            driftY -= wind.speed * Math.cos(wind.direction) * timeStep;

            const velocity = Math.sqrt(horizontalVelocity ** 2 + verticalVelocity ** 2);
            const dragAccel = getDragAcceleration(velocity, altitude);
            throwDistance += horizontalVelocity * timeStep;
            altitude -= verticalVelocity * timeStep;
            horizontalVelocity -= (horizontalVelocity / velocity) * dragAccel * timeStep;
            verticalVelocity += (9.81 - (verticalVelocity / velocity) * dragAccel) * timeStep;
        }
        return { driftX, driftY, throwDistance };
    }

    private calculateSpot(circle: Circle) {
        // TODO: A better algorithm that uses fixedTrack and fixedTransverseOffset.
        // For now do a jump run straight into the wind, down the center of the circle with
        // longitudinal offset so that we exit right where the aircraft enters the circle.
        const track = this.getWind(this.config.exitAltitude).direction;
        const transverseOffset = circle.x * Math.cos(track) - circle.y * Math.sin(track);
        const longitudinalOffset =
            circle.x * Math.sin(track) + circle.y * Math.cos(track) - circle.radius;
        return { track, longitudinalOffset, transverseOffset };
    }

    private getWind(altitude: number) {
        if (altitude <= this.winds[0].altitude || this.winds.length === 1) {
            return this.winds[0];
        } else if (altitude >= this.winds[this.winds.length - 1].altitude) {
            return this.winds[this.winds.length - 1];
        }
        for (let i = 0; i < this.winds.length - 1; i++) {
            const lower = this.winds[i];
            const upper = this.winds[i + 1];
            if (altitude >= lower.altitude && altitude <= upper.altitude) {
                return interpolateWind(lower, upper, altitude);
            }
        }
        assert.fail("Unreachable code");
    }
}

function getDragAcceleration(velocity: number, altitude: number) {
    // From https://en.wikipedia.org/wiki/Drag_equation (and Newton's second law):
    // a_drag = F_drag / m = 1/2 * rho * v² * C_d * A / m
    // We combine everything except the air density (rho) and velocity (v) into a single
    // coefficient. 0.003 m²/kg was chosen to give a terminal velocity of 199 km/h at 1200 m
    // AMSL. (The same altitude used in L&B's SAS calculations.) The DZ is assumed to be at sea
    // level.The air density equation is from
    // https://en.wikipedia.org/wiki/Barometric_formula#Density_equations
    const airDensity =
        1.225 *
        (288.15 / (288.15 - 0.0065 * altitude)) ** (1 - (9.81 * 0.0289644) / 8.3144598 / 0.0065);
    return 0.003 * airDensity * velocity ** 2;
}

function interpolateWind(lower: Wind, upper: Wind, altitude: number) {
    // Algorithms:
    //  * Polar: Linearly interpolate speed and direction independently.
    //  * Cartesian: Linearly interpolate the X and Y composants independently.
    // Polar interpolation probably makes more sense in most cases. If the directions are close to
    // 180° from eachother then maybe cartesian mode or a hybrid of the two is a better choice?
    // For now, do polar mode.
    const alpha = (altitude - lower.altitude) / (upper.altitude - lower.altitude);
    return {
        altitude,
        direction: lower.direction * (1 - alpha) + upper.direction * alpha,
        speed: lower.speed * (1 - alpha) + upper.speed * alpha,
    };
}

// Returns a - b, but always -π < (a-b) <= π.
function angleDiff(a: number, b: number) {
    let delta = a - b;
    while (delta <= -Math.PI) delta += 2 * Math.PI;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    return delta;
}

const defaultConfig: Config = {
    exitAltitude: 4000,
    deplAltitude: 800,
    finalAltitude: 100,
    jumpRunTAS: kt2ms(85),
    climbOutTime: 10,
    horizontalCanopySpeed: 10,
    verticalCanopySpeed: 5,
};

type Config = {
    exitAltitude: number;
    deplAltitude: number;
    finalAltitude: number;
    jumpRunTAS: number;
    climbOutTime: number;
    horizontalCanopySpeed: number;
    verticalCanopySpeed: number;
};

type Wind = {
    altitude: number;
    speed: number;
    direction: number;
};

type Circle = {
    x: number;
    y: number;
    radius: number;
};

type Spot = {
    track: number;
    longitudinalOffset: number;
    transverseOffset: number;
};

type Output = {
    deplCircle: Circle;
    exitCircle: Circle;
    spot: Spot;
};
