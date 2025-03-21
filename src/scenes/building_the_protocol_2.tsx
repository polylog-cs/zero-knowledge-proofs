import { makeScene2D } from '@motion-canvas/2d';
import { all, delay, useLogger, Vector2, waitFor } from '@motion-canvas/core';

import { Solarized } from '../utilities';
import { exampleGraphData } from '../utilities_graph';
import { ProtocolScene } from '../utilities_protocol';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  const scene = new ProtocolScene(view);

  yield* scene.setup('prover');

  yield* all(scene.addText('prover', '1. Lock'), scene.graphRef().lockVertices());

  yield* waitFor(3);

  yield* scene.sendGraph('verifier');

  const challengeEdge: [string, string] = exampleGraphData.edges[0];
  yield* all(scene.addText('verifier', '2. Challenge'));
  scene.verifierRef().expression('thinking');
  yield* waitFor(1);
  scene.verifierRef().expression('neutral');
  yield* scene.graphRef().pointAtEdge(challengeEdge);

  yield* all(
    scene.addText('prover', '3. Reveal'),
    scene.graphRef().unlockVertices(challengeEdge),
    scene.graphRef().removeArrows(),
  );

  yield* waitFor(3);

  yield* all(
    scene.addText('verifier', '4. Check'),
    delay(
      1,
      (function* () {
        scene.verifierRef().expression('thinking');
      })(),
    ),
  );

  yield* waitFor(1);
  scene.verifierRef().expression('happy');

  yield* waitFor(5);
});
