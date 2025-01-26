import { makeScene2D, Rect, Spline } from '@motion-canvas/2d';
import {
  all,
  createRef,
  sequence,
  useLogger,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import { logPosition, Solarized } from '../utilities';
import { exampleGraphData, Graph } from '../utilities_graph';
import { LockableGraph } from '../utilities_lockable_graph';
import { ProtocolScene } from '../utilities_protocol';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  const scene = new ProtocolScene(view);

  yield* scene.setup('prover');

  yield* all(
    scene.addText('prover', '1. Lock the colors'),
    scene.graphRef().lockVertices(),
  );

  yield* scene.sendGraph('verifier');

  const challengeEdge: [string, string] = exampleGraphData.edges[0];
  yield* all(
    scene.addText('verifier', '2. Challenge an edge'),
    scene.graphRef().pointAtEdge(challengeEdge, true, 2, false),
  );

  yield* all(
    scene.addText('prover', '3. Reveal the colors'),
    scene.graphRef().unlockVertices(challengeEdge),
    scene.graphRef().removeArrows(),
  );

  yield* all(scene.addText('verifier', '4. Check the colors'));

  yield* waitFor(5);
});
