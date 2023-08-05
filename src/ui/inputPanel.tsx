import CloseIcon from "@mui/icons-material/Close";
import { IconButton, InputLabel, MenuItem, Paper, Select } from "@mui/material";
import { SxProps, Theme, css, styled } from "@mui/material/styles";
import { FC } from "react";
import { Dropzone } from "../dropzones";
import { Spot } from "./calculationAdapter";
import OverrideableInput from "./overrideableInput";
import WindInput, { Wind } from "./windInput";

export type InputPanelState = {
    dropzone: Dropzone;
    windFL100: Wind;
    windFL50: Wind;
    wind2000ft: Wind;
    windGround: Wind;
    fixedLineOfFlightDeg?: number;
    fixedDistanceNm?: number;
    fixedOffTrackNm?: number;
};

type Props = {
    dropzones: [Dropzone, ...Dropzone[]];
    value: InputPanelState;
    onChange?: (value: InputPanelState) => void;
    onClose?: () => void;
    spot?: Spot;
    sx?: SxProps<Theme>;
};

const Header = styled("div")(css({ color: "rgba(0,0,0,0.7)", fontSize: 20 }));

const InputPanel: FC<Props> = ({ dropzones, value, onChange, onClose, spot, sx }) => {
    return (
        <Paper
            component="form"
            sx={{ p: 1.5, display: "inline-block", backgroundColor: "#fff", ...sx }}
            elevation={8}
            autoComplete="off"
        >
            <IconButton onClick={onClose} sx={{ position: "absolute", top: 0, right: 0 }}>
                <CloseIcon fontSize="small" sx={{ color: "#888" }} />
            </IconButton>
            <Header>Dropzone</Header>
            <Select
                required
                size="small"
                value={value.dropzone?.name ?? dropzones?.[0]?.name ?? ""}
                onChange={x => {
                    const newDz = dropzones?.find(dz => dz.name === x.target.value);
                    if (newDz) onChange?.({ ...value, dropzone: newDz });
                }}
            >
                {dropzones?.map(dz => (
                    <MenuItem key={dz.name} value={dz.name}>
                        {dz.name}
                    </MenuItem>
                ))}
            </Select>

            <Header sx={{ marginTop: 2.5 }}>Wind</Header>
            <InputLabel sx={{ marginBottom: 1 }}>FL100</InputLabel>
            <WindInput
                value={value.windFL100}
                onChange={wind => onChange?.({ ...value, windFL100: wind })}
            />
            <InputLabel sx={{ marginY: 1 }}>FL50</InputLabel>
            <WindInput
                value={value.windFL50}
                onChange={wind => onChange?.({ ...value, windFL50: wind })}
            />
            <InputLabel sx={{ marginY: 1 }}>2000 ft</InputLabel>
            <WindInput
                value={value.wind2000ft}
                onChange={wind => onChange?.({ ...value, wind2000ft: wind })}
            />
            <InputLabel sx={{ marginY: 1 }}>Ground</InputLabel>
            <WindInput
                value={value.windGround}
                onChange={wind => onChange?.({ ...value, windGround: wind })}
            />

            <Header sx={{ marginTop: 2.5 }}>Jump run</Header>
            <InputLabel sx={{ marginBottom: 1 }}>Line of flight</InputLabel>
            <OverrideableInput
                unit="deg"
                defaultValue={spot?.lineOfFlightDeg}
                value={value.fixedLineOfFlightDeg}
                onChange={deg => onChange?.({ ...value, fixedLineOfFlightDeg: deg })}
            />
            <InputLabel sx={{ marginY: 1 }}>Green light</InputLabel>
            <OverrideableInput
                unit="nm"
                defaultValue={spot?.distanceNm}
                value={value.fixedDistanceNm}
                onChange={nm => onChange?.({ ...value, fixedDistanceNm: nm })}
            />
            <InputLabel sx={{ marginY: 1 }}>Off track</InputLabel>
            <OverrideableInput
                unit="nm"
                defaultValue={spot?.offTrackNm}
                value={value.fixedOffTrackNm}
                onChange={nm => onChange?.({ ...value, fixedOffTrackNm: nm })}
            />
        </Paper>
    );
};

export default InputPanel;
