import {
  Circle,
  Img,
  Layout,
  Line,
  makeScene2D,
  Node,
  NodeProps,
  LayoutProps,
  Rect,
  Txt,
} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  delay,
  easeInExpo,
  easeInOutExpo,
  linear,
  loop,
  Reference,
  Vector2,
  waitFor,
} from '@motion-canvas/core';
import { Solarized } from '../utilities';

import android_logo from '../assets/icons/android-brands-solid.svg';
import user_tie from '../assets/icons/user-tie-solid.svg';
import vasek1 from '../assets/images/vasek.png';
import vasek2 from '../assets/images/vasek2.png';

import gradientShader from '../shaders/gradient2.glsl';

import chroma from 'chroma-js';

export interface BadgeProps extends LayoutProps {
  image: string;
  width?: number;
  height?: number;
  text?: string;
  monochromatic?: boolean;
}

export class Badge extends Layout {
  public readonly circle = createRef<Circle>();
  private readonly image = createRef<Txt>();
  private readonly text = createRef<Txt>();
  public constructor(props?: BadgeProps) {
    props.layout = true;
    props.gap = 50;
    props.alignItems = 'center';
    props.direction = 'column';
    super({ ...props });

    this.add(
      <>
        <Circle ref={this.circle} stroke={Solarized.base02} lineWidth={20} size={300}>
          <Circle
            layout={false}
            size={() => this.circle().width() - 20}
            fill={Solarized.base1}
            shaders={{
              fragment: gradientShader,
              uniforms: {
                mixColor: chroma('white')
                  .rgba()
                  .map((i) => i / 256),
                mixStrength: 8,
                distFactor: 1,
                position: () => this.image().position(),
              },
            }}
          ></Circle>
          <Node cache>
            <Img
              ref={this.image}
              layout={false}
              width={() => this.circle().width() / 2}
              src={props.image}
            />
            <Rect
              layout={false}
              size={() => Math.max(this.image().width(), this.image().height()) * 5}
              rotation={this.image().rotation}
              fill={Solarized.base02}
              compositeOperation={'source-in'}
              opacity={(props.monochromatic ?? false) ? 1 : 0}
            />
          </Node>
        </Circle>
        <Txt
          fontFamily={'Fira Sans'}
          ref={this.text}
          textAlign={'center'}
          fontSize={50}
          text={props.text}
        />
      </>,
    );
  }
}

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const prover = createRef<Badge>();
  const authority = createRef<Badge>();
  const verifier = createRef<Badge>();
  const lineSilent = createRef<Line>();
  const lineHonest = createRef<Line>();

  view.add(
    <>
      <Layout layout gap={400} alignItems={'center'} direction={'row'}>
        <Badge ref={prover} image={vasek1} text="prover" />
        <Badge
          ref={authority}
          image={android_logo}
          text="authority"
          monochromatic
          y={-200}
        />
        <Badge ref={verifier} image={vasek2} text="verifier" />
      </Layout>
      <Line
        ref={lineSilent}
        points={() => {
          let b = prover().position().add(prover().circle().right().addX(20));
          let a = authority().position().add(authority().circle().left().addX(-20));

          return [b, a];
        }}
        lineWidth={20}
        stroke={Solarized.cyan}
        lineDash={[50, 30]}
      />
      <Txt
        position={lineSilent()
          .parsedPoints()[0]
          .add(lineSilent().parsedPoints()[1])
          .mul(0.5)
          .addY(-100)}
        text="🤐"
        fontSize={100}
      />
      <Line
        ref={lineHonest}
        points={() => {
          let b = verifier().position().add(verifier().circle().left().addX(-20));
          let a = authority().position().add(authority().circle().right().addX(20));

          return [b, a];
        }}
        lineWidth={20}
        stroke={Solarized.cyan}
        lineDash={[50, 30]}
      />
      <Txt
        position={lineHonest()
          .parsedPoints()[0]
          .add(lineHonest().parsedPoints()[1])
          .mul(0.5)
          .addY(-100)}
        text="🤝"
        fontSize={100}
      />
    </>,
  );

  yield* waitFor(1);
});
