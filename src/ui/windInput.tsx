import { InputAdornment, TextField } from "@mui/material";
import { FC, useState } from "react";

export type Wind = { speedKt: number; directionDeg: number };

type Props = {
    value?: Wind;
    onChange?: (x: Wind) => void;
};

/**
 * WindInput is a composite control with two inputs for wind direction and wind speed.
 * Direction is a multiple of 5 degrees 5 <= dir <= 360. Speed is a non-negative integer knots.
 */
const WindInput: FC<Props> = ({ value, onChange }) => {
    const [localDirection, setLocalDirection] = useState<string | undefined>();
    const [localSpeed, setLocalSpeed] = useState<string | undefined>();

    return (
        <>
            <TextField
                type="number"
                label="Direction"
                variant="outlined"
                size="small"
                inputProps={{ min: 0, max: 360, step: 5 }}
                InputProps={{
                    endAdornment: <InputAdornment position="end">°</InputAdornment>,
                }}
                value={localDirection ?? value?.directionDeg ?? "360"}
                onChange={e => {
                    setLocalDirection(e.target.value);
                    let directionDeg = Math.round(Number(e.target.value) / 5) * 5;
                    if (!e.target.value || !Number.isFinite(directionDeg)) return;
                    if (directionDeg <= 0 || directionDeg > 360) directionDeg = 360;
                    onChange?.({ speedKt: 0, ...value, directionDeg });
                }}
                onBlur={() => setLocalDirection(undefined)}
            />
            <TextField
                type="number"
                label="Speed"
                variant="outlined"
                size="small"
                sx={{ marginLeft: 1 }}
                inputProps={{ min: 0, max: 99, step: 1 }}
                InputProps={{
                    endAdornment: <InputAdornment position="end">kt</InputAdornment>,
                }}
                value={localSpeed ?? value?.speedKt ?? "0"}
                onChange={e => {
                    setLocalSpeed(e.target.value);
                    let speedKt = Math.round(Number(e.target.value));
                    if (!e.target.value || !Number.isFinite(speedKt)) return;
                    if (speedKt < 0) speedKt = 0;
                    if (speedKt > 99) speedKt = 99;
                    onChange?.({ directionDeg: 360, ...value, speedKt });
                }}
                onBlur={() => setLocalSpeed(undefined)}
            />
        </>
    );
};

export default WindInput;
