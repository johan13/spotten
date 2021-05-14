export class WindEstimator {
    private readonly winds: Wind[];

    public constructor(winds: Wind[]) {
        if (winds.length < 1) {
            throw new Error("At least one wind is required");
        }
        this.winds = [...winds].sort((a, b) => a.altitude - b.altitude);
    }

    public at(altitude: number) {
        if (altitude <= this.winds[0].altitude) {
            return this.winds[0];
        }
        for (let i = 1; i < this.winds.length; i++) {
            if (altitude < this.winds[i].altitude) {
                return this.interpolate(this.winds[i - 1], this.winds[i], altitude);
            }
        }
        return this.winds[this.winds.length - 1];
    }

    private interpolate(lower: Wind, upper: Wind, altitude: number) {
        // Algorithms:
        //  * Polar: Linearly interpolate speed and direction independently.
        //  * Cartesian: Linearly interpolate the X and Y composants independently.
        // Polar interpolation probably makes more sense in most cases. If the directions are close
        // to 180° from eachother then maybe cartesian mode or a hybrid of the two is better?
        // For now, do polar interpolation.
        const alpha = (altitude - lower.altitude) / (upper.altitude - lower.altitude);
        const speed = (1 - alpha) * lower.speed + alpha * upper.speed;
        let angleDiff = upper.direction - lower.direction;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        const direction = lower.direction + alpha * angleDiff;
        return { altitude, direction, speed };
    }
}

export type Wind = {
    altitude: number;
    speed: number;
    direction: number;
};
