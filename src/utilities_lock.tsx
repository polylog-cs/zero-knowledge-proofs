import { Circle, Layout, Node, NodeProps, Rect } from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
  easeInOutExpo,
  SimpleSignal,
} from '@motion-canvas/core';
import chroma from 'chroma-js';

import gradientShader from './shaders/gradient.glsl';
import { Solarized } from './utilities';

export interface LockProps extends NodeProps {
  object?: Layout;
}

export class Lock extends Node {
  private readonly background = createRef<Rect>();
  private readonly top = createRef<Rect>();
  private readonly bottom = createRef<Rect>();
  private readonly lockTop = createRef<Circle>();
  private readonly lockBottom = createRef<Circle>();

  private readonly object: Layout = null;

  private readonly openScale: SimpleSignal<number> = createSignal(1.5);

  private locked: boolean = false;

  public constructor(props?: LockProps) {
    super({ ...props });

    this.object = props.object;

    const w = () => this.object.size.x() * 1.25;
    const h = () => this.object.size.y() * 1.25;

    const r = () => w() / 4;
    const lw = () => r() / 2;

    this.add(
      <>
        <Rect
          ref={this.background}
          //key="background"
          width={w}
          height={() => h() * this.openScale()}
          fill={Solarized.base02}
          stroke={Solarized.base01}
          scale={0}
          lineWidth={lw}
          zIndex={-1}
          radius={r}
          position={this.object.position}
        />
        <Rect
          ref={this.top}
          //key="top"
          width={w}
          height={() => h() / 2}
          fill={Solarized.base00}
          zIndex={1}
          top={this.background().top}
          opacity={0}
          radius={() => [r(), r(), 0, 0]}
          shaders={{
            fragment: gradientShader,
            uniforms: {
              mixColor: [0, 0, 0, 0],
              mixStrength: 0.5,
              offset: 0.5,
            },
          }}
        />
        <Rect
          ref={this.bottom}
          //key="bottom"
          width={w}
          height={() => h() / 2}
          fill={Solarized.base00}
          zIndex={1}
          bottom={this.background().bottom}
          opacity={0}
          radius={() => [0, 0, r(), r()]}
          shaders={{
            fragment: gradientShader,
            uniforms: {
              mixColor: [0, 0, 0, 0],
              mixStrength: 0.5,
              offset: 0.0,
            },
          }}
        />
        <Circle
          ref={this.lockTop}
          //key="lockTop"
          startAngle={180}
          endAngle={0}
          position={this.top().bottom}
          fill={Solarized.base1}
          lineWidth={() => lw() / 2}
          stroke={() => chroma(this.lockTop().fill().toString()).darken(0.3)}
          size={() => w() * 0.5}
          opacity={this.top().opacity}
          zIndex={2}
        />
        <Circle
          ref={this.lockBottom}
          //key="lockBottom"
          startAngle={0}
          endAngle={180}
          position={this.bottom().top}
          fill={Solarized.base1}
          lineWidth={() => lw() / 2}
          stroke={() => chroma(this.lockTop().fill().toString()).darken(0.3)}
          size={() => w() * 0.5}
          opacity={this.bottom().opacity}
          zIndex={2}
        />
      </>,
    );
  }

  public *lock(duration: number = 1.5) {
    const t = duration / 3;

    if (!this.children().includes(this.object)) {
      this.add(this.object);
    }

    yield* all(
      this.background().scale(1, t * 2),
      delay(
        t,
        all(
          this.openScale(1, t * 2, easeInOutExpo),
          this.top().opacity(1, t * 2),
          this.bottom().opacity(1, t * 2),
          this.object.opacity(0, t * 2),
        ),
      ),
    );
    this.locked = true;
  }

  public *unlock(duration: number = 1.5) {
    const t = duration / 3;

    yield* all(
      all(
        this.openScale(1.5, t * 2, easeInOutExpo),
        this.top().opacity(0, t * 2),
        this.bottom().opacity(0, t * 2),
        this.object.opacity(1, t * 2),
      ),
      delay(t, this.background().scale(0, t * 2)),
    );
    this.locked = false;
  }

  public *seethrough(duration: number = 1, opacity: number = 0.7) {
    if (!this.locked) return;
    yield* all(
      this.object.opacity(1, 0),
      this.background().opacity(0, duration),
      this.top().opacity(opacity, duration),
      this.bottom().opacity(opacity, duration),
    );
  }

  public *unseethrough(duration: number = 1) {
    if (!this.locked) return;
    yield* all(
      this.background().opacity(1, duration),
      this.top().opacity(1, duration),
      this.bottom().opacity(1, duration),
      delay(duration, this.object.opacity(0, 0)),
    );
  }
}
