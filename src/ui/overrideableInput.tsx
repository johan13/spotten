import { InputAdornment, Switch, TextField, TextFieldProps } from "@mui/material";
import { FC, useState } from "react";

type Props = {
    defaultValue?: number;
    value?: number | undefined; // TODO number + bool? OR: value + defaultValue?
    onChange?: (x: number | undefined) => void;
    unit: "deg" | "nm";
};

/**
 * OverrideableInput is a composite control with a TextField and a Switch. When the switch is off
 * the TextField is read-only and shows the defaultValue, the value is undefined. When the switch is
 * on the TextField is editable and the value is a number.
 */
const OverrideableInput: FC<Props> = ({ defaultValue, value, onChange, unit }) => {
    const [localValue, setLocalValue] = useState<string | undefined>();

    const unitDependentProps: TextFieldProps =
        unit === "deg"
            ? {
                  inputProps: { min: 0, max: 360, step: 5 },
                  InputProps: { endAdornment: <InputAdornment position="end">°</InputAdornment> },
              }
            : {
                  inputProps: { min: -99.9, max: 99.9, step: 0.1 },
                  InputProps: { endAdornment: <InputAdornment position="end">NM</InputAdornment> },
              };

    return (
        <div>
            <TextField
                type="number"
                variant="outlined"
                size="small"
                sx={{ width: 155 }}
                {...unitDependentProps}
                disabled={value === undefined}
                value={localValue ?? (value ?? defaultValue ?? 0).toFixed(unit === "deg" ? 0 : 1)}
                onChange={e => {
                    setLocalValue(e.target.value);
                    if (unit === "deg") {
                        let newValue = Math.round(Number(e.target.value) / 5) * 5;
                        if (!(0 < newValue && newValue <= 360)) newValue = 360;
                        onChange?.(newValue);
                    } else {
                        let newValue = Math.round(Number(e.target.value) / 0.1) * 0.1;
                        onChange?.(newValue);
                    }
                }}
                onBlur={() => setLocalValue(undefined)}
            />
            <Switch
                title="Override"
                sx={{ float: "right" }}
                checked={value !== undefined}
                onChange={e => {
                    onChange?.(e.target.checked ? defaultValue : undefined);
                }}
            />
        </div>
    );
};

export default OverrideableInput;
