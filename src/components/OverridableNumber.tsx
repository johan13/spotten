import { IconButton, InputAdornment, TextField } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";

type OverridableNumberProps = {
  label?: string;
  helperText?: string;
  value?: number;
  defaultValue?: number;
  onChange?: (v: number | undefined) => void;
  className?: string;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
};

function OverridableNumber({
  label,
  helperText,
  value,
  defaultValue,
  onChange,
  className,
  unit,
  step,
  min,
  max,
}: OverridableNumberProps) {
  return (
    <TextField
      name="noname" // TODO: Better way to avoid Chrome's password suggestions
      type="number"
      label={label}
      helperText={helperText}
      className={className}
      fullWidth
      value={Math.round((value ?? defaultValue ?? 0) * 10) / 10}
      onChange={(e) => onChange?.(Number(e.target.value))}
      disabled={value === undefined}
      inputProps={{ step, min, max }}
      InputLabelProps={{ disabled: false }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {unit}
            <IconButton
              color={value === undefined ? "default" : "secondary"}
              onClick={(e) =>
                onChange?.(value === undefined ? defaultValue : undefined)
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

export default OverridableNumber;
