import { deg2rad, kt2ms, nm2m, normalizeAngleDiff } from "./utils";
import { Wind, WindEstimator } from "./windEstimator";

// Note:
//  * Units: All values are in meters, seconds, m/s and radians.
//  * The origin is at the DZ and coordinates increase to the northeast.
//  * Angles increase clockwise from 12 o'clock.
//  * Wind angles are opposite to other angles and refer to where the wind is *coming from*.
//  * Deployment altitude is the altitude where the canopy is fully deployed, not the SBF def.

export class SpotCalculator {
    private readonly wind: WindEstimator;
    private readonly config: Config;
    private readonly fixedTrack: number | undefined;
    private readonly fixedTransverseOffset: number | undefined;
    private readonly allowedLandingDirections: number[] | undefined;

    public constructor(input: Input) {
        this.wind = new WindEstimator(input.winds);
        this.fixedTrack = input.fixedTrack;
        this.fixedTransverseOffset = input.fixedTransverseOffset;
        this.allowedLandingDirections = input.allowedLandingDirections;
        this.config = { ...defaultConfig, ...input.config };
    }

    public calculate(): Output {
        const deplCircle = this.calculateDeploymentCircle();
        const { driftX, driftY, throwDistance } = this.calculateFreeFall();
        const exitCircle = { ...deplCircle };
        exitCircle.x -= driftX;
        exitCircle.y -= driftY;
        const spot = this.calculateSpot(exitCircle);

        exitCircle.x -= throwDistance * Math.sin(spot.track);
        exitCircle.y -= throwDistance * Math.cos(spot.track);
        spot.longitudinalOffset -= throwDistance;

        spot.longitudinalOffset -=
            this.config.climbOutTime *
            getSpeedOverGround(
                spot.track,
                this.config.jumpRunTAS,
                this.wind.at(this.config.exitAltitude),
            ).speed;

        spot.longitudinalOffset = nm2m(0.1) * Math.round(spot.longitudinalOffset / nm2m(0.1));

        return { ...spot, deplCircle, exitCircle };
    }

    private calculateDeploymentCircle() {
        const landingDirection = this.getLandingDirection();
        const timeStep = 1;
        let altitude = 0;
        let x = 0;
        let y = 0;
        let radius = 0;
        while (altitude < this.config.deplAltitude) {
            const wind = this.wind.at(altitude);
            if (altitude < this.config.finalAltitude) {
                const { speed, direction } = getSpeedOverGround(
                    landingDirection,
                    this.config.horizontalCanopySpeed,
                    wind,
                );
                x -= speed * Math.sin(direction) * timeStep;
                y -= speed * Math.cos(direction) * timeStep;
            } else {
                x += wind.speed * Math.sin(wind.direction) * timeStep;
                y += wind.speed * Math.cos(wind.direction) * timeStep;
                radius += this.config.horizontalCanopySpeed * timeStep;
            }
            altitude += this.config.verticalCanopySpeed * timeStep;
        }
        return { x, y, radius };
    }

