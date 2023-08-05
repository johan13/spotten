import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import PrintIcon from "@mui/icons-material/Print";
import SettingsIcon from "@mui/icons-material/Settings";
import { Fab } from "@mui/material";
import { FC, useState } from "react";
import dropzones from "../dropzones";
import { Spot, calculateSpot } from "./calculationAdapter";
import InputPanel, { InputPanelState } from "./inputPanel";
import { renderAsBlobURL } from "./pdfGenerator";
import Preview from "./preview";

const App: FC = () => {
    const [inputVisible, setInputVisible] = useState(true);
    const [input, setInput] = useState(restoreInput());

    const spot = calculateSpot(input);

    return (
        <>
            <Preview dropzone={input.dropzone} spot={spot} />

            {inputVisible && (
                <InputPanel
                    dropzones={dropzones}
                    value={input}
                    onChange={x => {
                        setInput(x);
                        persistInput(x);
                    }}
                    onClose={() => setInputVisible(false)}
                    spot={spot}
                    sx={{ position: "absolute", top: 10, left: 10 }}
                />
            )}

            <Fab
                color="primary"
                title="Edit"
                sx={{ position: "absolute", bottom: 245, right: 20 }}
                onClick={() => setInputVisible(!inputVisible)}
            >
                <EditIcon />
            </Fab>
            <Fab
                color="primary"
                title="Print"
                sx={{ position: "absolute", bottom: 170, right: 20 }}
                onClick={() => print(input, spot).catch(console.error)}
            >
                <PrintIcon />
            </Fab>
            <Fab
                color="primary"
                title="History"
                sx={{ position: "absolute", bottom: 95, right: 20 }}
                onClick={() => alert("TODO: Show history")}
            >
                <HistoryIcon />
            </Fab>
            <Fab
                color="primary"
                title="Settings"
                sx={{ position: "absolute", bottom: 20, right: 20 }}
                onClick={() => alert("TODO: Show settings")}
            >
                <SettingsIcon />
            </Fab>
        </>
    );
};

type PersistedInput = Omit<InputPanelState, "dropzone"> & { dropzone: string };

function persistInput(input: InputPanelState) {
    const jsonData: PersistedInput = { ...input, dropzone: input.dropzone.name };
    localStorage.setItem("input", JSON.stringify(jsonData));
}

function restoreInput(): InputPanelState {
    const input = JSON.parse(localStorage.getItem("input") ?? "{}") as Partial<PersistedInput>;
    return {
        dropzone: dropzones.find(dz => dz.name === input.dropzone) ?? dropzones[0],
        windFL100: input.windFL100 ?? { directionDeg: 360, speedKt: 0 },
        windFL50: input.windFL50 ?? { directionDeg: 360, speedKt: 0 },
        wind2000ft: input.wind2000ft ?? { directionDeg: 360, speedKt: 0 },
        windGround: input.windGround ?? { directionDeg: 360, speedKt: 0 },
        fixedLineOfFlightDeg: input.fixedLineOfFlightDeg,
        fixedDistanceNm: input.fixedDistanceNm,
        fixedOffTrackNm: input.fixedOffTrackNm,
    };
}

async function print(input: InputPanelState, spot: Spot) {
    const blobUrl = await renderAsBlobURL(input, spot);

    const wnd = window.open(blobUrl);
    if (!wnd) return;
    wnd.onload = () => {
        wnd.focus();
        wnd.print();
    };
}

export default App;
