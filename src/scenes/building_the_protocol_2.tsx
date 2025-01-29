import { makeScene2D } from '@motion-canvas/2d';
import { all, useLogger, waitFor } from '@motion-canvas/core';

import { Solarized } from '../utilities';
import { exampleGraphData } from '../utilities_graph';
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