    private getLandingDirection() {
        const windDirection = this.wind.at(0).direction;
        if (!this.allowedLandingDirections) {
            return windDirection;
        }
        return this.allowedLandingDirections
            .map(ld => ({ ld, delta: Math.abs(normalizeAngleDiff(windDirection - ld)) }))
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
            const wind = this.wind.at(altitude);
            driftX -= wind.speed * Math.sin(wind.direction) * timeStep;
            driftY -= wind.speed * Math.cos(wind.direction) * timeStep;

            const velocity = Math.sqrt(horizontalVelocity ** 2 + verticalVelocity ** 2);
            const dragAccel = getDragAcceleration(velocity, altitude);
            throwDistance += horizontalVelocity * timeStep;
            altitude -= verticalVelocity * timeStep;
            if (velocity > 0) {
                horizontalVelocity -= (horizontalVelocity / velocity) * dragAccel * timeStep;
                verticalVelocity -= (verticalVelocity / velocity) * dragAccel * timeStep;
            }
            verticalVelocity += 9.81 * timeStep;
        }
        return { driftX, driftY, throwDistance };
    }

    private calculateSpot(circle: Circle) {
        let track = this.fixedTrack;
        let transverseOffset = this.fixedTransverseOffset;
        if (transverseOffset === undefined) {
            const windDirection = this.wind.at(this.config.exitAltitude).direction;
            track ??= deg2rad(5) * Math.round(windDirection / deg2rad(5));

            // Find the transverseOffset that puts the track straight through the circle's center.
            transverseOffset = circle.x * Math.cos(track) - circle.y * Math.sin(track);
            transverseOffset = nm2m(0.1) * Math.round(transverseOffset / nm2m(0.1));
        } else if (track === undefined) {
            // Find the direction that puts the track straight through the circle's center.
            track =
                Math.atan2(circle.x, circle.y) -
                Math.asin(transverseOffset / Math.sqrt(circle.x ** 2 + circle.y ** 2));
            track = deg2rad(5) * Math.round(track / deg2rad(5));
        }

        // Find the longitudinalOffset that puts the exit point right at the edge of the circle.
        const dx = circle.x - transverseOffset * Math.cos(track);
        const dy = circle.y + transverseOffset * Math.sin(track);
        const k = dx * Math.sin(track) + dy * Math.cos(track);
        const longitudinalOffset = k - Math.sqrt(k ** 2 - dx ** 2 - dy ** 2 + circle.radius ** 2);
        if (isNaN(longitudinalOffset)) {
            throw new Error("The jump run does not intersect the exit circle");
        }

        return { track, longitudinalOffset, transverseOffset };
    }
}

function getSpeedOverGround(track: number, tas: number, wind: Wind) {
    // The aircraft/canopy is crabbing along the track. We split the wind into two composants: along
    // the track and perpendicular to it. The perpendicular wind is compensated by crabbing but
    // we get a reduced speed along the track. The parallel composant must be subtracted.
    const speedAlongTrack = Math.sqrt(
        tas ** 2 - (wind.speed * Math.sin(wind.direction - track)) ** 2,
    );
    if (isNaN(speedAlongTrack)) {
        // Too high wind to fly the track - fly (backwards) into the wind instead.
        return { speed: tas - wind.speed, direction: wind.direction };
    } else {
        const headWind = wind.speed * Math.cos(wind.direction - track);
        return { speed: speedAlongTrack - headWind, direction: track };
    }
}

function getDragAcceleration(velocity: number, altitude: number) {
    // The drag equation (https://en.wikipedia.org/wiki/Drag_equation) and Newton's second law give:
    //  a_drag = F_drag / m = 1/2 * rho * v² * C_d * A / m
    // We combine everything except the air density (rho) and velocity (v) into a single
    // coefficient. 0.003 m²/kg was chosen to give a terminal velocity of 199 km/h at 1200 m
    // AMSL. (The same altitude used in L&B's SAS calculations.) The DZ is assumed to be at sea
    // level. The air density equation is from
    // https://en.wikipedia.org/wiki/Barometric_formula#Density_equations
    const airDensity =
        1.225 *
        (288.15 / (288.15 - 0.0065 * altitude)) ** (1 - (9.81 * 0.0289644) / 8.3144598 / 0.0065);
    return 0.003 * airDensity * velocity ** 2;
}

const defaultConfig: Config = {
    exitAltitude: 4000,
    deplAltitude: 700,
    finalAltitude: 100,
    jumpRunTAS: kt2ms(90),
    climbOutTime: 10,
    horizontalCanopySpeed: 10,
    verticalCanopySpeed: 5,
};

type Input = {
    winds: Wind[];
    fixedTrack?: number | undefined;
    fixedTransverseOffset?: number;
    allowedLandingDirections?: number[];
    config?: Partial<Config>;
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

type Output = {
    track: number;
    longitudinalOffset: number;
    transverseOffset: number;
    deplCircle: Circle;
    exitCircle: Circle;
};

type Circle = {
    x: number;
    y: number;
    radius: number;
};
