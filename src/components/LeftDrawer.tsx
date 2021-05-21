import {
  Button,
  Drawer,
  FormControl,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
} from "@material-ui/core";
import { Dispatch } from "react";
import { Spot } from "../App";
import { Dropzone } from "../dropzones";
import { Action, AppState } from "../state";
import OverridableNumber from "./OverridableNumber";
import WindInput from "./WindInput";

const useStyles = makeStyles({
  paper: {
    width: 200,
  },
  form: {
    margin: 12,
  },
  header: {
    marginTop: 25,
  },
  input: {
    marginTop: 8,
  },
  print: {
    marginTop: 25,
    textAlign: "center",
  },
});

function LeftDrawer({
  dropzones,
  state,
  dispatch,
  spot,
  onPrint,
}: {
  dropzones?: Dropzone[];
  state: AppState;
  dispatch: Dispatch<Action>;
  spot?: Spot;
  onPrint?: () => void;
}) {
  const classes = useStyles();
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      PaperProps={{ elevation: 24 }}
      classes={{ paper: classes.paper }}
    >
      <form autoComplete="off" className={classes.form}>
        <FormControl fullWidth={true}>
          <InputLabel>Dropzone</InputLabel>
          <Select
            value={state.dropzone.id}
            onChange={(e) =>
              dispatch({ type: "dropzone", id: e.target.value as string })
            }
          >
            {dropzones?.map((dz) => (
              <MenuItem key={dz.id} value={dz.id}>
                {dz.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className={classes.header}>Winds</div>
        <WindInput
          label="FL100"
          value={state.winds.fl100}
          onChange={(wind) =>
            dispatch({ type: "winds", winds: { ...state.winds, fl100: wind } })
          }
          className={classes.input}
          error={!state.winds.fl100}
        />
        <WindInput
          label="2000 ft"
          value={state.winds["2000ft"]}
          onChange={(wind) =>
            dispatch({
              type: "winds",
              winds: { ...state.winds, "2000ft": wind },
            })
          }
          className={classes.input}
          error={!state.winds["2000ft"]}
        />
        <WindInput
          label="Ground"
          value={state.winds.ground}
          onChange={(wind) =>
            dispatch({ type: "winds", winds: { ...state.winds, ground: wind } })
          }
          className={classes.input}
          error={!state.winds.ground}
        />

        <div className={classes.header}>Spot</div>
        <OverridableNumber
          label="Landing direction"
          unit="°"
          step={10}
          min={10}
          max={360}
          value={state.fixedParams.landingDirection}
          defaultValue={spot?.landingDirection}
          onChange={(val) =>
            dispatch({
              type: "fixedParams",
              fixedParams: { ...state.fixedParams, landingDirection: val },
            })
          }
          className={classes.input}
        />
        <OverridableNumber
          label="Line of flight"
          unit="°"
          step={5}
          min={5}
          max={360}
          value={state.fixedParams.lineOfFlight}
          defaultValue={spot?.lineOfFlight}
          onChange={(val) =>
            dispatch({
              type: "fixedParams",
              fixedParams: { ...state.fixedParams, lineOfFlight: val },
            })
          }
          className={classes.input}
        />
        <OverridableNumber
          label="Off track"
          helperText="Positive right of track"
          unit="NM"
          step={0.1}
          value={state.fixedParams.offTrack}
          defaultValue={spot?.offTrack}
          onChange={(val) =>
            dispatch({
              type: "fixedParams",
              fixedParams: { ...state.fixedParams, offTrack: val },
            })
          }
          className={classes.input}
        />
        <OverridableNumber
          label="Distance"
          helperText="Positive past DZ"
          unit="NM"
          step={0.1}
          value={state.fixedParams.distance}
          defaultValue={spot?.distance}
          onChange={(val) =>
            dispatch({
              type: "fixedParams",
              fixedParams: { ...state.fixedParams, distance: val },
            })
          }
          className={classes.input}
        />

        <div className={classes.print}>
          <Button variant="contained" color="primary" onClick={onPrint}>
            Print
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default LeftDrawer;
