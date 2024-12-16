import { makeScene2D, Spline } from "@motion-canvas/2d";
import { waitFor } from "@motion-canvas/core";

export default makeScene2D(function* (view) {
  const h = 100;
  const w = 100;

  // By setting stroke and lineWidth, we make the spline visible.
  view.add(
    <Spline
      points={[
        [0, 0],
        [0, -h],
        [-w, -h],
        [-w, h],
        [w, h],
        [w, -h],
        [0, -h],
        [0, 0],
      ]}
      smoothness={0.6}
      stroke="red"
      lineWidth={4}
      draw={1} // ensures the spline is fully drawn
    />
  );
  yield* waitFor(1);
});
