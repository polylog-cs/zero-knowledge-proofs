import {
  Camera,
  Circle,
  Line,
  Node,
  makeScene2D,
} from '@motion-canvas/2d';
import {
  createRef,
  useLogger,
  waitFor,
  Reference,
  all,
} from '@motion-canvas/core';

import graphData from '../assets/facebook_layout.json';
import { Solarized } from '../utilities';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const camera = createRef<Node>();

  // Our JSON uses an object for positions, so we cast here:
  const positions = (graphData.positions as unknown) as {
    [key: string]: [number, number];
  };
  const edges = (graphData.edges as unknown) as [string, string][];

  const logger = useLogger();

  const positionScale = 3000;
  const totalZoomDuration = 10;    // camera zoom runs for 10 seconds
  const vertexAnimDuration = 0.5;  // each vertex fades in over 0.5 sec
  const edgeFadeDuration = 2;      // each edge fades in over 2.0 sec
  const startingDelay = 0;

  // Store references for each vertex
  const vertexRefs: { [id: string]: Reference<Circle> } = {};

  // Compute the maximum distance from center for scheduling fade-in delays
  let maxDistance = 0;
  for (const [_, [px, py]] of Object.entries(positions)) {
    const dist = Math.hypot(px * positionScale, py * positionScale);
    if (dist > maxDistance) {
      maxDistance = dist;
    }
  }

  // Keep track of each vertex’s delay
  const vertexDelays: { [id: string]: number } = {};

  // Store references for each edge
  const edgeRefs: Reference<Line>[] = [];

  // Add camera + all vertices & edges to the view
  view.add(
    <Node ref={camera}>
      {/* Vertices */}
      {Object.entries(positions).map(([id, [px, py]]) => {
        const x = px * positionScale;
        const y = py * positionScale;
        // Vertex fade-in delay (custom formula, can be whatever you like)
        const dist = Math.hypot(x, y);
        const delay = (
          (2.001 + Math.log10(Math.max(dist, maxDistance / 100) / maxDistance)) / 2
        ) * totalZoomDuration;
        vertexDelays[id] = delay + startingDelay;

        const ref = createRef<Circle>();
        vertexRefs[id] = ref;

        return (
          <Circle
            ref={ref}
            size={10}
            x={x}
            y={y}
            fill={Solarized.gray}
            opacity={0} // Start hidden
            zIndex={10}
          />
        );
      })}

      {/* Edges */}
      {edges.map(([a, b], i) => {
        const [ax, ay] = [
          positions[a][0] * positionScale,
          positions[a][1] * positionScale,
        ];
        const [bx, by] = [
          positions[b][0] * positionScale,
          positions[b][1] * positionScale,
        ];

        const lineRef = createRef<Line>();
        edgeRefs[i] = lineRef;

        return (
          <Line
            ref={lineRef}
            points={[
              [ax, ay],
              [bx, by],
            ]}
            lineWidth={2}
            stroke={Solarized.gray}
            opacity={0} // Start hidden
          />
        );
      })}
    </Node>,
  );

  // Start the "camera" fully scaled in
  camera().scale(10);

  // -------------------------
  // 1) Vertex fade-ins
  // -------------------------
  const vertexGenerators = Object.entries(vertexDelays).map(([id, delay]) =>
    (function* () {
      yield* waitFor(delay);
      yield* vertexRefs[id]().opacity(1, vertexAnimDuration);
    })(),
  );

  // -------------------------
  // 2) Edge fade-ins
  //    after their endpoints appear
  // -------------------------
  const edgeGenerators = edges.map(([a, b], i) =>
    (function* () {
      const edgeDelay =
        Math.max(vertexDelays[a], vertexDelays[b]) + vertexAnimDuration;
      yield* waitFor(edgeDelay);
      yield* edgeRefs[i]().opacity(1, edgeFadeDuration);
    })(),
  );

  // -------------------------
  // 3) Run camera scale & fade-in concurrency
  // -------------------------
  yield* all(
    camera().scale(0.7, totalZoomDuration),
    ...vertexGenerators,
    ...edgeGenerators,
  );

  // -------------------------
  // 4) After main fades, color the vertices in random order
  // -------------------------
  // Shuffle vertex IDs
  const vertexIDs = Object.keys(vertexRefs);
  shuffleArray(vertexIDs);

  // Possible colors (adjust as you like)
  const colorChoices = [
    Solarized.red,
    Solarized.blue,
    Solarized.green,
  ];

// Animate each vertex picking a random color concurrently using delayed starts.
const colorGenerators = vertexIDs.map((vId, index) =>
  (function* () {
    yield* waitFor(index * 0.005);
    const chosenColor = colorChoices[Math.floor(Math.random() * colorChoices.length)];
    yield* all(
      vertexRefs[vId]().fill(chosenColor, 0.5),
      vertexRefs[vId]().scale(1.5, 0.5),
    );
  })()
);

yield* all(...colorGenerators);

  // Optionally wait a bit after everything completes
  yield* waitFor(3);
});

/**
 * Utility function to shuffle an array in-place (Fisher-Yates).
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
