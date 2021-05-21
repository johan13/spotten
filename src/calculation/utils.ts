// Unit conversions
export const deg2rad = (deg: number) => (deg / 180) * Math.PI;
export const ft2m = (ft: number) => ft * 0.3048;
export const kt2ms = (kt: number) => (kt * 1852) / 3600;
export const m2nm = (m: number) => m / 1852;
export const ms2kt = (ms: number) => (ms * 3600) / 1852;
export const nm2m = (nm: number) => nm * 1852;
export const rad2deg = (rad: number) => (rad / Math.PI) * 180;

// Normalize angle to 0 <= x < 2π
export function normalizeAngle(x: number) {
    while (x < 0) x += 2 * Math.PI;
    while (x >= 2 * Math.PI) x -= 2 * Math.PI;
    return x;
}

// Normalize angle to -π < x <= π
export function normalizeAngleDiff(x: number) {
    while (x <= Math.PI) x += 2 * Math.PI;
    while (x > Math.PI) x -= 2 * Math.PI;
    return x;
}
