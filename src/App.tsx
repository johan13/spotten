import { useMemo, useReducer } from "react";
import LeftDrawer from "./components/LeftDrawer";
import LivePreview from "./components/LivePreview";
import dropzones, { Dropzone } from "./dropzones";
import { renderAsBlobURL } from "./pdfGenerator";
import {
  AppState,
  Config,
  FixedParams,
  initialState,
  reducer,
  Winds,
} from "./state";
import { deg2rad, ft2m, kt2ms, m2nm, nm2m, rad2deg } from "./calculation/utils";
import { SpotCalculator } from "./calculation/spotCalculator";

export type Spot = ReturnType<typeof calculateSpot>;

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const spot = useMemo(
    () =>
      calculateSpot(
        state.dropzone,
        state.winds,
        state.fixedParams,
        state.config
      ),
    [state.dropzone, state.winds, state.fixedParams, state.config]
  );
  return (
    <>
      <LeftDrawer
        dropzones={dropzones}
        state={state}
        dispatch={dispatch}
        spot={spot}
        onPrint={() => print(state, spot)}
      />
      <LivePreview state={state} spot={spot} />
    </>
  );
}

function calculateSpot(
  dz: Dropzone,
  winds: Winds,
  fixedParams: FixedParams,
  config: Config
) {
  const input = {
    winds: [
      {
        altitude: ft2m(10000),
        direction: deg2rad(winds.fl100?.direction ?? 0),
        speed: kt2ms(winds.fl100?.speed ?? 0),
      },
      {
        altitude: ft2m(2000),
        direction: deg2rad(winds["2000ft"]?.direction ?? 0),
        speed: kt2ms(winds["2000ft"]?.speed ?? 0),
      },
      {
        altitude: ft2m(0),
        direction: deg2rad(winds.ground?.direction ?? 0),
        speed: kt2ms(winds.ground?.speed ?? 0),
      },
    ],
    fixedTrack:
      fixedParams.lineOfFlight === undefined
        ? undefined
        : deg2rad(fixedParams.lineOfFlight),
    fixedTransverseOffset:
      fixedParams.offTrack === undefined
        ? undefined
        : nm2m(fixedParams.offTrack),
    allowedLandingDirections: fixedParams.landingDirection
      ? [deg2rad(fixedParams.landingDirection)]
      : dz.allowedLandingDirections?.map(deg2rad),
    config,
  };
  const output = new SpotCalculator(input).calculate();

  const output2 = {
    lineOfFlight: rad2deg(output.track),
    offTrack: m2nm(output.transverseOffset),
    distance: fixedParams.distance ?? m2nm(output.longitudinalOffset),
    deplCircle: output.deplCircle,
    exitCircle: output.exitCircle,
    redLight: {
      bearing: rad2deg(output.redLight.bearing),
      distance: m2nm(output.redLight.distance),
    },
    landingDirection: rad2deg(output.landingDirection),
    timeBetweenGroups: output.timeBetweenGroups,
    jumpRunDuration: output.jumpRunDuration,
  };
  console.log({ input, output, output2 });
  return output2;
}

async function print(state: AppState, spot: Spot) {
  const mapResp = await fetch(state.dropzone.url);
  const imageData = await mapResp.arrayBuffer();

  const data = await renderAsBlobURL({
    map: {
      imageData,
      metersPerPixel: 5,
      width: state.dropzone.width,
      height: state.dropzone.height,
      dz: { x: state.dropzone.width / 2, y: state.dropzone.height / 2 },
    },
    winds: [
      {
        altitudeDescr: "FL100",
        speed: state.winds.fl100?.speed ?? 0,
        direction: state.winds.fl100?.direction ?? 0,
      },
      {
        altitudeDescr: "2000 ft",
        speed: state.winds["2000ft"]?.speed ?? 0,
        direction: state.winds["2000ft"]?.direction ?? 0,
      },
      {
        altitudeDescr: "Ground",
        speed: state.winds.ground?.speed ?? 0,
        direction: state.winds.ground?.direction ?? 0,
      },
    ],
    exitCircle: spot.exitCircle,
    deplCircle: spot.deplCircle,
    spot: {
      heading: spot.lineOfFlight,
      longitudinalOffset: spot.distance,
      transverseOffset: spot.offTrack,
    },
    redLight: {
      bearing: spot.redLight.bearing,
      distance: spot.redLight.distance,
    },
    timeBetweenGroups: spot.timeBetweenGroups,
    jumpRunDuration: spot.jumpRunDuration,
    time: new Date(),
  });

  const wnd = window.open(data);
  if (!wnd) return;
  wnd.onload = () => {
    wnd.focus();
    wnd.print();
  };
}

export default App;
