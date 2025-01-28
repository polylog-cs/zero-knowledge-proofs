import { Camera, Circle, Line } from '@motion-canvas/2d';
import { createRef, useLogger, waitFor } from '@motion-canvas/core';

// See prepare_facebook_dataset.py
import graphData from '../assets/facebook_layout.json';
import { Solarized } from '../utilities';
import { makeScene2D } from '../utilities_fix_view_scaling';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const camera = createRef<Camera>();

  const positions = graphData.positions as unknown as {
    [key: string]: [number, number];
  };
  const edges = graphData.edges as unknown as [number, number][];
  const logger = useLogger();

  const positionScale = 3000;

  view.add(
    <Camera ref={camera}>
      {Object.entries(positions).map(([k, v]) => (
        <Circle
          size={10}
          x={v[0] * positionScale}
          y={v[1] * positionScale}
          fill={Solarized.gray}
        />
      ))}
      {edges.map(([a, b], i) => {
        const posA = positions[a];
        const posB = positions[b];
        return (
          <Line
            // key={i}
            points={[
              [posA[0] * positionScale, posA[1] * positionScale],
              [posB[0] * positionScale, posB[1] * positionScale],
            ]}
            lineWidth={2}
            stroke={Solarized.gray}
          />
        );
      })}
    </Camera>,
  );

  camera().zoom(10);
  yield* camera().zoom(0.7, 10);

  yield* waitFor(3);
});
