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

  const scene = new ProtocolScene(view);
  yield* scene.setup();

  yield* scene.addText('prover', 'I can color this');
  yield* scene.addText('verifier', 'Oh yeah?');
  yield* scene.removeText('both');

  yield* scene.sendGraph('prover');
  yield* scene.graphRef().applyColors();

  let revealedEdge = ['E', 'F'];
  let nonRevealedVertices = exampleGraphData.labels.filter(
    (label) => !revealedEdge.includes(label),
  );

  yield* scene.graphRef().lockVertices(nonRevealedVertices);
  yield* scene.sendGraph('verifier');

  yield* scene.addText('verifier', 'Hm...🧐');

  yield* all(
    scene.graphRef().pointAtVertex(revealedEdge[0], 1, true),
    scene.graphRef().pointAtVertex(revealedEdge[1], 1, true),
  );

  yield* scene.addText('verifier', 'Different colors');

  yield* all(scene.graphRef().removeArrows(), scene.removeText('verifier'));

  yield* scene.sendGraph('prover');
  yield* scene.graphRef().unlockVertices();

  yield* all(
    // TODO fix
    scene.graphRef().lockVertices(nonRevealedVertices, 5),
    sequence(0.1, ...Array.from({ length: 7 }, () => scene.graphRef().shuffleColors())),
  );
  yield* scene.graphRef().unlockVertices();

  revealedEdge = ['C', 'F'];
  nonRevealedVertices = exampleGraphData.labels.filter(
    (label) => !revealedEdge.includes(label),
  );

  yield* scene.graphRef().lockVertices(nonRevealedVertices);
  yield* scene.sendGraph('verifier');

  yield* scene.addText('verifier', '👀');

  yield* all(scene.graphRef().containerRef().opacity(0, 1), scene.removeText('both'));

  yield* waitFor(5);
});
