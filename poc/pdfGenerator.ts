import { createWriteStream } from "fs";
import PDFDocument from "pdfkit";
import { kt2ms, nm2m } from "./conversions";

export type Input = {
    map: {
        /** JPEG or PNG */
        path: string;
        metersPerPixel: number;
        /** Pixels */
        width: number;
        /** Pixels */
        height: number;
        /** Drop zone position in pixels relative to top left. */
        dz: { x: number; y: number };
    };
    winds: Array<{
        /** Descriptive string. E.g. "FL100" */
        altitude: string;
        /** Knots (TODO: Why knots?) */
        speed: number;
        /** Degrees where the wind is coming from. */
        direction: number;
    }>;
    exitCircle: Circle;
    deplCircle: Circle;
    spot: {
        heading: number; // Degrees
        longitudinalOffset: number; // Nautical miles, positive past DZ
        transverseOffset: number; // Nautical miles, positive when right off track
    };
    greenLight: BearingAndDistance; // Rendered in small font in the upper right corner
    redLight: BearingAndDistance; // Rendered in small font in the upper right corner
    time: Date;
};

type Circle = {
    /** Meters relative to DZ */
    x: number;
    /** Meters relative to DZ */
    y: number;
    /** Meters */
    radius: number;
};

type BearingAndDistance = {
    /** Degrees to aircraft from DZ */
    bearing: number;
    /** Nautical miles */
    distance: number;
};

export function renderToFile(input: Input, filePath: string) {
    new PdfGenerator(input, createWriteStream(filePath));
}

class PdfGenerator {
    private readonly mapScaleDenominator = 25000;
    private doc: typeof PDFDocument;
    private width: number;
    private height: number;
    private pilotInfoWidth = 0;
    private pilotInfoHeight = 0;
    private windInfoWidth = 0;
    private windInfoHeight = 0;
    private footerWidth = 0;
    private footerHeight = 0;

    public constructor(private readonly data: Input, stream: NodeJS.WritableStream) {
        const margin = 6;
        this.doc = new PDFDocument({
            size: "a4",
            layout: "landscape",
            margin: (margin / 25.4) * 72,
        });
        this.doc.pipe(stream);

        // Set mm as unit and add the margin.
        this.doc.scale(72 / 25.4).translate(margin, margin);
        this.width = 297 - 2 * margin;
        this.height = 210 - 2 * margin;

        this.renderPilotInfo();
        this.renderWinds();
        this.renderFooter();
        this.renderMap();

        this.doc.end();
    }

    private renderPilotInfo() {
        const {
            spot: { heading, transverseOffset, longitudinalOffset },
            greenLight: green,
            redLight: red,
        } = this.data;

        const after = 0.1 * Math.round(longitudinalOffset * 10);
        const right = 0.1 * Math.round(transverseOffset * 10);
        const offsetStr = (after > 0 ? "+" : "") + after.toFixed(1);
        const line1 = `Green light ${angleStr(heading)}  ${offsetStr} NM`;
        this.doc.fontSize(7).text(line1, 0, 0);
        this.pilotInfoWidth = this.doc.widthOfString(line1) + 0.5;
        if (right !== 0) {
            const side = right > 0 ? "Right" : "Left";
            const distance = Math.abs(right).toFixed(1);
            this.doc.text(`${side} off track  ${distance} NM`);
        }
        this.doc
            .fontSize(3)
            .font("Courier")
            .text(`Green light: ${angleStr(green.bearing)} / ${green.distance.toFixed(1)} NM`)
            .text(`Red light:   ${angleStr(red.bearing)} / ${red.distance.toFixed(1)} NM`);
        this.pilotInfoHeight = this.doc.y;
    }

