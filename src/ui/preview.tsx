import { FC, useEffect, useRef } from "react";
import { deg2rad } from "../calculation";
import { Dropzone } from "../dropzones";
import { Spot } from "./calculationAdapter";
import useWindowSize from "./useWindowSize";

type Props = {
    dropzone: Dropzone;
    spot: Spot;
};

const Preview: FC<Props> = ({ dropzone, spot }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        draw(ctx, dropzone, spot).catch(err => console.error(`Preview.draw: ${err}`));
    }, [useWindowSize(), spot]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

export default Preview;

async function draw(ctx: CanvasRenderingContext2D, dropzone: Dropzone, spot: Spot) {
    ctx.save();
    const { width, height } = ctx.canvas;

    const map = await loadImage(dropzone.mapPath);
    // Choose a scale factor half-way between "contain" and "cover".
    const scale = (width / map.width + height / map.height) / 2;
    ctx.drawImage(
        map,
        width / 2 - (map.width / 2) * scale,
        height / 2 - (map.height / 2) * scale,
        map.width * scale,
        map.height * scale,
    );

    // Bottom left info
    ctx.fillStyle = "white";
    ctx.fillRect(0, height - 64, 210, 64);
    ctx.moveTo(0, height - 64);
    ctx.lineTo(210, height - 64);
    ctx.lineTo(210, height);
    ctx.strokeStyle = "gray";
    ctx.stroke();
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "black";
    ctx.fillText(`${spot.secondsBetweenGroups.toFixed(0)} s between groups`, 10, height - 38);
    ctx.fillText(`Landing direction ${spot.landingDirection.toFixed(0)}°`, 10, height - 14);

    // Switch coordinate system to 1 = 1 m, center at DZ, positive Y up.
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale / dropzone.metersPerPixel, -scale / dropzone.metersPerPixel);

    // Center X
    ctx.beginPath();
    ctx.moveTo(-24, -24);
    ctx.lineTo(24, 24);
    ctx.moveTo(24, -24);
    ctx.lineTo(-24, 24);
    ctx.lineWidth = 17;
    ctx.strokeStyle = "rgb(224, 0, 0)";
    ctx.stroke();

    // Switch coordinate system to 1 = 1 NM.
    ctx.scale(1852, 1852);

    // Deployment circle
    ctx.beginPath();
    ctx.arc(spot.deplCircle.xNm, spot.deplCircle.yNm, spot.deplCircle.radiusNm, 0, 2 * Math.PI);
    ctx.lineWidth = 0.006;
    ctx.strokeStyle = "rgb(160, 160, 160)";
    ctx.stroke();

    // Exit circle
    ctx.beginPath();
    ctx.arc(spot.exitCircle.xNm, spot.exitCircle.yNm, spot.exitCircle.radiusNm, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgb(0, 0, 0)";
    ctx.stroke();

    // Line of flight
    ctx.rotate(deg2rad(-spot.lineOfFlightDeg));
    ctx.translate(spot.offTrackNm, 0);
    ctx.beginPath();
    ctx.moveTo(0, Math.min(-1, spot.distanceNm - 0.1));
    ctx.lineTo(0, 1.2);
    ctx.moveTo(-0.04, 1.16);
    ctx.lineTo(0, 1.2);
    ctx.lineTo(0.04, 1.16);
    ctx.stroke();

    // Green light circle
    ctx.beginPath();
    ctx.arc(0, spot.distanceNm, 0.02, 0, 2 * Math.PI);
    ctx.lineWidth = 0.003;
    ctx.stroke();

    ctx.restore();
}

// Cache the previous image to avoid flicker.
let cachedUrl: string | undefined;
let cachedImg: HTMLImageElement | undefined;

async function loadImage(url: string) {
    if (url === cachedUrl && cachedImg !== undefined) return cachedImg;
    cachedUrl = url;
    cachedImg = undefined;

    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            if (url === cachedUrl) cachedImg = img;
            resolve(img);
        };
        img.onerror = () => reject(new Error("Cannot load map."));
    });
}
