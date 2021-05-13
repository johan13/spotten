import { deg2rad, ft2m, kt2ms, m2nm, rad2deg } from "./conversions";
import { Input, renderToFile } from "./pdfGenerator";
import { SpotCalculator } from "./spotCalculator";

main();
function main() {
    const winds = [
        { altitude: "FL100", meters: ft2m(10000), speed: 38, direction: 340 },
        { altitude: "2000 ft", meters: ft2m(2000), speed: 18, direction: 340 },
        { altitude: "Ground", meters: 0, speed: 7, direction: 320 },
    ];
    const { deplCircle, exitCircle, spot } = new SpotCalculator()
        .addWind(winds[0].meters, kt2ms(winds[0].speed), deg2rad(winds[0].direction))
        .addWind(winds[1].meters, kt2ms(winds[1].speed), deg2rad(winds[1].direction))
        .addWind(winds[2].meters, kt2ms(winds[2].speed), deg2rad(winds[2].direction))
        .setAllowedLandingDirections([40, 220].map(deg2rad))
        .calculate();

    const input: Input = {
        map: {
            path: "maps/vårgårda.png",
            metersPerPixel: 4,
            width: 1860,
            height: 1320,
            dz: { x: 930, y: 660 },
        },
        winds,
        exitCircle,
        deplCircle,
        spot: {
            heading: rad2deg(spot.track),
            longitudinalOffset: m2nm(spot.longitudinalOffset),
            transverseOffset: m2nm(spot.transverseOffset),
        },
        greenLight: { bearing: 123, distance: 4.5 }, // TODO
        redLight: { bearing: 234, distance: 5.6 }, // TODO
        time: new Date(),
    };
    renderToFile(input, "spot.pdf");
}
