// Degrees to Radians
export function deg2rad(deg: number): number;
export function deg2rad(deg: number | undefined): number | undefined;
export function deg2rad(deg: number | undefined): number | undefined {
    if (deg === undefined) return undefined;
    return (deg / 180) * Math.PI;
}

// Radians to degrees
export function rad2deg(rad: number): number;
export function rad2deg(rad: number | undefined): number | undefined;
export function rad2deg(rad: number | undefined): number | undefined {
    if (rad === undefined) return undefined;
    return (rad / Math.PI) * 180;
}

// Feet to meters
export function ft2m(ft: number): number;
export function ft2m(ft: number | undefined): number | undefined;
export function ft2m(ft: number | undefined): number | undefined {
    if (ft === undefined) return undefined;
    return ft * 0.3048;
}

// Meters to nautical miles
export function m2nm(m: number): number;
export function m2nm(m: number | undefined): number | undefined;
export function m2nm(m: number | undefined): number | undefined {
    if (m === undefined) return undefined;
    return m / 1852;
}

// Nautical miles to meters
export function nm2m(nm: number): number;
export function nm2m(nm: number | undefined): number | undefined;
export function nm2m(nm: number | undefined): number | undefined {
    if (nm === undefined) return undefined;
    return nm * 1852;
}

// Knots to m/s
export function kt2mps(kt: number): number;
export function kt2mps(kt: number | undefined): number | undefined;
export function kt2mps(kt: number | undefined): number | undefined {
    if (kt === undefined) return undefined;
    return (kt * 1852) / 3600;
}

// m/s to knots
export function mps2kt(mps: number): number;
export function mps2kt(mps: number | undefined): number | undefined;
export function mps2kt(mps: number | undefined): number | undefined {
    if (mps === undefined) return undefined;
    return (mps * 3600) / 1852;
}

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
