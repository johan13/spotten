import { TextField } from "@material-ui/core";
import { useState } from "react";

type Wind = { speed: number; direction: number };

type WindInputProps = {
  label?: string;
  helperText?: string;
  value?: Wind;
  onChange?: (v: Wind) => void;
  className?: string;
  error?: boolean;
};

function WindInput({
  label,
  helperText,
  value,
  onChange,
  className,
  error,
}: WindInputProps) {
  const [textValue, setTextValue] = useState<string | undefined>();
  return (
    <TextField
      label={label}
      helperText={helperText}
      placeholder="E.g. 270/8kt"
      className={className}
      value={
        textValue ?? (value ? `${value.direction}/${value.speed ?? 0}kt` : "")
      }
      onChange={(e) => {
        setTextValue(e.target.value);
        const wind = parseWind(e.target.value);
        if (wind) onChange?.(wind);
      }}
      onBlur={() => setTextValue(undefined)}
      error={error}
    />
  );
}

function parseWind(str: string): Wind | null {
  const match = /^([\d.,]+)\/([\d.,]+)(kt)?$/.exec(str);
  if (match) {
    const direction = Math.round(Number(match[1]));
    const speed = Math.round(Number(match[2]));
    if (direction >= 0 && direction <= 360 && speed >= 0) {
      return { direction: direction === 0 ? 360 : direction, speed };
    }
  }
  return null;
}

export default WindInput;
