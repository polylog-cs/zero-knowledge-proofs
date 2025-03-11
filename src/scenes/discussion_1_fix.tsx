import { makeScene2D } from '@motion-canvas/2d';
import {
  all,
  createEaseInElastic,
  createEaseInOutElastic,
  createEaseOutElastic,
  createRef,
  delay,
  easeInCubic,
  easeInExpo,
  easeInQuad,
  easeOutExpo,
  Reference,
  sequence,
  useLogger,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import { Solarized } from '../utilities';
import { exampleGraphData } from '../utilities_graph';
import { alignTo, nextTo, shift } from '../utilities_moving';
import { ProtocolScene } from '../utilities_protocol';
import { MyLatex, MyTxt } from '../utilities_text';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  const scene = new ProtocolScene(view);

  yield* scene.setup('verifier', true);

  yield* scene.graphRef().lockVertices();
  yield* scene.fadeInGraph(1);

  yield* scene.graphRef().pointAtRandomEdges(['A', 'B'], 1);
  yield* scene.graphRef().unlockVertices(scene.graphRef().challengeEdge);
  yield* waitFor(1);

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

  // vv: reverted back to pointAtEdge here for consistency with the other scenes
  // const e = scene.graphRef().getEdge(['E', 'F']).ref();
  // const v1 = scene.graphRef().getVertex('E');
  // const v2 = scene.graphRef().getVertex('F');
  // yield* sequence(
  //   0,
  //   all(v1.scale(1.42, 1), v2.scale(1.42, 1), e.lineWidth(2 * e.lineWidth(), 1)),
  //   delay(1, all(v1.scale(1, 1), v2.scale(1, 1), e.lineWidth(e.lineWidth(), 1))),
  // );
  yield* scene.graphRef().pointAtEdge(['E', 'F'], true, 2, false);

  yield* scene.graphRef().lockVertices();
  yield* scene.sendGraph('verifier', 1);

  yield* scene.graphRef().pointAtRandomEdges(['E', 'F']);

  yield* scene.graphRef().unlockVertices(scene.graphRef().challengeEdge);

  scene.proverRef().expression('embarrassed');
  scene.verifierRef().expression('alarmed');

  yield* waitFor(2);

  let chance_ref = createRef<MyLatex>();

  view.add(
    <MyLatex
      ref={chance_ref}
      tex={'\\ge \\frac{1}{7}'}
      opacity={0}
      fontSize={70}
      position={[320, 200]}
    />,
  );

  yield* all(shift(chance_ref(), new Vector2(50, 50), 1), chance_ref().opacity(1, 1));

  yield* all(
    ...[...improperColoring.keys()].map((v, i) =>
      delay(i * 0.05, scene.graphRef().getVertex(v).size(new Vector2(90, 90), 0.5)),
    ),
    scene.graphRef().fadeEdgesSequential(0, 1, null, 0.25),
  );

  yield* all(
    chance_ref().opacity(0, 1),
    scene.graphRef().fadeEdgesSequential(0, 1, null, 1),
    ...[...improperColoring.keys()].map((v, i) =>
      scene.graphRef().getVertex(v).size(new Vector2(75, 75), 1),
    ),
  );
});
