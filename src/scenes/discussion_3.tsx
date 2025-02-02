import { Img, Line, makeScene2D, Txt } from '@motion-canvas/2d';
import { all, createRef, delay, sequence, Vector2, waitFor } from '@motion-canvas/core';

import garbage from '../assets/images/garbage.svg';
import { Solarized } from '../utilities';
import { exampleGraphData } from '../utilities_graph';
import { ProtocolScene } from '../utilities_protocol';
import { MyTxt } from '../utilities_text';

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);
  const scene = new ProtocolScene(view);

  yield* scene.setup('prover', false, false);
  for (const v of exampleGraphData.labels) {
    const image = createRef<Img>();
    scene
      .graphRef()
      .getVertex(v)
      .add(
        <MyTxt ref={image} fontSize={64} opacity={0}>
          💩
        </MyTxt>,
      );
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
        stroke={Solarized.proverText}
        endArrow
        ref={arrowRef}
        arrowSize={30}
        opacity={0}
        end={0.95}
      />,
    );

    scene.proverRef().expression('thinking');
    yield* all(
      scene.addText('prover', 'He will look here'),
      arrowRef().opacity(1, 0.5),
    );
    yield* waitFor(1);
    scene.proverRef().expression('evil');

    const chosenEdgeAnims = all(
      scene.graphRef().changeVertexColor(edge[0], Solarized.red),
      scene.graphRef().changeVertexColor(edge[1], Solarized.green),
    );
    const otherEdgeAnims = all(
      ...['A', 'B', 'C', 'D', 'E', 'F'].map((c) =>
        scene
          .graphRef()
          .getVertex(c)
          .children()[0]
          .opacity(edge[0] == c || edge[1] == c ? 0 : 1, 1),
      ),
    );
    if (i == 0) {
      yield* chosenEdgeAnims;
      yield* waitFor(1);
      yield* otherEdgeAnims;
    } else {
      yield* all(chosenEdgeAnims, otherEdgeAnims);
    }

    yield* waitFor(1);

    yield* all(
      scene.proverTexts[0]().opacity(0, 1.5),
      arrowRef().opacity(0, 1.5),
      scene.graphRef().lockVertices(),
    );
    scene.proverRef().expression('neutral');
    yield* scene.sendGraph('verifier');
    yield* sequence(
      0.5,
      scene.graphRef().pointAtEdge(edge as [string, string], undefined, 1),
      scene.graphRef().unlockVertices(edge),
    );
    scene.verifierRef().expression('happy');
    yield* scene.addText('verifier', '✅');
    scene.proverRef().expression('evil');
    yield* all(waitFor(1), scene.removeText('prover'));
    scene.proverRef().expression('neutral');
    scene.verifierRef().expression('neutral');
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
