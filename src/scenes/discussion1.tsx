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

  yield* scene.setup('verifier', true);

  yield* scene.graphRef().lockVertices();
  yield* scene.fadeInGraph(1);

  yield* scene.graphRef().pointAtRandomEdges(['A', 'B']);
  yield* scene.graphRef().unlockVertices(scene.graphRef().challengeEdge);

  yield* scene.fadeOutGraph(1);

  // improper coloring example
  const improperColoring = new Map([
    ['A', 0],
    ['B', 1],
    ['C', 2],
    ['D', 1],
    ['E', 0],
    ['F', 0],
  ]);
  yield* all(
    scene.graphRef().applyColors(0, 0, improperColoring),
    scene.sendGraph('prover', 0),
  );

  yield* scene.fadeInGraph(1);

  yield* scene.graphRef().pointAtEdge(['E', 'F'], true, 1, false);

  yield* scene.graphRef().lockVertices();
  yield* scene.sendGraph('verifier', 1);

  yield* scene.graphRef().pointAtRandomEdges(['E', 'F']);

  yield* scene.graphRef().unlockVertices(scene.graphRef().challengeEdge);

  yield* all(scene.addText('prover', '😅'), scene.addText('verifier', '😮/🤨/‼️'));
  yield* waitFor(1);
  yield* all(scene.fadeOutGraph(1), scene.removeText('both'));

  // evidence from seeing different colors

  yield* all(
    scene.graphRef().applyColors(0, 0, improperColoring),
    scene.sendGraph('prover', 0),
    scene.graphRef().lockVertices(),
  );

  yield* scene.fadeInGraph(1);
  yield* scene.sendGraph('verifier', 1);

  yield* scene.challenge();

  yield* scene.fadeOutGraph(1);

  yield* waitFor(2);
});
