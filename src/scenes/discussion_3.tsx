import { Img, Line, makeScene2D } from '@motion-canvas/2d';
import { all, createRef, delay, sequence, Vector2, waitFor } from '@motion-canvas/core';

import garbage from '../assets/images/garbage.svg';
import { Solarized } from '../utilities';
import { exampleGraphData } from '../utilities_graph';
import { ProtocolScene } from '../utilities_protocol';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const scene = new ProtocolScene(view);

  yield* scene.setup('prover', false, false);
  for (const v of exampleGraphData.labels) {
    const image = createRef<Img>();
    scene
      .graphRef()
      .getVertex(v)
      .add(<Img src={garbage} ref={image} width={50} opacity={0} />);
  }

  const edges = [
    ['C', 'D'],
    ['E', 'F'],
  ];
  for (let i = 0; i < 2; i++) {
    const edge = edges[i];
    const arrowRef = createRef<Line>();
    scene.containerRef().add(
      <Line
        points={() => {
          return [
            scene
              .proverRef()
              .cacheBBox()
              .topLeft.add(scene.proverRef().cacheBBox().topRight)
              .mul(0.5)
              .add(scene.proverRef().position())
              .addY(-10)
              .addX(110),
            scene
              .graphRef()
              .getVertex(edge[0])
              .position()
              .add(scene.graphRef().getVertex(edge[1]).position())
              .mul(0.5)
              .add(scene.graphRef().containerRef().position()),
          ];
        }}
        lineWidth={8}
        stroke={Solarized.gray}
        endArrow
        ref={arrowRef}
        arrowSize={30}
        opacity={0}
        end={0.95}
      />,
    );

    yield* all(
      scene.addText('prover', 'He will look here'),
      arrowRef().opacity(1, 0.5),
    );
    scene.proverRef().expression('evil');
    yield* waitFor(1);
    yield* all(
      scene.graphRef().changeVertexColor(edge[0], Solarized.red),
      scene.graphRef().changeVertexColor(edge[1], Solarized.green),
    );
    yield* waitFor(1);
    yield* all(
      ...['A', 'B', 'C', 'D', 'E', 'F'].map((c) =>
        scene
          .graphRef()
          .getVertex(c)
          .children()[0]
          .opacity(edge[0] == c || edge[1] == c ? 0 : 1, 1),
      ),
    );
    yield* waitFor(1);
    scene.proverRef().expression('neutral');
    yield* all(
      scene.proverTexts[0]().opacity(0, 1.5),
      arrowRef().opacity(0, 1.5),
      scene.graphRef().lockVertices(),
    );
    yield* scene.sendGraph('verifier');
    yield* sequence(
      0.5,
      scene.graphRef().pointAtEdge(edge as [string, string], undefined, 1),
      scene.graphRef().unlockVertices(edge),
    );
    yield* scene.addText('verifier', '✅');
    scene.proverRef().expression('evil');
    yield* all(waitFor(1), scene.removeText('prover'));
    scene.proverRef().expression('neutral');
    yield* all(scene.removeText('verifier'), scene.sendGraph('prover'));
    yield* scene.graphRef().unlockVertices(undefined, 1);
    yield* all(
      scene.graphRef().uncolor(1, 0),
      ...['A', 'B', 'C', 'D', 'E', 'F'].map((c) =>
        scene.graphRef().getVertex(c).children()[0].opacity(0, 1),
      ),
    );
  }
  yield* waitFor(3);
});
