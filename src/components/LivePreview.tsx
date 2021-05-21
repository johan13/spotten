import { Spot } from "../App";
import { AppState } from "../state";

type LivePreviewProps = {
  state: AppState;
  spot?: Spot;
};

function LivePreview({ state, spot }: LivePreviewProps) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          width: "100%",
          height: "100%",
          backgroundImage: "url(/maps/vargarda.png)",
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: "blur(calc(0.4vw))",
        }}
      ></div>
      <div style={{ position: "absolute", top: 50, left: 300 }}>
        <h1>TODO: Live map preview</h1>
        <pre style={{ fontSize: 10 }}>
          {JSON.stringify({ ...state, spot }, undefined, 4)}
        </pre>
      </div>
    </>
  );
}

export default LivePreview;
