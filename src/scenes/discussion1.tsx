import { makeScene2D, Spline, Rect } from '@motion-canvas/2d';
import {
  useLogger,
  waitFor,
  createRef,
  Vector2,
  all,
  sequence,
} from '@motion-canvas/core';
import { LockableGraph } from '../utilities_lockable_graph';
import { Graph, exampleGraphData } from '../utilities_graph';
import { Solarized, logPosition } from '../utilities';
import { ProtocolScene } from '../utilities_protocol';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  yield* waitFor(1);

  const scene = new ProtocolScene(view);

  yield* all(scene.addParticipant('prover'), scene.addParticipant('verifier'));
  yield* scene.createGraph(exampleGraphData, 'verifier', 0);
  yield* scene.graphRef().applyColors();
  yield* scene.graphRef().lockVertices();
  yield* scene.fadeInGraph(1);

  yield* scene.graphRef().pointAtRandomEdges(['A', 'B'], 10, 3, 50);
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
    scene.sendGraph('prover', 0)
  );

  yield* scene.fadeInGraph(1);

  yield* scene.graphRef().pointAtEdge(['E', 'F'], true, 1, false);

  yield* scene.graphRef().lockVertices();
  yield* scene.sendGraph('verifier', 1);

  yield* scene.graphRef().pointAtRandomEdges(['E', 'F'], 10, 3, 50);

  yield* scene.graphRef().unlockVertices(scene.graphRef().challengeEdge);

  yield* all(scene.addText('prover', '😅'), scene.addText('verifier', '😮/🤨/‼️'));
  yield* waitFor(1);
  yield* all(scene.fadeOutGraph(1), scene.removeText('both'));

  // evidence from seeing different colors

  yield* all(
    scene.graphRef().applyColors(0, 0, improperColoring),
    scene.sendGraph('prover', 0),
    scene.graphRef().lockVertices()
  );

  yield* scene.fadeInGraph(1);
  yield* scene.sendGraph('verifier', 1);

  yield* scene.challenge();

  yield* scene.fadeOutGraph(1);

  yield* waitFor(2);
});
