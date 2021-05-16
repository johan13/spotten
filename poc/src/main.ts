import { Input, renderToFile } from "./pdfGenerator";
import { SpotCalculator } from "./spotCalculator";
import { deg2rad, ft2m, kt2ms, m2nm, ms2kt, rad2deg } from "./utils";

main();
function main() {
    const winds = [
        { name: "FL100", altitude: ft2m(10000), speed: kt2ms(38), direction: deg2rad(340) },
        { name: "2000 ft", altitude: ft2m(2000), speed: kt2ms(18), direction: deg2rad(340) },
        { name: "Ground", altitude: 0, speed: kt2ms(7), direction: deg2rad(320) },
    ];
    const {
        track,
        longitudinalOffset,
        transverseOffset,
        deplCircle,
        exitCircle,
        redLight,
        timeBetweenGroups,
        jumpRunDuration,
    } = new SpotCalculator({
        winds,
        allowedLandingDirections: [40, 220].map(deg2rad),
    }).calculate();

    const input: Input = {
        map: {
            path: "maps/vårgårda.png",
            metersPerPixel: 5,
            width: 1436,
            height: 1000,
            dz: { x: 718, y: 500 },
        },
        winds: winds.map(w => ({
            altitudeDescr: w.name,
            speed: ms2kt(w.speed),
            direction: rad2deg(w.direction),
        })),
        exitCircle,
        deplCircle,
        spot: {
            heading: rad2deg(track),
            longitudinalOffset: m2nm(longitudinalOffset),
            transverseOffset: m2nm(transverseOffset),
        },
        redLight: { bearing: rad2deg(redLight.bearing), distance: m2nm(redLight.distance) },
        timeBetweenGroups,
        jumpRunDuration,
        time: new Date(),
    };
    renderToFile(input, "spot.pdf");
}
