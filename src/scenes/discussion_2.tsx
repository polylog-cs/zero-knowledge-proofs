import { makeScene2D, Node } from '@motion-canvas/2d';
import {
  all,
  createRef,
  delay,
  sequence,
  useLogger,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import { Cross } from '../components/cross';
import { Solarized } from '../utilities';
import { exampleGraphData, Graph } from '../utilities_graph';
import { nextTo, shift } from '../utilities_moving';
import { ProtocolScene } from '../utilities_protocol';
import { MyTxt } from '../utilities_text';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const logger = useLogger();

  const scene = new ProtocolScene(view);

  yield* scene.setup('center', true);

  const g = new Graph(75);
  g.initialize(exampleGraphData);
  const graphLayout = g.getGraphLayout();
  graphLayout.scale(0.6);
  view.add(graphLayout);
  nextTo(graphLayout, scene.verifierRef(), 'up', -100);
  yield* all(shift(scene.containerRef(), new Vector2(0, 150), 1), g.fadeIn(1));

  exampleGraphData;
  yield* scene.fadeInGraph(1);
  let fast = false;
  yield* waitFor(5);
  scene.verifierRef().expression('evil');
  const overlaidEdges = createRef<Node>();
  view.add(<Node ref={overlaidEdges} />);
  for (const e of [
    ['B', 'A'],
    //    ['C', 'B'],
    //    ['D', 'C'],
    ['C', 'E'],
    ['F', 'D'],
  ]) {
    yield* sequence(
      fast ? 0.2 : 0.3,
      scene.graphRef().pointAtEdge(e as [string, string], undefined, fast ? 0.7 : 1),
      scene.graphRef().unlockVertices(e, fast ? 0.6 : 1),
    );
    const copy = createRef<Node>();
    overlaidEdges().add(
      <Node
        absolutePosition={scene.graphRef().containerRef().absolutePosition}
        ref={copy}
      >
        {scene.graphRef().getVertex(e[0]).clone()}
        {scene.graphRef().getVertex(e[1]).clone()}
        {scene
          .graphRef()
          .getEdge(e as [string, string])
          .ref()
          .clone()}
      </Node>,
    );
    yield* all(
      copy().scale(graphLayout.scale, fast ? 0.7 : 1),
      copy().absolutePosition(graphLayout.absolutePosition, fast ? 0.7 : 1),
      delay(fast ? 0.2 : 0.6, scene.graphRef().lockVertices(e, fast ? 0.6 : 1)),
    );
    fast = true;
  }

  scene.proverRef().expression('alarmed');
  yield* waitFor(3);
  yield* all(
    overlaidEdges().opacity(0, 1),
    graphLayout.opacity(0, 1),
    scene.containerRef().opacity(0, 1),
  );
  overlaidEdges().opacity(1);
  overlaidEdges().removeChildren();
  scene.proverRef().expression('neutral');
  scene.verifierRef().expression('neutral');
  yield* waitFor(1);
  yield* scene.sendGraph('prover', 0);
  yield* all(scene.containerRef().opacity(1, 1));
  yield* scene.graphRef().unlockVertices();

  yield* waitFor(3);

  scene.proverRef().expression('thinking');
  for (let i = 0; i < 10; i++) {
    yield* scene.graphRef().shuffleColors(0.05);
    yield* waitFor(0.15);
  }
  scene.proverRef().expression('neutral');

  yield* waitFor(3);

  // Highlight the vertices that are originally red when shuffling.
  const v1 = scene.graphRef().getVertex('B');
  const v2 = scene.graphRef().getVertex('D');
  yield* all(v1.scale(1.42, 1), v2.scale(1.42, 1));
  yield* scene.shufflingColors(false, false, 10, 0.4, false);
  yield* all(v1.scale(1, 1), v2.scale(1, 1));

  fast = false;
  for (const [i, _e] of [
    ['B', 'A'],
    ['A', 'C'],
  ].entries()) {
    const e = _e as [string, string];
    yield* waitFor(3);
    yield* scene.shufflingColors(true, fast, 5);
    yield* scene.sendGraph('verifier', fast ? 0.5 : 1);

    if (i == 0) {
      yield* waitFor(2);
      yield* sequence(
        0.1,
        graphLayout.opacity(1, 1),
        scene.verifierRef().expression('evil', 0),
      );
    }
    yield* sequence(
      fast ? 0.2 : 0.3,
      scene.graphRef().pointAtEdge(e as [string, string], undefined, fast ? 0.7 : 1),
      scene.graphRef().unlockVertices(e, fast ? 0.6 : 1),
    );
    const copy = createRef<Node>();
    overlaidEdges().add(
      <Node
        absolutePosition={scene.graphRef().containerRef().absolutePosition}
        ref={copy}
      >
        {scene.graphRef().getVertex(e[0]).clone()}
        {scene.graphRef().getVertex(e[1]).clone()}
        {scene
          .graphRef()
          .getEdge(e as [string, string])
          .ref()
          .clone()}
      </Node>,
    );
    if (i == 1) {
      const cross = createRef<Cross>();
      view.add(
        <Cross
          ref={cross}
          position={() => g.containerRef().position().add([-90, -30])}
          scale={10}
          opacity={0}
        />,
      );

      yield* all(
        copy().scale(graphLayout.scale, 1),
        copy().absolutePosition(
          graphLayout.absolutePosition().addX(-70 * view.absoluteScale().magnitude),
          1,
        ),
      );
      scene.verifierRef().expression('alarmed');
      scene.proverRef().expression('happy');
      yield* all(
        cross().scale(5, 1),
        cross().opacity(1, 1),
        delay(0.8, cross().opacity(0, 1)),
      );
      // scene.verifierRef().expression('neutral');
      // scene.proverRef().expression('neutral');
      break;
    }
    yield* all(
      copy().scale(graphLayout.scale, fast ? 0.7 : 1),
      copy().absolutePosition(graphLayout.absolutePosition, fast ? 0.7 : 1),
      delay(fast ? 0.4 : 2, scene.graphRef().lockVertices(e, fast ? 0.6 : 1)),
      delay(fast ? 0.2 : 2, scene.sendGraph('prover', fast ? 0.5 : 1)),
    );
  }

  yield* waitFor(3);
});
