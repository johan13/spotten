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
    const { track, longitudinalOffset, transverseOffset, deplCircle, exitCircle } =
        new SpotCalculator({ winds, allowedLandingDirections: [40, 220].map(deg2rad) }).calculate();

    const input: Input = {
        map: {
            path: "maps/vårgårda.png",
            metersPerPixel: 4,
            width: 1860,
            height: 1320,
            dz: { x: 930, y: 660 },
        },
        winds: winds.map(w => ({
            altitude: w.name,
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
        redLight: { bearing: 123, distance: 4.5 }, // TODO
        time: new Date(),
    };
    renderToFile(input, "spot.pdf");
}