    private renderWinds() {
        this.doc.font("Helvetica").fontSize(3);
        const winds = [...this.data.winds].reverse();
        this.windInfoHeight = 0;
        this.windInfoWidth = 21;
        this.doc.save();
        this.doc.translate(0, this.height);
        for (const { altitude, speed, direction } of winds) {
            this.windInfoHeight += 25;
            this.doc.translate(0, -25);
            this.doc.fontSize(3);
            this.doc.text(altitude, 0, 2, { width: 20, align: "center" });
            this.renderOneWind(speed, direction);
        }
        this.windInfoHeight += 4;
        this.doc.translate(0, -3);
        this.doc.fontSize(3);
        this.doc.text("Wind [m/s]", 0, 0);
        this.doc.restore();
    }

    private renderOneWind(knots: number, degrees: number) {
        this.doc.save().translate(10, 15);

        // Gray circle with tick marks
        this.doc.circle(0, 0, 10).lineWidth(0.4).stroke("#d8d8d8");
        for (let i = 0; i < 8; i++) {
            this.doc.rotate(45).moveTo(0, 10).lineTo(0, 8.5).stroke();
        }

        // Numeric wind speed
        const ms = kt2ms(knots);
        this.doc
            .font("Helvetica")
            .fontSize(4)
            .text(ms.toFixed(0), -5, -1.5, { width: 10, align: "center" });

        // Wind arrow
        if (ms >= 0.5) {
            this.doc
                .rotate(degrees)
                .moveTo(0, 3)
                .lineTo(0, 9)
                .lineWidth(1)
                .stroke("black")
                .moveTo(0, 10)
                .lineTo(-1.6, 7.5)
                .lineTo(1.6, 7.5)
                .closePath()
                .fill("black");
        }
        this.doc.restore();
    }

