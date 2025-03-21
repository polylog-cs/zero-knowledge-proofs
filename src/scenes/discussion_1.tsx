import { makeScene2D } from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
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
  yield* all(scene.fadeOutGraph(1), scene.removeText('both'));
  scene.proverRef().expression('neutral');
  scene.verifierRef().expression('neutral');

  // evidence from seeing different colors

  const properColors = new Map(
    exampleGraphData.labels.map((label, index) => [
      label,
      exampleGraphData.colors[index],
    ]),
  );

  yield* all(
    scene.graphRef().applyColors(0, 0, properColors),
    scene.sendGraph('prover', 0),
    scene.graphRef().lockVertices(),
  );

  yield* scene.fadeInGraph(1);
  yield* scene.sendGraph('verifier', 1);

  yield* scene.challenge();
  yield* scene.fadeOutGraph(1);

  yield* all(scene.sendGraph('prover', 0), scene.graphRef().lockVertices());

  // getting evidence in each step

  const probabilityRef = createRef<MyTxt>();
  view.add(
    <MyTxt
      ref={probabilityRef}
      position={[0, -400]}
      text="P(prover fools me | prover cheats)"
      fontSize={60}
      fill={Solarized.text}
      opacity={0}
    />,
  );
  yield* all(
    shift(scene.containerRef(), new Vector2(0, 150), 1),
    probabilityRef().opacity(1, 1),
  );
  const productContainerRef = createRef<MyTxt>();

  view.add(
    <MyTxt
      ref={productContainerRef}
      position={[0, -150]}
      text="="
      fontSize={60}
      fill={Solarized.text}
      opacity={0}
    />,
  );
  nextTo(productContainerRef(), probabilityRef(), 'down', 30);
  alignTo(productContainerRef(), probabilityRef(), 'left');
  yield* productContainerRef().opacity(1, 1);
  const flyingTextRefs: Array<Reference<MyTxt>> = [];
  flyingTextRefs.push(productContainerRef);

  yield* scene.fadeInGraph(1);
  for (let i = 0; i < 5; i++) {
    let duration = 1;
    let shortened = false;
    if (i >= 1) {
      duration = 0.3;
      shortened = true;
    }

    yield* scene.sendGraph('verifier', duration);
    yield* scene.challenge(true, shortened);

    const flyingRef = createRef<MyTxt>();

    view.add(
      <MyLatex
        ref={flyingRef}
        tex={i == 0 ? '\\frac{6}{7}' : '\\cdot \\, \\frac{6}{7}'}
        opacity={0}
        fontSize={40}
      />,
    );
    flyingRef()
      .absolutePosition(scene.verifierRef().absolutePosition())
      .add(new Vector2(-100, -200));
    yield* all(
      flyingRef().opacity(1, 0.5),
      nextTo(
        flyingRef(),
        flyingTextRefs[flyingTextRefs.length - 1](),
        'right',
        0,
        shortened ? 0.5 : 1,
      ),
      scene.sendGraph('prover', duration),
    );
    flyingTextRefs.push(flyingRef);

    yield* scene.graphRef().lockVertices(undefined, shortened ? 0.5 : undefined);
    if (!shortened) yield* waitFor(0.5);
  }

  const finalTextRef = createRef<MyTxt>();
  view.add(
    <MyLatex
      ref={finalTextRef}
      tex={
        '\\cdot \\dots \\,  = \\left( \\frac{6}{7} \\right)^{100} \\approx 2\\cdot 10^{-7}'
      }
      position={productContainerRef().absolutePosition()}
      fontSize={40}
      fill={Solarized.text}
      opacity={0}
    />,
  );
  nextTo(finalTextRef(), flyingTextRefs[flyingTextRefs.length - 1](), 'right', 0, 0);
  yield* finalTextRef().opacity(1, 1);
  yield* waitFor(1);
  scene.verifierRef().expression('happy');

  // learning the coloring

  yield* waitFor(2);
});