    private renderFooter() {
        const time = Intl.DateTimeFormat("sv-SE", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        }).format(this.data.time);
        const fullText = `${time}     spotten.nu     Map: © OpenStreetMap contributors`;
        this.doc.font("Helvetica").fontSize(3);
        const w = this.doc.widthOfString(fullText);
        const h = this.doc.heightOfString(fullText);
        this.doc
            .text(time + "     ", this.width - w - 0.2, this.height - h + 0.9, { continued: true })
            .text("spotten.nu", { link: "https://spotten.nu/", continued: true })
            .text("     Map: © ", { link: null as unknown as string, continued: true })
            .text("OpenStreetMap", {
                link: "https://www.openstreetmap.org/copyright",
                continued: true,
            })
            .text(" contributors", { link: null as unknown as string });
        this.footerWidth = w + 1;
        this.footerHeight = h;
    }

    private renderMap() {
        this.doc.save();
        this.traceOutline();
        this.doc.clip();

        const { path, metersPerPixel, width, height, dz } = this.data.map;
        this.doc
            .save()
            .translate(this.width / 2, this.height / 2)
            .scale(1000 / this.mapScaleDenominator)
            .image(path, -dz.x * metersPerPixel, -dz.y * metersPerPixel, {
                width: width * metersPerPixel,
                height: height * metersPerPixel,
            })
            .restore();
        this.renderSpot();
        this.renderScale();
        this.traceOutline();
        this.doc.lineWidth(0.3).stroke("#d8d8d8");
        this.doc.restore();
    }

    private traceOutline() {
        this.doc
            .moveTo(this.pilotInfoWidth, 0)
            .lineTo(this.width, 0)
            .lineTo(this.width, this.height - this.footerHeight)
            .lineTo(this.width - this.footerWidth, this.height - this.footerHeight)
            .lineTo(this.width - this.footerWidth, this.height)
            .lineTo(this.windInfoWidth, this.height)
            .lineTo(this.windInfoWidth, this.height - this.windInfoHeight)
            .lineTo(0, this.height - this.windInfoHeight)
            .lineTo(0, this.pilotInfoHeight)
            .lineTo(this.pilotInfoWidth, this.pilotInfoHeight)
            .closePath();
    }

    private renderSpot() {
        // Switch unit from mm to real-world meters.
        this.doc
            .save()
            .translate(this.width / 2, this.height / 2)
            .scale(1000 / this.mapScaleDenominator, -1000 / this.mapScaleDenominator);

        // Draw the circles
        this.doc
            .lineWidth(10)
            .circle(this.data.deplCircle.x, this.data.deplCircle.y, this.data.deplCircle.radius)
            .stroke("#a0a0a0")
            .circle(this.data.exitCircle.x, this.data.exitCircle.y, this.data.exitCircle.radius)
            .stroke("black");

        // Draw the DZ cross
        this.doc
            .moveTo(-25, -25)
            .lineTo(25, 25)
            .moveTo(25, -25)
            .lineTo(-25, 25)
            .lineWidth(15)
            .stroke();

        // Draw the arrow and green light circle
        this.doc
            .rotate(-this.data.spot.heading)
            .translate(nm2m(this.data.spot.transverseOffset), 0)
            .moveTo(0, -2000)
            .lineTo(0, 2000)
            .moveTo(0 - 100, 2000 - 100)
            .lineTo(0, 2000)
            .lineTo(0 + 100, 2000 - 100)
            .lineWidth(25)
            .stroke()
            .circle(0, nm2m(this.data.spot.longitudinalOffset), 40)
            .lineWidth(10)
            .stroke();

        this.doc.restore();
    }

    private renderScale() {
        const denominator = Intl.NumberFormat("sv-SE").format(this.mapScaleDenominator);
        this.doc
            .save()
            .translate(this.windInfoWidth + 5, this.height - 5)
            .scale(1000 / this.mapScaleDenominator);
        // Tick marks
        this.doc
            .moveTo(0, 0)
            .lineTo(2000, 0)
            .moveTo(0, -50)
            .lineTo(0, 50)
            .moveTo(100, -25)
            .lineTo(100, 0)
            .moveTo(200, -25)
            .lineTo(200, 0)
            .moveTo(300, -25)
            .lineTo(300, 0)
            .moveTo(400, -25)
            .lineTo(400, 0)
            .moveTo(500, -40)
            .lineTo(500, 0)
            .moveTo(1000, -50)
            .lineTo(1000, 0)
            .moveTo(1500, -40)
            .lineTo(1500, 0)
            .moveTo(2000, -50)
            .lineTo(2000, 0)
            .moveTo(nm2m(0.1), 30)
            .lineTo(nm2m(0.1), 0)
            .moveTo(nm2m(0.2), 30)
            .lineTo(nm2m(0.2), 0)
            .moveTo(nm2m(0.3), 30)
            .lineTo(nm2m(0.3), 0)
            .moveTo(nm2m(0.4), 30)
            .lineTo(nm2m(0.4), 0)
            .moveTo(nm2m(0.5), 50)
            .lineTo(nm2m(0.5), 0)
            .moveTo(nm2m(1.0), 50)
            .lineTo(nm2m(1.0), 0)
            .lineWidth(8)
            .stroke("black");
        // Labels
        this.doc
            .fontSize(60)
            .font("Helvetica")
            // .text("0 km", -100, -100, { width: 200, align: "center" })
            .text("1 km", 900, -100, { width: 200, align: "center" })
            .text("2 km", 1900, -100, { width: 200, align: "center" })
            // .text("0 NM", -100, 60, { width: 200, align: "center" })
            .text("0.5 NM", nm2m(0.5) - 100, 60, { width: 200, align: "center" })
            .text("1 NM", nm2m(1) - 100, 60, { width: 200, align: "center" });
        // Scale
        this.doc.text(`1 : ${denominator}`, 0, -140);
        this.doc.restore();
    }
}

function angleStr(deg: number) {
    deg = Math.round(deg);
    while (deg <= 0) deg += 360;
    while (deg > 360) deg -= 360;
    return ("00" + deg).slice(-3) + "°";
}
